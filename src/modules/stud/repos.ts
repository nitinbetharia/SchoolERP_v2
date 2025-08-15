/**
 * STUD Module Repository Layer  
 * Data access layer with parameterized queries following security best practices
 */

import { dbManager } from '../../lib/database';

// Repository functions for STUD module

// STUD-04-001: Student admission
export async function findStudentByAdmissionNumber(admission_number: string, school_id: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id, admission_number, school_id FROM students WHERE admission_number = ? AND school_id = ? LIMIT 1',
    [admission_number, school_id]
  );
  return (rows as any[])[0] || null;
}

export async function findSchoolById(school_id: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id, school_name, school_code, is_active FROM schools WHERE id = ? AND is_active = 1 LIMIT 1',
    [school_id]
  );
  return (rows as any[])[0] || null;
}

export async function findAcademicYearById(academic_year_id: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id, year_name, start_date, end_date, is_current FROM academic_years WHERE id = ? AND is_active = 1 LIMIT 1',
    [academic_year_id]
  );
  return (rows as any[])[0] || null;
}

export async function findClassById(class_id: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id, class_name, class_code, is_active FROM classes WHERE id = ? AND is_active = 1 LIMIT 1',
    [class_id]
  );
  return (rows as any[])[0] || null;
}

export async function createStudent(studentData: {
  trust_id: number;
  school_id: number;
  admission_number: string;
  roll_number: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  class_id: number;
  section_id: number | null;
  house_id: number | null;
  is_active: boolean;
}, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  const [result] = await connection.execute(
    `INSERT INTO students (
      trust_id, school_id, admission_number, roll_number, first_name, last_name,
      date_of_birth, gender, class_id, section_id, house_id, is_active,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      studentData.trust_id,
      studentData.school_id,
      studentData.admission_number,
      studentData.roll_number,
      studentData.first_name,
      studentData.last_name,
      studentData.date_of_birth,
      studentData.gender,
      studentData.class_id,
      studentData.section_id,
      studentData.house_id,
      studentData.is_active
    ]
  );
  
  const insertId = (result as any).insertId;
  
  // Fetch the created record
  const [rows] = await connection.execute(
    `SELECT id, trust_id, school_id, admission_number, roll_number, first_name, last_name,
     date_of_birth, gender, class_id, section_id, house_id, is_active, created_at, updated_at
     FROM students WHERE id = ?`,
    [insertId]
  );
  
  return (rows as any[])[0];
}

export async function createAdmission(admissionData: {
  trust_id: number;
  student_id: number;
  academic_year_id: number;
  status: string;
  application_date: Date;
  admission_date: Date | null;
}, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  const [result] = await connection.execute(
    `INSERT INTO admissions (
      trust_id, student_id, academic_year_id, status, application_date, admission_date,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [
      admissionData.trust_id,
      admissionData.student_id,
      admissionData.academic_year_id,
      admissionData.status,
      admissionData.application_date,
      admissionData.admission_date
    ]
  );
  
  const insertId = (result as any).insertId;
  
  // Fetch the created record
  const [rows] = await connection.execute(
    `SELECT id, trust_id, student_id, academic_year_id, status, application_date, admission_date, created_at
     FROM admissions WHERE id = ?`,
    [insertId]
  );
  
  return (rows as any[])[0];
}

// STUD-04-002: Admission approval workflow
export async function findAdmissionById(admission_id: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id, student_id, academic_year_id, status, application_date, admission_date FROM admissions WHERE id = ? LIMIT 1',
    [admission_id]
  );
  return (rows as any[])[0] || null;
}

export async function updateAdmission(admission_id: number, updateData: {
  status: string;
  admission_date: Date | null;
  remarks: string | null;
}, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  await connection.execute(
    `UPDATE admissions SET status = ?, admission_date = ?, updated_at = NOW() 
     WHERE id = ?`,
    [updateData.status, updateData.admission_date, admission_id]
  );
  
  // Fetch the updated record
  const [rows] = await connection.execute(
    `SELECT id, student_id, academic_year_id, status, application_date, admission_date, 
     created_at, updated_at
     FROM admissions WHERE id = ?`,
    [admission_id]
  );
  
  // Add remarks to the response (in a real system, this might be in a separate table)
  const admission = (rows as any[])[0];
  admission.remarks = updateData.remarks;
  
  return admission;
}

export async function updateStudentStatus(student_id: number, is_active: boolean, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  await connection.execute(
    'UPDATE students SET is_active = ?, updated_at = NOW() WHERE id = ?',
    [is_active, student_id]
  );
}