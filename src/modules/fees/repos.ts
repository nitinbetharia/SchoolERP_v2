/**
 * FEES Module Repository
 * Data access layer for Fee Management with parameterized queries
 */

import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbManager } from '../../lib/database';

// Fee Head operations
export async function findFeeHeadByClassAndYear(
  classId: number,
  academicYearId: number,
  feeHeadName: string,
  trustId: number
): Promise<any> {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT fee_head_id, fee_head_name, class_id, academic_year_id 
     FROM fee_heads 
     WHERE class_id = ? AND academic_year_id = ? AND fee_head_name = ?`,
    [classId, academicYearId, feeHeadName]
  );
  return rows[0] || null;
}

export async function createFeeHead(feeHeadData: any, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO fee_heads 
     (trust_id, fee_head_name, class_id, academic_year_id, is_mandatory, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      trustId,
      feeHeadData.fee_head_name,
      feeHeadData.class_id,
      feeHeadData.academic_year_id,
      feeHeadData.is_mandatory,
      feeHeadData.description,
    ]
  );

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT fee_head_id, fee_head_name, class_id, academic_year_id, created_at 
     FROM fee_heads WHERE fee_head_id = ?`,
    [result.insertId]
  );
  return rows[0];
}

// Fee Structure operations
export async function createFeeStructure(feeStructureData: any, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO fee_structures 
     (trust_id, fee_head_id, class_id, academic_year_id, total_amount, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      trustId,
      feeStructureData.fee_head_id,
      feeStructureData.class_id,
      feeStructureData.academic_year_id,
      feeStructureData.total_amount,
    ]
  );

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT fee_structure_id, fee_head_id, class_id, academic_year_id, total_amount, created_at 
     FROM fee_structures WHERE fee_structure_id = ?`,
    [result.insertId]
  );
  return rows[0];
}

export async function findFeeStructureById(feeStructureId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT fee_structure_id, fee_head_id, class_id, academic_year_id, total_amount 
     FROM fee_structures WHERE fee_structure_id = ?`,
    [feeStructureId]
  );
  return rows[0] || null;
}

// Fee Installment operations
export async function createInstallment(installmentData: any, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO fee_installments 
     (trust_id, fee_structure_id, installment_name, due_date, amount, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      trustId,
      installmentData.fee_structure_id,
      installmentData.installment_name,
      installmentData.due_date,
      installmentData.amount,
    ]
  );
  return { installment_id: result.insertId };
}

// Student operations
export async function findStudentById(studentId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT student_id, first_name, last_name, is_active 
     FROM students WHERE student_id = ?`,
    [studentId]
  );
  return rows[0] || null;
}

// Student Fee Assignment operations
export async function findStudentFeeAssignment(studentId: number, feeStructureId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT assignment_id, student_id, fee_structure_id 
     FROM student_fee_assignments 
     WHERE student_id = ? AND fee_structure_id = ?`,
    [studentId, feeStructureId]
  );
  return rows[0] || null;
}

export async function findStudentFeeAssignmentById(assignmentId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT assignment_id, student_id, fee_structure_id, total_amount, 
            discount_percentage, discount_amount, final_amount, balance_amount 
     FROM student_fee_assignments WHERE assignment_id = ?`,
    [assignmentId]
  );
  return rows[0] || null;
}

export async function createStudentFeeAssignment(assignmentData: any, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO student_fee_assignments 
     (trust_id, student_id, fee_structure_id, total_amount, discount_percentage, 
      discount_amount, final_amount, balance_amount, special_instructions, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      trustId,
      assignmentData.student_id,
      assignmentData.fee_structure_id,
      assignmentData.total_amount,
      assignmentData.discount_percentage,
      assignmentData.discount_amount,
      assignmentData.final_amount,
      assignmentData.balance_amount,
      assignmentData.special_instructions,
    ]
  );

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT assignment_id, student_id, fee_structure_id, total_amount, 
            final_amount, balance_amount, created_at 
     FROM student_fee_assignments WHERE assignment_id = ?`,
    [result.insertId]
  );
  return rows[0];
}

export async function updateStudentFeeAssignment(assignmentId: number, updateData: any, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  await connection.execute(
    `UPDATE student_fee_assignments 
     SET discount_percentage = ?, discount_amount = ?, final_amount = ?, 
         balance_amount = ?, updated_at = NOW()
     WHERE assignment_id = ?`,
    [
      updateData.discount_percentage,
      updateData.discount_amount,
      updateData.final_amount,
      updateData.balance_amount,
      assignmentId,
    ]
  );
}

// Discount Log operations
export async function createDiscountLog(discountLogData: any, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO fee_discount_logs 
     (trust_id, student_fee_assignment_id, discount_type, discount_percentage, 
      discount_amount, reason, approved_by, valid_until, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      trustId,
      discountLogData.student_fee_assignment_id,
      discountLogData.discount_type,
      discountLogData.discount_percentage,
      discountLogData.discount_amount,
      discountLogData.reason,
      discountLogData.approved_by,
      discountLogData.valid_until,
    ]
  );
  return { discount_log_id: result.insertId };
}

// Service Assignment operations
export async function findOverlappingServiceAssignment(
  studentId: number,
  serviceType: string,
  startDate: string,
  endDate: string,
  trustId: number
) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT service_assignment_id, student_id, service_type, start_date, end_date 
     FROM student_service_assignments 
     WHERE student_id = ? AND service_type = ? 
       AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))`,
    [studentId, serviceType, startDate, startDate, endDate, endDate]
  );
  return rows[0] || null;
}

export async function createServiceAssignment(serviceData: any, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO student_service_assignments 
     (trust_id, student_id, service_type, monthly_fee, start_date, end_date, 
      route_details, total_months, total_amount, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      trustId,
      serviceData.student_id,
      serviceData.service_type,
      serviceData.monthly_fee,
      serviceData.start_date,
      serviceData.end_date,
      serviceData.route_details,
      serviceData.total_months,
      serviceData.total_amount,
    ]
  );

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT service_assignment_id, student_id, service_type, monthly_fee, 
            total_months, total_amount, created_at 
     FROM student_service_assignments WHERE service_assignment_id = ?`,
    [result.insertId]
  );
  return rows[0];
}