/** Services for module: SETUP */
import { SetupRepo } from './repos';
import type { 
  Setup01001Request, Setup01002Request, Setup01003Request, Setup01004Request,
  Setup01005Request, Setup01006Request, Setup01007Request
} from './dtos';
import type { z } from 'zod';

const repo = new SetupRepo();

/** SETUP-01-001 — Wizard: Trust creation */
export async function setup_01_001Service(input: z.infer<typeof Setup01001Request>) {
  const { trust_name, trust_code, description, subdomain, contact_email, contact_phone, address, is_active } = input;
  
  // Check if trust code or subdomain already exists
  const existingTrust = await repo.findTrustByCodeOrSubdomain(trust_code, subdomain);
  if (existingTrust) {
    throw new Error(`Trust with code '${trust_code}' or subdomain '${subdomain}' already exists`);
  }
  
  // Create trust
  const trustId = await repo.createTrust({
    trust_name,
    trust_code,
    description,
    subdomain,
    contact_email,
    contact_phone,
    address,
    is_active
  });
  
  // Initialize trust configuration
  await repo.initializeTrustConfig(trustId);
  
  return {
    trust_id: trustId,
    trust_name,
    trust_code,
    subdomain,
    created_at: new Date().toISOString(),
    is_active
  };
}

/** SETUP-01-002 — Wizard: School creation */
export async function setup_01_002Service(input: z.infer<typeof Setup01002Request>) {
  const { school_name, school_code, trust_id, address, contact_email, contact_phone, principal_name, established_year, is_active } = input;
  
  // Verify trust exists and is active
  const trust = await repo.findTrustById(trust_id);
  if (!trust || !trust.is_active) {
    throw new Error(`Trust ${trust_id} not found or inactive`);
  }
  
  // Check if school code already exists within the trust
  const existingSchool = await repo.findSchoolByCodeAndTrust(school_code, trust_id);
  if (existingSchool) {
    throw new Error(`School with code '${school_code}' already exists in this trust`);
  }
  
  // Create school
  const schoolId = await repo.createSchool({
    school_name,
    school_code,
    trust_id,
    address,
    contact_email,
    contact_phone,
    principal_name,
    established_year,
    is_active
  });
  
  return {
    school_id: schoolId,
    school_name,
    school_code,
    trust_id,
    created_at: new Date().toISOString(),
    is_active
  };
}

/** SETUP-01-003 — Wizard: Academic year creation */
export async function setup_01_003Service(input: z.infer<typeof Setup01003Request>) {
  const { school_id, year_name, start_date, end_date, is_current, is_active } = input;
  
  // Verify school exists
  const school = await repo.findSchoolById(school_id);
  if (!school) {
    throw new Error(`School ${school_id} not found`);
  }
  
  // Validate dates
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  if (startDate >= endDate) {
    throw new Error('Start date must be before end date');
  }
  
  // If setting as current, unset other current years for this school
  if (is_current) {
    await repo.unsetCurrentAcademicYears(school_id);
  }
  
  const academicYearId = await repo.createAcademicYear({
    school_id,
    year_name,
    start_date,
    end_date,
    is_current,
    is_active
  });
  
  return {
    academic_year_id: academicYearId,
    year_name,
    school_id,
    start_date,
    end_date,
    is_current,
    created_at: new Date().toISOString()
  };
}

/** SETUP-01-004 — Class & section setup (+ House) */
export async function setup_01_004Service(input: z.infer<typeof Setup01004Request>) {
  const { school_id, academic_year_id, classes, houses } = input;
  
  // Verify school and academic year exist
  const school = await repo.findSchoolById(school_id);
  if (!school) {
    throw new Error(`School ${school_id} not found`);
  }
  
  const academicYear = await repo.findAcademicYearById(academic_year_id, school_id);
  if (!academicYear) {
    throw new Error(`Academic year ${academic_year_id} not found for school ${school_id}`);
  }
  
  const results = await repo.createClassesAndSections(school_id, academic_year_id, classes, houses || []);
  
  return {
    classes_created: results.classes_created,
    sections_created: results.sections_created,
    houses_created: results.houses_created,
    created_at: new Date().toISOString()
  };
}

/** SETUP-01-005 — Subject & grading configuration */
export async function setup_01_005Service(input: z.infer<typeof Setup01005Request>) {
  const { school_id, subjects, grading_system } = input;
  
  const school = await repo.findSchoolById(school_id);
  if (!school) {
    throw new Error(`School ${school_id} not found`);
  }
  
  const results = await repo.createSubjectsAndGrading(school_id, subjects, grading_system);
  
  return {
    subjects_created: results.subjects_created,
    grading_configured: results.grading_configured,
    created_at: new Date().toISOString()
  };
}

/** SETUP-01-006 — Trust/school-level config */
export async function setup_01_006Service(input: z.infer<typeof Setup01006Request>) {
  const { school_id, config } = input;
  
  const school = await repo.findSchoolById(school_id);
  if (!school) {
    throw new Error(`School ${school_id} not found`);
  }
  
  await repo.saveTrustConfig(school.trust_id, config);
  
  return {
    config_updated: true,
    updated_at: new Date().toISOString()
  };
}

/** SETUP-01-007 — Role seeding (admins) */
export async function setup_01_007Service(input: z.infer<typeof Setup01007Request>) {
  const { school_id, admin_users } = input;
  
  const school = await repo.findSchoolById(school_id);
  if (!school) {
    throw new Error(`School ${school_id} not found`);
  }
  
  const results = await repo.createAdminUsers(school_id, school.trust_id, admin_users);
  
  return {
    users_created: results.users_created,
    roles_assigned: results.roles_assigned,
    created_at: new Date().toISOString()
  };
}
