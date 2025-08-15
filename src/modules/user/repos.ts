/**
 * USER Module Repository Layer  
 * Data access layer with parameterized queries following security best practices
 */

import { dbManager } from '../../lib/database';

// Repository functions for USER module

// USER-03-001: User creation & management
export async function findUserByEmail(email: string, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id, email, full_name, phone, role, school_id, trust_id, is_active FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return (rows as any[])[0] || null;
}

export async function findUserById(userId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id, email, full_name, phone, role, school_id, trust_id, is_active FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  return (rows as any[])[0] || null;
}

export async function createUser(userData: {
  email: string;
  full_name: string;
  phone: string | null;
  password_hash: string;
  role: string;
  school_id: number | null;
  is_active: boolean;
  employee_id: string | null;
  designation: string | null;
  department: string | null;
  date_of_joining: string | null;
  qualification: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  const [result] = await connection.execute(
    `INSERT INTO users (
      trust_id, email, full_name, phone, password_hash, role, school_id, 
      is_active, employee_id, designation, department, date_of_joining, 
      qualification, address, emergency_contact_name, emergency_contact_phone,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      trustId,
      userData.email,
      userData.full_name,
      userData.phone,
      userData.password_hash,
      userData.role,
      userData.school_id,
      userData.is_active,
      userData.employee_id,
      userData.designation,
      userData.department,
      userData.date_of_joining,
      userData.qualification,
      userData.address,
      userData.emergency_contact_name,
      userData.emergency_contact_phone
    ]
  );
  
  const insertId = (result as any).insertId;
  
  // Fetch the created record
  const [rows] = await connection.execute(
    `SELECT id, trust_id, email, full_name, phone, role, school_id, is_active, 
     employee_id, designation, department, created_at, updated_at
     FROM users WHERE id = ?`,
    [insertId]
  );
  
  return (rows as any[])[0];
}

// USER-03-002: User-school assignments
export async function findSchoolById(schoolId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id, school_name, school_code, is_active FROM schools WHERE id = ? AND is_active = 1 LIMIT 1',
    [schoolId]
  );
  return (rows as any[])[0] || null;
}

export async function findUserSchoolAssignment(userId: number, schoolId: number, role: string, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id, user_id, school_id, role, is_active FROM user_school_assignments WHERE user_id = ? AND school_id = ? AND role = ? LIMIT 1',
    [userId, schoolId, role]
  );
  return (rows as any[])[0] || null;
}

export async function unsetPrimaryAssignments(userId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  await connection.execute(
    'UPDATE user_school_assignments SET is_primary = FALSE WHERE user_id = ? AND is_active = TRUE',
    [userId]
  );
}

export async function createUserSchoolAssignment(assignmentData: {
  user_id: number;
  school_id: number;
  role: string;
  is_primary: boolean;
  start_date: Date;
  end_date?: Date | null;
  permissions: string[];
}, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  const [result] = await connection.execute(
    `INSERT INTO user_school_assignments (
      trust_id, user_id, school_id, role, is_primary, start_date, end_date, 
      permissions, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
    [
      trustId,
      assignmentData.user_id,
      assignmentData.school_id,
      assignmentData.role,
      assignmentData.is_primary,
      assignmentData.start_date,
      assignmentData.end_date,
      JSON.stringify(assignmentData.permissions)
    ]
  );
  
  const insertId = (result as any).insertId;
  
  // Fetch the created record
  const [rows] = await connection.execute(
    `SELECT id, user_id, school_id, role, is_primary, is_active, created_at
     FROM user_school_assignments WHERE id = ?`,
    [insertId]
  );
  
  return (rows as any[])[0];
}

// USER-03-003: Role & Permission Assignment repositories
export async function updateUserRole(updateData: {
  user_id: number;
  new_role: string;
  permissions: string[];
  effective_date: string;
  expiry_date?: string;
  updated_by: number;
  reason?: string;
}, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  await connection.execute(
    `UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?`,
    [updateData.new_role, updateData.user_id]
  );

  // Log role change in audit table (if exists)
  await connection.execute(
    `INSERT INTO user_role_history (user_id, old_role, new_role, effective_date, expiry_date, updated_by, reason, created_at) 
     VALUES (?, (SELECT role FROM users WHERE id = ? LIMIT 1), ?, ?, ?, ?, ?, NOW())`,
    [updateData.user_id, updateData.user_id, updateData.new_role, updateData.effective_date, updateData.expiry_date, updateData.updated_by, updateData.reason]
  );
}

export async function getDefaultPermissionsForRole(role: string, trustId: number): Promise<string[]> {
  const connection = await dbManager.getTrustConnection(trustId);
  
  const [rows] = await connection.execute(
    `SELECT permissions FROM role_permissions WHERE role = ?`,
    [role]
  );
  
  if ((rows as any[]).length > 0) {
    return JSON.parse((rows as any[])[0].permissions) || [];
  }
  
  // Default permissions by role
  const defaultPermissions: Record<string, string[]> = {
    'TRUST_ADMIN': ['all'],
    'SCHOOL_ADMIN': ['school_management', 'user_management', 'student_management'],
    'TEACHER': ['class_management', 'attendance', 'grades'],
    'ACCOUNTANT': ['fee_management', 'financial_reports'],
    'PARENT': ['view_child_data', 'fee_payment'],
    'STUDENT': ['view_own_data']
  };
  
  return defaultPermissions[role] || [];
}

// USER-03-004: Teacher Allocation repositories
export async function findAcademicYearById(academicYearId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id, year_name, start_date, end_date, is_active FROM academic_years WHERE id = ? LIMIT 1',
    [academicYearId]
  );
  return (rows as any[])[0] || null;
}

export async function findClassById(classId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id, class_name, school_id FROM classes WHERE id = ? LIMIT 1',
    [classId]
  );
  return (rows as any[])[0] || null;
}

export async function findClassTeacher(classId: number, academicYearId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT teacher_id FROM teacher_allocations WHERE class_id = ? AND academic_year_id = ? AND is_class_teacher = 1 LIMIT 1',
    [classId, academicYearId]
  );
  return (rows as any[])[0] || null;
}

export async function removeTeacherAllocations(teacherId: number, academicYearId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  await connection.execute(
    'DELETE FROM teacher_allocations WHERE teacher_id = ? AND academic_year_id = ?',
    [teacherId, academicYearId]
  );
}

export async function createTeacherAllocation(allocationData: {
  teacher_id: number;
  class_ids: number[];
  section_ids: number[];
  subject_ids: number[];
  academic_year_id: number;
  workload_hours: number;
  is_class_teacher: boolean;
  effective_date: string;
}, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  const [result] = await connection.execute(
    `INSERT INTO teacher_allocations (
      teacher_id, class_ids, section_ids, subject_ids, academic_year_id, 
      workload_hours, is_class_teacher, effective_date, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      allocationData.teacher_id,
      JSON.stringify(allocationData.class_ids),
      JSON.stringify(allocationData.section_ids),
      JSON.stringify(allocationData.subject_ids),
      allocationData.academic_year_id,
      allocationData.workload_hours,
      allocationData.is_class_teacher,
      allocationData.effective_date
    ]
  );
  
  const insertId = (result as any).insertId;
  
  return {
    allocation_id: insertId,
    created_at: new Date().toISOString()
  };
}

export async function getTeacherAllocationDetails(allocationId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  const [rows] = await connection.execute(
    `SELECT ta.*, ay.year_name
     FROM teacher_allocations ta
     JOIN academic_years ay ON ta.academic_year_id = ay.id
     WHERE ta.id = ?`,
    [allocationId]
  );
  
  if ((rows as any[]).length === 0) {
    return { allocations: [] };
  }
  
  const allocation = (rows as any[])[0];
  const classIds = JSON.parse(allocation.class_ids || '[]');
  const sectionIds = JSON.parse(allocation.section_ids || '[]');
  const subjectIds = JSON.parse(allocation.subject_ids || '[]');
  
  // Get class details
  const allocations = [];
  for (const classId of classIds) {
    const [classRows] = await connection.execute(
      'SELECT id, class_name FROM classes WHERE id = ?',
      [classId]
    );
    
    if ((classRows as any[]).length > 0) {
      allocations.push({
        class_id: classId,
        class_name: (classRows as any[])[0].class_name,
        section_id: sectionIds[0] || undefined,
        section_name: undefined,
        subject_id: subjectIds[0] || undefined,  
        subject_name: undefined,
        is_class_teacher: allocation.is_class_teacher
      });
    }
  }
  
  return { allocations };
}

// USER-03-005: Staff Profile Management repositories
export async function updateUserPersonalInfo(updateData: {
  user_id: number;
  full_name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
}, trustId: number): Promise<string[]> {
  const connection = await dbManager.getTrustConnection(trustId);
  
  const changes = [];
  const fields = [];
  const values = [];
  
  if (updateData.full_name) {
    fields.push('full_name = ?');
    values.push(updateData.full_name);
    changes.push('full_name');
  }
  
  if (updateData.phone) {
    fields.push('phone = ?');
    values.push(updateData.phone);
    changes.push('phone');
  }
  
  if (updateData.address) {
    fields.push('address = ?');
    values.push(updateData.address);
    changes.push('address');
  }
  
  if (fields.length > 0) {
    fields.push('updated_at = NOW()');
    values.push(updateData.user_id);
    
    await connection.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }
  
  return changes;
}

export async function updateUserProfessionalInfo(updateData: {
  user_id: number;
  employee_id?: string;
  designation?: string;
  department?: string;
  date_of_joining?: string;
  qualification?: string;
  experience_years?: number;
  specialization?: string;
}, trustId: number): Promise<string[]> {
  const connection = await dbManager.getTrustConnection(trustId);
  
  const changes = [];
  const fields = [];
  const values = [];
  
  if (updateData.employee_id) {
    fields.push('employee_id = ?');
    values.push(updateData.employee_id);
    changes.push('employee_id');
  }
  
  if (updateData.designation) {
    fields.push('designation = ?');
    values.push(updateData.designation);
    changes.push('designation');
  }
  
  if (updateData.department) {
    fields.push('department = ?');
    values.push(updateData.department);
    changes.push('department');
  }
  
  if (updateData.date_of_joining) {
    fields.push('date_of_joining = ?');
    values.push(updateData.date_of_joining);
    changes.push('date_of_joining');
  }
  
  if (updateData.qualification) {
    fields.push('qualification = ?');
    values.push(updateData.qualification);
    changes.push('qualification');
  }
  
  if (fields.length > 0) {
    fields.push('updated_at = NOW()');
    values.push(updateData.user_id);
    
    await connection.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }
  
  return changes;
}

export async function updateUserEmergencyContact(updateData: {
  user_id: number;
  name: string;
  phone: string;
  relationship: string;
  address?: string;
}, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  await connection.execute(
    `UPDATE users SET emergency_contact_name = ?, emergency_contact_phone = ?, updated_at = NOW() WHERE id = ?`,
    [updateData.name, updateData.phone, updateData.user_id]
  );
}

export async function updateUserDocuments(userId: number, documents: any[], trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  // Remove existing documents
  await connection.execute(
    'DELETE FROM user_documents WHERE user_id = ?',
    [userId]
  );
  
  // Add new documents
  for (const doc of documents) {
    await connection.execute(
      'INSERT INTO user_documents (user_id, document_type, document_number, file_path, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, doc.document_type, doc.document_number, doc.file_path]
    );
  }
}

export async function getUserProfileInfo(userId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    `SELECT full_name, phone, address, employee_id, designation, department, date_of_joining
     FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  return (rows as any[])[0] || {};
}

// USER-03-006: Parent-Student Linking repositories
export async function findStudentById(studentId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id, admission_number, full_name, is_active FROM students WHERE id = ? LIMIT 1',
    [studentId]
  );
  return (rows as any[])[0] || null;
}

export async function findPrimaryParentByRelationship(studentId: number, relationship: string, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT parent_user_id FROM student_parents WHERE student_id = ? AND relationship = ? AND is_primary = 1 LIMIT 1',
    [studentId, relationship]
  );
  return (rows as any[])[0] || null;
}

export async function findParentStudentLink(parentUserId: number, studentId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id FROM student_parents WHERE parent_user_id = ? AND student_id = ? LIMIT 1',
    [parentUserId, studentId]
  );
  return (rows as any[])[0] || null;
}

export async function checkEmergencyContactPriority(studentId: number, priority: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute(
    'SELECT id FROM student_parents WHERE student_id = ? AND emergency_contact_priority = ? LIMIT 1',
    [studentId, priority]
  );
  return (rows as any[]).length > 0;
}

export async function unsetPrimaryParentByRelationship(studentId: number, relationship: string, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  await connection.execute(
    'UPDATE student_parents SET is_primary = 0 WHERE student_id = ? AND relationship = ?',
    [studentId, relationship]
  );
}

export async function createParentStudentLink(linkData: {
  parent_user_id: number;
  student_id: number;
  relationship: string;
  is_primary: boolean;
  has_financial_responsibility: boolean;
  can_pickup: boolean;
  emergency_contact_priority: number;
  notes: string | null;
}, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  const [result] = await connection.execute(
    `INSERT INTO student_parents (
      trust_id, parent_user_id, student_id, relationship, is_primary,
      has_financial_responsibility, can_pickup, emergency_contact_priority, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      trustId,
      linkData.parent_user_id,
      linkData.student_id,
      linkData.relationship,
      linkData.is_primary,
      linkData.has_financial_responsibility,
      linkData.can_pickup,
      linkData.emergency_contact_priority,
      linkData.notes
    ]
  );
  
  const insertId = (result as any).insertId;
  
  return {
    link_id: insertId,
    created_at: new Date().toISOString()
  };
}

export async function getParentStudentLinkDetails(linkId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  const [rows] = await connection.execute(
    `SELECT sp.*, u.full_name as parent_name, u.email as parent_email,
            s.full_name as student_name, s.admission_number as student_admission_number
     FROM student_parents sp
     JOIN users u ON sp.parent_user_id = u.id
     JOIN students s ON sp.student_id = s.id
     WHERE sp.id = ? LIMIT 1`,
    [linkId]
  );
  
  return (rows as any[])[0] || {};
}