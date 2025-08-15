/**
 * FEES Module Services
 * Business logic layer for Fee Management
 */

import type {
  Fees05001RequestT,
  Fees05001ResponseT,
  Fees05002RequestT,
  Fees05002ResponseT,
  Fees05003RequestT,
  Fees05003ResponseT,
  Fees05004RequestT,
  Fees05004ResponseT,
  Fees05005RequestT,
  Fees05005ResponseT,
  Fees05006RequestT,
  Fees05006ResponseT,
  Fees05007RequestT,
  Fees05007ResponseT,
  Fees05008RequestT,
  Fees05008ResponseT,
  Fees05009RequestT,
  Fees05009ResponseT,
  Fees05010RequestT,
  Fees05010ResponseT,
} from './dtos';
import * as repo from './repos';

// FEES-05-001: Fee heads & structures
export async function fees_05_001Service(input: Fees05001RequestT, trustId: number): Promise<Fees05001ResponseT> {
  const { fee_head_name, class_id, academic_year_id, amount, installments, is_mandatory, description } = input;

  // Business validation
  if (installments.length === 0) {
    throw new Error('At least one installment is required');
  }

  const totalInstallmentAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
  if (Math.abs(totalInstallmentAmount - amount) > 0.01) {
    throw new Error('Total installment amount must equal fee head amount');
  }

  // Check for duplicate fee head for same class and academic year
  const existingFeeHead = await repo.findFeeHeadByClassAndYear(class_id, academic_year_id, fee_head_name, trustId);
  if (existingFeeHead) {
    throw new Error('Fee head already exists for this class and academic year');
  }

  // Create fee head and structure
  const feeHeadData = {
    fee_head_name,
    class_id,
    academic_year_id,
    is_mandatory: is_mandatory ?? true,
    description: description ?? null,
  };

  const feeHead = await repo.createFeeHead(feeHeadData, trustId);
  
  const feeStructureData = {
    fee_head_id: feeHead.fee_head_id,
    class_id,
    academic_year_id,
    total_amount: amount,
  };

  const feeStructure = await repo.createFeeStructure(feeStructureData, trustId);

  // Create installments
  for (const installment of installments) {
    const installmentData = {
      fee_structure_id: feeStructure.fee_structure_id,
      installment_name: installment.installment_name,
      due_date: installment.due_date,
      amount: installment.amount,
    };
    await repo.createInstallment(installmentData, trustId);
  }

  return {
    fee_structure_id: feeStructure.fee_structure_id,
    fee_head_id: feeHead.fee_head_id,
    fee_head_name: feeHead.fee_head_name,
    class_id: feeHead.class_id,
    academic_year_id: feeHead.academic_year_id,
    total_amount: feeStructure.total_amount,
    installments_created: installments.length,
    created_at: feeStructure.created_at,
  };
}

// FEES-05-002: Class & student fee mapping
export async function fees_05_002Service(input: Fees05002RequestT, trustId: number): Promise<Fees05002ResponseT> {
  const { student_id, fee_structure_id, discount_percentage, discount_amount, special_instructions } = input;

  // Business validation
  if ((discount_percentage ?? 0) > 0 && (discount_amount ?? 0) > 0) {
    throw new Error('Cannot apply both percentage and fixed amount discount');
  }

  // Verify student exists and is active
  const student = await repo.findStudentById(student_id, trustId);
  if (!student || !student.is_active) {
    throw new Error('Student not found or inactive');
  }

  // Verify fee structure exists
  const feeStructure = await repo.findFeeStructureById(fee_structure_id, trustId);
  if (!feeStructure) {
    throw new Error('Fee structure not found');
  }

  // Check if assignment already exists
  const existingAssignment = await repo.findStudentFeeAssignment(student_id, fee_structure_id, trustId);
  if (existingAssignment) {
    throw new Error('Fee structure already assigned to this student');
  }

  // Calculate discount and final amount
  const totalAmount = feeStructure.total_amount;
  let discountApplied = 0;

  if ((discount_percentage ?? 0) > 0) {
    discountApplied = (totalAmount * (discount_percentage ?? 0)) / 100;
  } else if ((discount_amount ?? 0) > 0) {
    discountApplied = discount_amount ?? 0;
  }

  const finalAmount = totalAmount - discountApplied;

  const assignmentData = {
    student_id,
    fee_structure_id,
    total_amount: totalAmount,
    discount_percentage: discount_percentage ?? 0,
    discount_amount: discount_amount ?? 0,
    final_amount: finalAmount,
    balance_amount: finalAmount,
    special_instructions: special_instructions ?? null,
  };

  const assignment = await repo.createStudentFeeAssignment(assignmentData, trustId);

  return {
    assignment_id: assignment.assignment_id,
    student_id: assignment.student_id,
    fee_structure_id: assignment.fee_structure_id,
    total_amount: assignment.total_amount,
    discount_applied: discountApplied,
    final_amount: assignment.final_amount,
    balance_amount: assignment.balance_amount,
    created_at: assignment.created_at,
  };
}

// FEES-05-003: Discount allocation
export async function fees_05_003Service(input: Fees05003RequestT, trustId: number): Promise<Fees05003ResponseT> {
  const { student_fee_assignment_id, discount_type, discount_percentage, discount_amount, reason, approved_by, valid_until } = input;

  // Business validation
  if (discount_type === 'PERCENTAGE' && !discount_percentage) {
    throw new Error('Discount percentage is required for percentage discount type');
  }
  if (discount_type === 'FIXED_AMOUNT' && !discount_amount) {
    throw new Error('Discount amount is required for fixed amount discount type');
  }

  // Verify assignment exists
  const assignment = await repo.findStudentFeeAssignmentById(student_fee_assignment_id, trustId);
  if (!assignment) {
    throw new Error('Student fee assignment not found');
  }

  // Calculate new discount
  let newDiscountAmount = 0;
  if (discount_type === 'PERCENTAGE' && discount_percentage) {
    newDiscountAmount = (assignment.total_amount * discount_percentage) / 100;
  } else if (discount_type === 'FIXED_AMOUNT' && discount_amount) {
    newDiscountAmount = discount_amount;
  }

  const newBalance = assignment.total_amount - newDiscountAmount;

  // Update assignment with new discount
  const updateData = {
    discount_percentage: discount_type === 'PERCENTAGE' ? (discount_percentage ?? 0) : 0,
    discount_amount: discount_type === 'FIXED_AMOUNT' ? (discount_amount ?? 0) : newDiscountAmount,
    final_amount: newBalance,
    balance_amount: newBalance,
  };

  await repo.updateStudentFeeAssignment(student_fee_assignment_id, updateData, trustId);

  // Log discount allocation
  const discountLogData = {
    student_fee_assignment_id,
    discount_type,
    discount_percentage: discount_percentage ?? null,
    discount_amount: newDiscountAmount,
    reason,
    approved_by,
    valid_until: valid_until ?? null,
  };

  await repo.createDiscountLog(discountLogData, trustId);

  return {
    assignment_id: student_fee_assignment_id,
    discount_type,
    discount_applied: newDiscountAmount,
    new_balance: newBalance,
    updated_at: new Date().toISOString(),
  };
}

// FEES-05-004: Transport/optional services
export async function fees_05_004Service(input: Fees05004RequestT, trustId: number): Promise<Fees05004ResponseT> {
  const { student_id, service_type, monthly_fee, start_date, end_date, route_details } = input;

  // Business validation
  const startDateObj = new Date(start_date);
  const endDateObj = end_date ? new Date(end_date) : new Date(startDateObj.getFullYear() + 1, startDateObj.getMonth(), startDateObj.getDate());

  if (endDateObj <= startDateObj) {
    throw new Error('End date must be after start date');
  }

  // Verify student exists
  const student = await repo.findStudentById(student_id, trustId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Check for overlapping service assignments
  const existingAssignment = await repo.findOverlappingServiceAssignment(student_id, service_type, start_date, endDateObj.toISOString().split('T')[0], trustId);
  if (existingAssignment) {
    throw new Error('Overlapping service assignment exists for this student');
  }

  // Calculate total months and amount
  const totalMonths = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const totalAmount = monthly_fee * totalMonths;

  const serviceData = {
    student_id,
    service_type,
    monthly_fee,
    start_date,
    end_date: endDateObj.toISOString().split('T')[0],
    route_details: route_details ?? null,
    total_months: totalMonths,
    total_amount: totalAmount,
  };

  const serviceAssignment = await repo.createServiceAssignment(serviceData, trustId);

  return {
    service_assignment_id: serviceAssignment.service_assignment_id,
    student_id: serviceAssignment.student_id,
    service_type: serviceAssignment.service_type,
    monthly_fee: serviceAssignment.monthly_fee,
    total_months: serviceAssignment.total_months,
    total_amount: serviceAssignment.total_amount,
    created_at: serviceAssignment.created_at,
  };
}

// Placeholder services for remaining activities
export async function fees_05_005Service(input: Fees05005RequestT, trustId: number): Promise<Fees05005ResponseT> {
  // TODO: Implement late fee rules configuration
  throw new Error('FEES-05-005 service not implemented yet');
}

export async function fees_05_006Service(input: Fees05006RequestT, trustId: number): Promise<Fees05006ResponseT> {
  // TODO: Implement fee collection & receipts
  throw new Error('FEES-05-006 service not implemented yet');
}

export async function fees_05_007Service(input: Fees05007RequestT, trustId: number): Promise<Fees05007ResponseT> {
  // TODO: Implement payment gateway integration
  throw new Error('FEES-05-007 service not implemented yet');
}

export async function fees_05_008Service(input: Fees05008RequestT, trustId: number): Promise<Fees05008ResponseT> {
  // TODO: Implement refunds & adjustments
  throw new Error('FEES-05-008 service not implemented yet');
}

export async function fees_05_009Service(input: Fees05009RequestT, trustId: number): Promise<Fees05009ResponseT> {
  // TODO: Implement reports, reconciliation & defaulters
  throw new Error('FEES-05-009 service not implemented yet');
}

export async function fees_05_010Service(input: Fees05010RequestT, trustId: number): Promise<Fees05010ResponseT> {
  // TODO: Implement fee forecasting
  throw new Error('FEES-05-010 service not implemented yet');
}
