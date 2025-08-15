/**
 * USER Module Services
 * Business logic layer following controller → service → repository pattern
 */

import * as argon2 from 'argon2';
import { 
  User03001RequestT, User03001ResponseT,
  User03002RequestT, User03002ResponseT,
  User03003RequestT, User03003ResponseT,
  User03004RequestT, User03004ResponseT,
  User03005RequestT, User03005ResponseT,
  User03006RequestT, User03006ResponseT
} from './dtos';
import * as repo from './repos';

/** USER-03-001 — User creation & management */
export async function user_03_001Service(input: User03001RequestT): Promise<User03001ResponseT> {
  const {
    email, full_name, phone, role, school_id, password,
    is_active, employee_id, designation, department,
    date_of_joining, qualification, address,
    emergency_contact_name, emergency_contact_phone
  } = input;

  // Business validation
  if (school_id && !['SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT'].includes(role)) {
    throw new Error('Only school-level roles can be assigned to a specific school');
  }

  if (['TRUST_ADMIN'].includes(role) && school_id) {
    throw new Error('Trust-level roles cannot be assigned to a specific school');
  }

  // For now, use trust_id = 1 (should be from auth context in production)
  const trustId = 1;
  
  // Check if email already exists
  const existingUser = await repo.findUserByEmail(email, trustId);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const password_hash = await argon2.hash(password);

  // Create user (convert undefined to null for database)
  const userData = {
    email,
    full_name,
    phone: phone ?? null,
    password_hash,
    role,
    school_id: school_id ?? null,
    is_active,
    employee_id: employee_id ?? null,
    designation: designation ?? null,
    department: department ?? null,
    date_of_joining: date_of_joining ?? null,
    qualification: qualification ?? null,
    address: address ?? null,
    emergency_contact_name: emergency_contact_name ?? null,
    emergency_contact_phone: emergency_contact_phone ?? null
  };

  console.log('DEBUG: userData:', userData);
  const createdUser = await repo.createUser(userData, trustId);

  return {
    user_id: createdUser.id,
    email: createdUser.email,
    full_name: createdUser.full_name,
    phone: createdUser.phone,
    role: createdUser.role,
    school_id: createdUser.school_id,
    trust_id: createdUser.trust_id,
    is_active: createdUser.is_active,
    employee_id: createdUser.employee_id,
    designation: createdUser.designation,
    department: createdUser.department,
    created_at: createdUser.created_at.toISOString(),
    updated_at: createdUser.updated_at.toISOString()
  };
}

/** USER-03-002 — User-school assignments */
export async function user_03_002Service(input: User03002RequestT): Promise<User03002ResponseT> {
  const { user_id, school_id, role, is_primary, start_date, end_date, permissions } = input;

  // For now, use trust_id = 1 (should be from auth context in production)
  const trustId = 1;

  // Validate user exists
  const user = await repo.findUserById(user_id, trustId);
  if (!user) {
    throw new Error('User not found');
  }

  // Validate school exists
  const school = await repo.findSchoolById(school_id, trustId);
  if (!school) {
    throw new Error('School not found');
  }

  // Business validation
  if (!['SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT'].includes(role)) {
    throw new Error('Invalid role for school assignment');
  }

  // Check for existing assignment
  const existingAssignment = await repo.findUserSchoolAssignment(user_id, school_id, role, trustId);
  if (existingAssignment && existingAssignment.is_active) {
    throw new Error('User already has an active assignment to this school with this role');
  }

  // If this is primary assignment, unset other primary assignments for this user
  if (is_primary) {
    await repo.unsetPrimaryAssignments(user_id, trustId);
  }

  // Create assignment
  const assignmentData = {
    user_id,
    school_id,
    role,
    is_primary,
    start_date: start_date ? new Date(start_date) : new Date(),
    end_date: end_date ? new Date(end_date) : null,
    permissions: permissions || []
  };

  const assignment = await repo.createUserSchoolAssignment(assignmentData, trustId);

  return {
    assignment_id: assignment.id,
    user_id: assignment.user_id,
    school_id: assignment.school_id,
    role: assignment.role,
    is_primary: assignment.is_primary,
    is_active: assignment.is_active,
    created_at: assignment.created_at.toISOString()
  };
}

/** USER-03-003 — Role & permission assignment */
export async function user_03_003Service(input: User03003RequestT, trustId: number, currentUserId: number): Promise<User03003ResponseT> {
  const { user_id, role, permissions, effective_date, expiry_date, reason } = input;

  // Business validation
  const targetUser = await repo.findUserById(user_id, trustId);
  if (!targetUser) {
    throw new Error('Target user not found');
  }

  // Validate role hierarchy - only TRUST_ADMIN can assign TRUST_ADMIN role
  if (role === 'TRUST_ADMIN') {
    const currentUser = await repo.findUserById(currentUserId, trustId);
    if (currentUser?.role !== 'TRUST_ADMIN') {
      throw new Error('Only TRUST_ADMIN can assign TRUST_ADMIN role');
    }
  }

  // Validate effective and expiry dates
  if (effective_date && expiry_date && new Date(effective_date) >= new Date(expiry_date)) {
    throw new Error('Expiry date must be after effective date');
  }

  const oldRole = targetUser.role;
  const effectiveDateTime = effective_date || new Date().toISOString();
  
  // Update user role and permissions
  const updateData = {
    user_id,
    new_role: role,
    permissions: permissions || [],
    effective_date: effectiveDateTime,
    expiry_date,
    updated_by: currentUserId,
    reason
  };

  await repo.updateUserRole(updateData, trustId);

  // Get granted permissions (default set per role if none specified)
  const permissionsGranted = permissions || await repo.getDefaultPermissionsForRole(role, trustId);

  return {
    user_id,
    old_role: oldRole as any,
    new_role: role,
    permissions_granted: permissionsGranted,
    effective_date: effectiveDateTime,
    updated_by: currentUserId,
    updated_at: new Date().toISOString()
  };
}

/** USER-03-004 — Teacher subject/class allocation */
export async function user_03_004Service(input: User03004RequestT, trustId: number): Promise<User03004ResponseT> {
  const { teacher_id, class_ids, section_ids, subject_ids, academic_year_id, workload_hours, is_class_teacher, effective_date } = input;

  // Business validation
  const teacher = await repo.findUserById(teacher_id, trustId);
  if (!teacher) {
    throw new Error('Teacher not found');
  }

  if (teacher.role !== 'TEACHER') {
    throw new Error('User is not a teacher');
  }

  // Validate academic year
  const academicYear = await repo.findAcademicYearById(academic_year_id, trustId);
  if (!academicYear) {
    throw new Error('Academic year not found');
  }

  // Validate classes exist
  for (const classId of class_ids) {
    const classExists = await repo.findClassById(classId, trustId);
    if (!classExists) {
      throw new Error(`Class with ID ${classId} not found`);
    }
  }

  // Business rule: Only one class teacher per class per academic year
  if (is_class_teacher && class_ids.length > 1) {
    throw new Error('A teacher can be class teacher for only one class');
  }

  if (is_class_teacher) {
    const existingClassTeacher = await repo.findClassTeacher(class_ids[0], academic_year_id, trustId);
    if (existingClassTeacher && existingClassTeacher.teacher_id !== teacher_id) {
      throw new Error('Class already has a class teacher assigned');
    }
  }

  // Check workload limits
  if (workload_hours && workload_hours > 40) {
    throw new Error('Weekly workload cannot exceed 40 hours');
  }

  // Remove existing allocations for this teacher in this academic year
  await repo.removeTeacherAllocations(teacher_id, academic_year_id, trustId);

  // Create new allocations
  const allocationData = {
    teacher_id,
    class_ids,
    section_ids: section_ids || [],
    subject_ids: subject_ids || [],
    academic_year_id,
    workload_hours: workload_hours || 0,
    is_class_teacher,
    effective_date: effective_date || new Date().toISOString()
  };

  const allocation = await repo.createTeacherAllocation(allocationData, trustId);
  
  // Get detailed allocation info
  const allocationDetails = await repo.getTeacherAllocationDetails(allocation.allocation_id, trustId);

  return {
    allocation_id: allocation.allocation_id,
    teacher_id,
    teacher_name: teacher.full_name,
    allocations: allocationDetails.allocations,
    total_workload_hours: workload_hours || 0,
    academic_year: academicYear.year_name,
    created_at: allocation.created_at
  };
}

/** USER-03-005 — Staff profile management */
export async function user_03_005Service(input: User03005RequestT, trustId: number): Promise<User03005ResponseT> {
  const { user_id, personal_info, professional_info, emergency_contact, documents } = input;

  // For create operation, user_id is optional; for update, it's required
  let targetUserId: number;
  let isUpdate = false;

  if (user_id) {
    // Update existing profile
    isUpdate = true;
    targetUserId = user_id;
    
    const existingUser = await repo.findUserById(user_id, trustId);
    if (!existingUser) {
      throw new Error('User not found');
    }
  } else {
    throw new Error('user_id is required for profile management');
  }

  // Business validation
  if (professional_info.date_of_joining) {
    const joiningDate = new Date(professional_info.date_of_joining);
    if (joiningDate > new Date()) {
      throw new Error('Date of joining cannot be in the future');
    }
  }

  if (professional_info.experience_years && professional_info.experience_years > 50) {
    throw new Error('Experience years cannot exceed 50');
  }

  // Track changes
  const changesMade: string[] = [];
  
  // Update personal information
  if (isUpdate) {
    const personalUpdateData = {
      user_id: targetUserId,
      full_name: personal_info.full_name,
      phone: personal_info.phone,
      address: personal_info.address,
      date_of_birth: personal_info.date_of_birth,
      gender: personal_info.gender,
      marital_status: personal_info.marital_status
    };
    
    const personalChanges = await repo.updateUserPersonalInfo(personalUpdateData, trustId);
    changesMade.push(...personalChanges);
  }

  // Update professional information
  const professionalUpdateData = {
    user_id: targetUserId,
    employee_id: professional_info.employee_id,
    designation: professional_info.designation,
    department: professional_info.department,
    date_of_joining: professional_info.date_of_joining || undefined,
    qualification: professional_info.qualification,
    experience_years: professional_info.experience_years,
    specialization: professional_info.specialization
  };

  const professionalChanges = await repo.updateUserProfessionalInfo(professionalUpdateData, trustId);
  changesMade.push(...professionalChanges);

  // Update emergency contact
  await repo.updateUserEmergencyContact({
    user_id: targetUserId,
    name: emergency_contact.name,
    phone: emergency_contact.phone,
    relationship: emergency_contact.relationship,
    address: emergency_contact.address
  }, trustId);
  changesMade.push('emergency_contact');

  // Handle documents if provided
  if (documents && documents.length > 0) {
    await repo.updateUserDocuments(targetUserId, documents, trustId);
    changesMade.push('documents');
  }

  // Get updated user info
  const updatedUser = await repo.getUserProfileInfo(targetUserId, trustId);

  return {
    user_id: targetUserId,
    profile_updated: changesMade.length > 0,
    changes_made: changesMade,
    personal_info: {
      full_name: updatedUser.full_name,
      phone: updatedUser.phone,
      address: updatedUser.address
    },
    professional_info: {
      employee_id: updatedUser.employee_id,
      designation: updatedUser.designation,
      department: updatedUser.department,
      date_of_joining: updatedUser.date_of_joining
    },
    updated_at: new Date().toISOString()
  };
}

/** USER-03-006 — Parent-student linking */
export async function user_03_006Service(input: User03006RequestT, trustId: number): Promise<User03006ResponseT> {
  const { 
    parent_user_id, 
    student_id, 
    relationship, 
    is_primary, 
    has_financial_responsibility, 
    can_pickup, 
    emergency_contact_priority, 
    notes 
  } = input;

  // Business validation - Check if parent user exists
  const parentUser = await repo.findUserById(parent_user_id, trustId);
  if (!parentUser) {
    throw new Error('Parent user not found');
  }

  if (parentUser.role !== 'PARENT') {
    throw new Error('User is not a parent');
  }

  // Check if student exists
  const student = await repo.findStudentById(student_id, trustId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Business rules validation
  if (is_primary) {
    // Check if student already has a primary parent with the same relationship
    const existingPrimary = await repo.findPrimaryParentByRelationship(student_id, relationship, trustId);
    if (existingPrimary && existingPrimary.parent_user_id !== parent_user_id) {
      throw new Error(`Student already has a primary ${relationship.toLowerCase()}`);
    }
  }

  // Check if this link already exists
  const existingLink = await repo.findParentStudentLink(parent_user_id, student_id, trustId);
  if (existingLink) {
    throw new Error('Parent-student link already exists');
  }

  // Validate emergency contact priority uniqueness
  if (emergency_contact_priority) {
    const priorityExists = await repo.checkEmergencyContactPriority(student_id, emergency_contact_priority, trustId);
    if (priorityExists) {
      throw new Error(`Emergency contact priority ${emergency_contact_priority} is already assigned to another parent`);
    }
  }

  // If this is primary, unset other primary links for same relationship
  if (is_primary) {
    await repo.unsetPrimaryParentByRelationship(student_id, relationship, trustId);
  }

  // Create parent-student link
  const linkData = {
    parent_user_id,
    student_id,
    relationship,
    is_primary,
    has_financial_responsibility,
    can_pickup,
    emergency_contact_priority,
    notes: notes || null
  };

  const link = await repo.createParentStudentLink(linkData, trustId);

  // Get full details for response
  const linkDetails = await repo.getParentStudentLinkDetails(link.link_id, trustId);

  return {
    link_id: link.link_id,
    parent_user_id,
    parent_name: linkDetails.parent_name,
    parent_email: linkDetails.parent_email,
    student_id,
    student_name: linkDetails.student_name,
    student_admission_number: linkDetails.student_admission_number,
    relationship,
    is_primary,
    permissions: {
      has_financial_responsibility,
      can_pickup,
      emergency_contact_priority
    },
    created_at: link.created_at
  };
}
