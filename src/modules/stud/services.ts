/**
 * STUD Module Services
 * Business logic layer following controller → service → repository pattern
 */

import { 
  Stud04001RequestT, Stud04001ResponseT,
  Stud04002RequestT, Stud04002ResponseT,
  Stud04003RequestT, Stud04003ResponseT,
  Stud04004RequestT, Stud04004ResponseT,
  Stud04005RequestT, Stud04005ResponseT,
  Stud04006RequestT, Stud04006ResponseT,
  Stud04007RequestT, Stud04007ResponseT,
  Stud04008RequestT, Stud04008ResponseT
} from './dtos';
import * as repo from './repos';

/** STUD-04-001 — Student admission */
export async function stud_04_001Service(input: Stud04001RequestT): Promise<Stud04001ResponseT> {
  const {
    school_id, academic_year_id, admission_number, first_name, last_name,
    date_of_birth, gender, class_id, section_id, house_id,
    father_name, mother_name, guardian_name, contact_phone, contact_email,
    address, previous_school, medical_conditions, application_date
  } = input;

  // For now, use trust_id = 1 (should be from auth context in production)
  const trustId = 1;

  // Business validation
  // Check if admission number already exists
  const existingAdmission = await repo.findStudentByAdmissionNumber(admission_number, school_id, trustId);
  if (existingAdmission) {
    throw new Error('Admission number already exists for this school');
  }

  // Validate school exists
  const school = await repo.findSchoolById(school_id, trustId);
  if (!school) {
    throw new Error('School not found');
  }

  // Validate academic year exists
  const academicYear = await repo.findAcademicYearById(academic_year_id, trustId);
  if (!academicYear) {
    throw new Error('Academic year not found');
  }

  // Validate class exists
  const classInfo = await repo.findClassById(class_id, trustId);
  if (!classInfo) {
    throw new Error('Class not found');
  }

  // Create student record
  const studentData = {
    trust_id: trustId,
    school_id,
    admission_number,
    roll_number: null, // Will be assigned later
    first_name,
    last_name,
    date_of_birth,
    gender,
    class_id,
    section_id: section_id ?? null,
    house_id: house_id ?? null,
    is_active: true
  };

  const createdStudent = await repo.createStudent(studentData, trustId);

  // Create admission record
  const admissionData = {
    trust_id: trustId,
    student_id: createdStudent.id,
    academic_year_id,
    status: 'PENDING' as const,
    application_date: new Date(application_date),
    admission_date: null
  };

  const createdAdmission = await repo.createAdmission(admissionData, trustId);

  return {
    student_id: createdStudent.id,
    admission_id: createdAdmission.id,
    school_id: createdStudent.school_id,
    admission_number: createdStudent.admission_number,
    first_name: createdStudent.first_name,
    last_name: createdStudent.last_name,
    status: createdAdmission.status,
    application_date: application_date,
    created_at: createdStudent.created_at.toISOString()
  };
}

/** STUD-04-002 — Admission approval workflow */
export async function stud_04_002Service(input: Stud04002RequestT): Promise<Stud04002ResponseT> {
  const { admission_id, status, admission_date, remarks, reviewed_by } = input;

  // For now, use trust_id = 1 (should be from auth context in production)
  const trustId = 1;

  // Validate admission exists
  const admission = await repo.findAdmissionById(admission_id, trustId);
  if (!admission) {
    throw new Error('Admission not found');
  }

  // Business validation
  if (admission.status !== 'PENDING') {
    throw new Error('Admission has already been processed');
  }

  if (status === 'APPROVED' && !admission_date) {
    throw new Error('Admission date is required when approving admission');
  }

  // Update admission record
  const updateData = {
    status,
    admission_date: admission_date ? new Date(admission_date) : null,
    remarks: remarks ?? null
  };

  const updatedAdmission = await repo.updateAdmission(admission_id, updateData, trustId);

  // If approved, activate the student
  if (status === 'APPROVED') {
    await repo.updateStudentStatus(admission.student_id, true, trustId);
  }

  return {
    admission_id: updatedAdmission.id,
    status: updatedAdmission.status,
    admission_date: updatedAdmission.admission_date ? updatedAdmission.admission_date.toISOString().split('T')[0] : null,
    remarks: updatedAdmission.remarks,
    reviewed_by,
    updated_at: updatedAdmission.updated_at.toISOString()
  };
}

/** STUD-04-003 — Readmission/promotion */
export async function stud_04_003Service(input: Stud04003RequestT): Promise<Stud04003ResponseT> {
  // TODO: Implement promotion/readmission logic
  throw new Error('STUD-04-003 not yet implemented');
}

/** STUD-04-004 — Inter-school transfer (in-trust) */
export async function stud_04_004Service(input: Stud04004RequestT, trustId: number): Promise<Stud04004ResponseT> {
  const { student_id, from_school_id, to_school_id, transfer_date, transfer_reason, new_class_id, new_section_id, new_admission_number, remarks } = input;

  // Validate student exists
  const student = await repo.findStudentById(student_id, trustId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Validate schools exist
  const fromSchool = await repo.findSchoolById(from_school_id, trustId);
  const toSchool = await repo.findSchoolById(to_school_id, trustId);
  if (!fromSchool || !toSchool) {
    throw new Error('Source or destination school not found');
  }

  // Validate new admission number is unique
  if (new_admission_number) {
    const existing = await repo.findStudentByAdmissionNumber(new_admission_number, to_school_id, trustId);
    if (existing) {
      throw new Error('New admission number already exists at destination school');
    }
  }

  // Create transfer record
  const transferData = {
    student_id,
    from_school_id,
    to_school_id,
    transfer_date,
    transfer_reason,
    new_class_id,
    new_section_id,
    new_admission_number,
    remarks,
    status: 'COMPLETED'
  };

  const transfer = await repo.createStudentTransfer(transferData, trustId);

  // Update student record
  await repo.updateStudentSchool(student_id, {
    school_id: to_school_id,
    class_id: new_class_id,
    section_id: new_section_id,
    admission_number: new_admission_number || student.admission_number
  }, trustId);

  return {
    transfer_id: transfer.transfer_id,
    student_id,
    from_school: fromSchool.school_name,
    to_school: toSchool.school_name,
    transfer_date,
    status: 'COMPLETED',
    new_admission_number: new_admission_number || student.admission_number,
    transfer_reason,
    created_at: transfer.created_at
  };
}

/** STUD-04-005 — Student ID & roll allocation */
export async function stud_04_005Service(input: Stud04005RequestT, trustId: number): Promise<Stud04005ResponseT> {
  const { student_id, roll_number, house_id, student_id_format, generate_barcode } = input;

  // Validate student exists
  const student = await repo.findStudentById(student_id, trustId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Validate roll number is unique within class
  if (roll_number) {
    const existingRoll = await repo.findStudentByRoll(roll_number, student.class_id, student.section_id || null, trustId);
    if (existingRoll && existingRoll.id !== student_id) {
      throw new Error('Roll number already assigned in this class/section');
    }
  }

  // Generate student ID if format provided
  let generatedStudentId = student.student_id || student.admission_number;
  if (student_id_format) {
    generatedStudentId = await repo.generateStudentId(student_id_format, student, trustId);
  }

  // Generate barcode if requested
  let barcodeData;
  if (generate_barcode) {
    barcodeData = {
      barcode_value: generatedStudentId,
      barcode_format: 'CODE128',
      generated_at: new Date().toISOString()
    };
  }

  // Update student with new allocations
  await repo.updateStudentAllocations(student_id, {
    roll_number,
    house_id,
    student_id: generatedStudentId,
    barcode_data: barcodeData
  }, trustId);

  return {
    student_id,
    student_name: `${student.first_name} ${student.last_name}`,
    admission_number: student.admission_number,
    generated_student_id: generatedStudentId,
    roll_number,
    house_id,
    barcode: barcodeData,
    updated_at: new Date().toISOString()
  };
}

/** STUD-04-006 — Siblings & category allocation */
export async function stud_04_006Service(input: Stud04006RequestT, trustId: number): Promise<Stud04006ResponseT> {
  const { student_id, sibling_ids, category, subcategory, fee_category, transport_category, scholarship_details } = input;

  // Validate student exists
  const student = await repo.findStudentById(student_id, trustId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Validate siblings exist
  const siblings = [];
  for (const siblingId of sibling_ids) {
    const sibling = await repo.findStudentById(siblingId, trustId);
    if (!sibling) {
      throw new Error(`Sibling with ID ${siblingId} not found`);
    }
    siblings.push(sibling);
  }

  // Create sibling relationships
  for (const siblingId of sibling_ids) {
    await repo.createSiblingLink(student_id, siblingId, trustId);
    await repo.createSiblingLink(siblingId, student_id, trustId); // Bidirectional
  }

  // Update student categories
  const categoryData = {
    student_id,
    category,
    subcategory,
    fee_category,
    transport_category,
    scholarship_details
  };

  await repo.updateStudentCategories(categoryData, trustId);

  // Apply category-based benefits
  const benefits = await repo.calculateCategoryBenefits(category, subcategory, trustId);

  return {
    student_id,
    student_name: `${student.first_name} ${student.last_name}`,
    siblings: siblings.map(s => ({
      sibling_id: s.id,
      sibling_name: `${s.first_name} ${s.last_name}`,
      admission_number: s.admission_number,
      class_name: s.class_name || 'N/A'
    })),
    category_allocation: {
      category,
      subcategory,
      fee_category,
      transport_category
    },
    benefits_applied: benefits,
    scholarship_details,
    updated_at: new Date().toISOString()
  };
}

/** STUD-04-007 — Student documents & certificates */
export async function stud_04_007Service(input: Stud04007RequestT, trustId: number): Promise<Stud04007ResponseT> {
  const { student_id, document_type, document_number, issued_by, issued_date, expiry_date, file_path, verification_status, remarks } = input;

  // Validate student exists
  const student = await repo.findStudentById(student_id, trustId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Check for duplicate documents
  const existingDoc = await repo.findStudentDocument(student_id, document_type, document_number, trustId);
  if (existingDoc) {
    throw new Error('Document with same type and number already exists for this student');
  }

  // Create document record
  const documentData = {
    student_id,
    document_type,
    document_number,
    issued_by,
    issued_date,
    expiry_date,
    file_path,
    verification_status: verification_status || 'PENDING',
    remarks
  };

  const document = await repo.createStudentDocument(documentData, trustId);

  // Auto-verify certain document types
  if (['BIRTH_CERTIFICATE', 'AADHAR'].includes(document_type)) {
    await repo.updateDocumentVerification(document.document_id, 'VERIFIED', 'Auto-verified system document', trustId);
  }

  // Generate certificate if applicable
  let certificateGenerated = false;
  if (['TC', 'CHARACTER_CERTIFICATE', 'BONAFIDE'].includes(document_type)) {
    await repo.generateCertificate(student_id, document_type, trustId);
    certificateGenerated = true;
  }

  return {
    document_id: document.document_id,
    student_id,
    student_name: `${student.first_name} ${student.last_name}`,
    document_type,
    document_number,
    verification_status: document.verification_status,
    certificate_generated: certificateGenerated,
    file_path,
    issued_by,
    issued_date,
    expiry_date,
    created_at: document.created_at
  };
}

/** STUD-04-008 — Student analytics */
export async function stud_04_008Service(input: Stud04008RequestT, trustId: number): Promise<Stud04008ResponseT> {
  const { school_ids, class_ids, academic_year_id, date_from, date_to, metrics, include_trends } = input;

  const dateRange = {
    from: date_from || new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0], // April 1st
    to: date_to || new Date().toISOString().split('T')[0]
  };

  // Get enrollment analytics
  const enrollment = await repo.getEnrollmentAnalytics({
    trustId,
    school_ids,
    class_ids,
    academic_year_id,
    dateRange
  });

  // Get attendance analytics
  const attendance = await repo.getAttendanceAnalytics({
    trustId,
    school_ids,
    class_ids,
    dateRange
  });

  // Get fee analytics
  const fees = await repo.getFeeAnalytics({
    trustId,
    school_ids,
    class_ids,
    dateRange
  });

  // Get demographic analytics
  const demographics = await repo.getDemographicAnalytics({
    trustId,
    school_ids,
    class_ids
  });

  // Get performance metrics
  const performance = await repo.getPerformanceAnalytics({
    trustId,
    school_ids,
    class_ids,
    academic_year_id
  });

  let trends = undefined;
  if (include_trends) {
    trends = await repo.getTrendAnalytics({
      trustId,
      school_ids,
      dateRange
    });
  }

  return {
    analytics_id: `STUD_ANALYTICS_${Date.now()}`,
    report_period: dateRange,
    scope: {
      school_count: school_ids?.length || 0,
      class_count: class_ids?.length || 0,
      academic_year_id
    },
    enrollment_analytics: enrollment,
    attendance_analytics: attendance,
    fee_analytics: fees,
    demographic_analytics: demographics,
    performance_analytics: performance,
    trends,
    generated_at: new Date().toISOString()
  };
}