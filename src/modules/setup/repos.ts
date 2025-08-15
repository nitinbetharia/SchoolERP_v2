/** Repository layer for module: SETUP */
import { dbManager } from '../../lib/database';

export class SetupRepo {
  constructor() {}

  async findTrustByCodeOrSubdomain(trust_code: string, subdomain: string) {
    const connection = await dbManager.getMasterConnection();
    const [rows] = await connection.execute(
      'SELECT id, trust_code, subdomain FROM trusts WHERE trust_code = ? OR subdomain = ? LIMIT 1',
      [trust_code, subdomain]
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] as any : null;
  }

  async createTrust(trustData: {
    trust_name: string;
    trust_code: string;
    description?: string;
    subdomain: string;
    contact_email: string;
    contact_phone?: string;
    address?: string;
    is_active: boolean;
  }): Promise<number> {
    const connection = await dbManager.getMasterConnection();
    
    const [result] = await connection.execute(
      `INSERT INTO trusts (
        trust_name, trust_code, description, subdomain, contact_email, 
        contact_phone, address, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        trustData.trust_name,
        trustData.trust_code,
        trustData.description || null,
        trustData.subdomain,
        trustData.contact_email,
        trustData.contact_phone || null,
        trustData.address || null,
        trustData.is_active
      ]
    );

    return (result as any).insertId;
  }

  async initializeTrustConfig(trustId: number): Promise<void> {
    const connection = await dbManager.getMasterConnection();
    
    // Insert basic system configuration for the trust
    await connection.execute(
      `INSERT INTO system_config (trust_id, config_key, config_value, created_at, updated_at) VALUES
       (?, 'trust_initialized', 'true', NOW(), NOW()),
       (?, 'max_schools', '10', NOW(), NOW()),
       (?, 'max_students_per_school', '5000', NOW(), NOW())`,
      [trustId, trustId, trustId]
    );
  }

  async findTrustById(trustId: number) {
    const connection = await dbManager.getMasterConnection();
    const [rows] = await connection.execute(
      'SELECT id, trust_name, trust_code, is_active FROM trusts WHERE id = ? LIMIT 1',
      [trustId]
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] as any : null;
  }

  async findSchoolByCodeAndTrust(school_code: string, trust_id: number) {
    const connection = await dbManager.getTrustConnection(trust_id);
    const [rows] = await connection.execute(
      'SELECT id, school_code FROM schools WHERE school_code = ? AND trust_id = ? LIMIT 1',
      [school_code, trust_id]
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] as any : null;
  }

  async createSchool(schoolData: {
    school_name: string;
    school_code: string;
    trust_id: number;
    address?: string;
    contact_email: string;
    contact_phone?: string;
    principal_name?: string;
    established_year?: number;
    is_active: boolean;
  }): Promise<number> {
    const connection = await dbManager.getTrustConnection(schoolData.trust_id);
    
    const [result] = await connection.execute(
      `INSERT INTO schools (
        school_name, school_code, trust_id, address, contact_email, 
        contact_phone, principal_name, established_year, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        schoolData.school_name,
        schoolData.school_code,
        schoolData.trust_id,
        schoolData.address || null,
        schoolData.contact_email,
        schoolData.contact_phone || null,
        schoolData.principal_name || null,
        schoolData.established_year || null,
        schoolData.is_active
      ]
    );

    return (result as any).insertId;
  }

  async findSchoolById(schoolId: number) {
    // First try to find the school in master DB to get trust_id
    const masterConn = await dbManager.getMasterConnection();
    const [trustRows] = await masterConn.execute(
      'SELECT id FROM trusts WHERE id IN (SELECT DISTINCT trust_id FROM information_schema.tables WHERE table_schema LIKE "school_erp_trust_%")'
    );
    
    if (!Array.isArray(trustRows)) return null;
    
    // Search across all trust databases
    for (const trustRow of trustRows as any[]) {
      const trustId = trustRow.id;
      try {
        const trustConn = await dbManager.getTrustConnection(trustId);
        const [schoolRows] = await trustConn.execute(
          'SELECT id, school_name, trust_id FROM schools WHERE id = ? LIMIT 1',
          [schoolId]
        );
        if (Array.isArray(schoolRows) && schoolRows.length > 0) {
          return schoolRows[0] as any;
        }
      } catch (error) {
        continue; // Try next trust
      }
    }
    return null;
  }

  async createAcademicYear(yearData: {
    school_id: number;
    year_name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    is_active: boolean;
  }): Promise<number> {
    // Get trust_id from school
    const school = await this.findSchoolById(yearData.school_id);
    if (!school) throw new Error('School not found');
    
    const connection = await dbManager.getTrustConnection(school.trust_id);
    
    const [result] = await connection.execute(
      `INSERT INTO academic_years (
        school_id, year_name, start_date, end_date, is_current, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        yearData.school_id,
        yearData.year_name,
        yearData.start_date,
        yearData.end_date,
        yearData.is_current,
        yearData.is_active
      ]
    );

    return (result as any).insertId;
  }

  async unsetCurrentAcademicYears(schoolId: number): Promise<void> {
    const school = await this.findSchoolById(schoolId);
    if (!school) return;
    
    const connection = await dbManager.getTrustConnection(school.trust_id);
    await connection.execute(
      'UPDATE academic_years SET is_current = 0 WHERE school_id = ?',
      [schoolId]
    );
  }

  async findAcademicYearById(academicYearId: number, schoolId: number) {
    const school = await this.findSchoolById(schoolId);
    if (!school) return null;
    
    const connection = await dbManager.getTrustConnection(school.trust_id);
    const [rows] = await connection.execute(
      'SELECT id, year_name, school_id FROM academic_years WHERE id = ? AND school_id = ? LIMIT 1',
      [academicYearId, schoolId]
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] as any : null;
  }

  async createClassesAndSections(
    schoolId: number, 
    academicYearId: number, 
    classes: Array<{class_name: string; class_order: number; sections: Array<{section_name: string; capacity: number}>}>,
    houses: Array<{house_name: string; house_color?: string}>
  ) {
    const school = await this.findSchoolById(schoolId);
    if (!school) throw new Error('School not found');
    
    const connection = await dbManager.getTrustConnection(school.trust_id);
    
    let classesCreated = 0;
    let sectionsCreated = 0;
    let housesCreated = 0;
    
    // Create houses first
    for (const house of houses) {
      await connection.execute(
        'INSERT INTO houses (school_id, house_name, house_color, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [schoolId, house.house_name, house.house_color || null]
      );
      housesCreated++;
    }
    
    // Create classes and sections
    for (const cls of classes) {
      const [classResult] = await connection.execute(
        'INSERT INTO classes (school_id, academic_year_id, class_name, class_order, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [schoolId, academicYearId, cls.class_name, cls.class_order]
      );
      const classId = (classResult as any).insertId;
      classesCreated++;
      
      for (const section of cls.sections) {
        await connection.execute(
          'INSERT INTO sections (class_id, section_name, capacity, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [classId, section.section_name, section.capacity]
        );
        sectionsCreated++;
      }
    }
    
    return { classes_created: classesCreated, sections_created: sectionsCreated, houses_created: housesCreated };
  }

  async createSubjectsAndGrading(
    schoolId: number,
    subjects: Array<{subject_name: string; subject_code: string; class_ids: number[]}>,
    grading_system: {type: string; pass_percentage?: number; grades?: Array<{grade: string; min_percentage: number; max_percentage: number}>}
  ) {
    const school = await this.findSchoolById(schoolId);
    if (!school) throw new Error('School not found');
    
    const connection = await dbManager.getTrustConnection(school.trust_id);
    
    let subjectsCreated = 0;
    
    // Create subjects
    for (const subject of subjects) {
      const [subjectResult] = await connection.execute(
        'INSERT INTO subjects (school_id, subject_name, subject_code, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [schoolId, subject.subject_name, subject.subject_code]
      );
      const subjectId = (subjectResult as any).insertId;
      subjectsCreated++;
      
      // Link subject to classes
      for (const classId of subject.class_ids) {
        await connection.execute(
          'INSERT INTO class_subjects (class_id, subject_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
          [classId, subjectId]
        );
      }
    }
    
    // Save grading system to trust config
    await connection.execute(
      `INSERT INTO trust_config (trust_id, config_key, config_value, created_at, updated_at) 
       VALUES (?, 'grading_system', ?, NOW(), NOW()) 
       ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = NOW()`,
      [school.trust_id, JSON.stringify(grading_system)]
    );
    
    return { subjects_created: subjectsCreated, grading_configured: true };
  }

  async saveTrustConfig(trustId: number, config: Record<string, any>) {
    const connection = await dbManager.getTrustConnection(trustId);
    
    // Save each config item
    for (const [key, value] of Object.entries(config)) {
      await connection.execute(
        `INSERT INTO trust_config (trust_id, config_key, config_value, created_at, updated_at) 
         VALUES (?, ?, ?, NOW(), NOW()) 
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = NOW()`,
        [trustId, key, JSON.stringify(value)]
      );
    }
  }

  async createAdminUsers(
    schoolId: number,
    trustId: number,
    adminUsers: Array<{email: string; password: string; full_name: string; role: string; phone?: string}>
  ) {
    const connection = await dbManager.getTrustConnection(trustId);
    
    let usersCreated = 0;
    let rolesAssigned = 0;
    
    for (const user of adminUsers) {
      // Hash password (in a real implementation, use argon2 or bcrypt)
      const hashedPassword = user.password; // TODO: Hash password properly
      
      const [userResult] = await connection.execute(
        `INSERT INTO users (school_id, email, password_hash, full_name, phone, role, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [schoolId, user.email, hashedPassword, user.full_name, user.phone || null, user.role]
      );
      usersCreated++;
      rolesAssigned++;
    }
    
    return { users_created: usersCreated, roles_assigned: rolesAssigned };
  }
}

// SETUP-01-001 — Suggested tables: trusts, system_config
// SETUP-01-002 — Suggested tables: schools
// SETUP-01-003 — Suggested tables: academic_years
// SETUP-01-004 — Suggested tables: classes, sections, houses
// SETUP-01-005 — Suggested tables: classes, trust_config
// SETUP-01-006 — Suggested tables: trust_config
// SETUP-01-007 — Suggested tables: users, trust_config