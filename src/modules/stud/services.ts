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
export async function stud_04_004Service(input: Stud04004RequestT): Promise<Stud04004ResponseT> {
  // TODO: Implement transfer logic
  throw new Error('STUD-04-004 not yet implemented');
}

/** STUD-04-005 — Student ID & roll allocation */
export async function stud_04_005Service(input: Stud04005RequestT): Promise<Stud04005ResponseT> {
  // TODO: Implement roll allocation logic
  throw new Error('STUD-04-005 not yet implemented');
}

/** STUD-04-006 — Siblings & category allocation */
export async function stud_04_006Service(input: Stud04006RequestT): Promise<Stud04006ResponseT> {
  // TODO: Implement sibling linking logic
  throw new Error('STUD-04-006 not yet implemented');
}

/** STUD-04-007 — Student documents & certificates */
export async function stud_04_007Service(input: Stud04007RequestT): Promise<Stud04007ResponseT> {
  // TODO: Implement document management logic
  throw new Error('STUD-04-007 not yet implemented');
}

/** STUD-04-008 — Student analytics */
export async function stud_04_008Service(input: Stud04008RequestT): Promise<Stud04008ResponseT> {
  // TODO: Implement analytics logic
  throw new Error('STUD-04-008 not yet implemented');
}