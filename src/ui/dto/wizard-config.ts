/**
 * Wizard Configuration System - DRY approach for flexible setup flows
 * Allows adding/removing/editing wizards without changing core logic
 */

import { z } from 'zod';

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  activityId: string; // Maps to backend API activity (e.g., SETUP-01-001)
  endpoint: string;   // Backend endpoint path
  method: 'GET' | 'POST' | 'PUT';
  template: string;   // EJS template path
  validation: z.ZodSchema;
  requiredRole: string[];
  dependencies?: string[]; // Previous step IDs that must be completed
  optional?: boolean;
  skipCondition?: (wizardData: any) => boolean;
}

export interface WizardConfig {
  id: string;
  name: string;
  description: string;
  category: 'setup' | 'onboarding' | 'configuration';
  steps: WizardStep[];
  requiredRole: string[];
  restartable: boolean;
  saveProgress: boolean;
  timeoutMinutes?: number;
}

// Wizard registry - easy to add/remove/modify wizards
export const WIZARD_CONFIGS: Record<string, WizardConfig> = {
  'trust-setup': {
    id: 'trust-setup',
    name: 'Trust Setup Wizard',
    description: 'Complete trust organization setup',
    category: 'setup',
    requiredRole: ['SYSTEM_ADMIN'],
    restartable: true,
    saveProgress: true,
    timeoutMinutes: 60,
    steps: [
      {
        id: 'trust-creation',
        title: 'Create Trust Organization',
        description: 'Basic trust information and configuration',
        activityId: 'SETUP-01-001',
        endpoint: '/api/v1/setup/trust',
        method: 'POST',
        template: 'setup/trust-creation',
        validation: z.object({
          trust_name: z.string().min(2).max(255),
          trust_code: z.string().min(2).max(20),
          subdomain: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
          contact_email: z.string().email(),
          contact_phone: z.string().min(10).max(15),
          address: z.string().max(500),
          description: z.string().max(1000).optional(),
          theme: z.enum(['default', 'blue', 'green', 'purple']).default('default'),
          storage_type: z.enum(['local', 's3', 'azure']).default('local'),
          timezone: z.string().default('Asia/Kolkata')
        }),
        requiredRole: ['SYSTEM_ADMIN']
      },
      {
        id: 'school-creation',
        title: 'Add Schools',
        description: 'Create schools under this trust',
        activityId: 'SETUP-01-002',
        endpoint: '/api/v1/setup/schools',
        method: 'POST',
        template: 'setup/school-creation',
        validation: z.object({
          schools: z.array(z.object({
            school_name: z.string().min(2).max(255),
            school_code: z.string().min(2).max(20),
            address: z.string().max(500),
            contact_email: z.string().email(),
            contact_phone: z.string().min(10).max(15),
            principal_name: z.string().max(255),
            established_year: z.number().int().min(1800).max(new Date().getFullYear()),
            board_affiliation: z.string().max(100).optional(),
            school_type: z.enum(['PRIMARY', 'SECONDARY', 'SENIOR_SECONDARY', 'ALL']).default('ALL')
          })).min(1).max(10)
        }),
        requiredRole: ['SYSTEM_ADMIN'],
        dependencies: ['trust-creation']
      },
      {
        id: 'academic-setup',
        title: 'Academic Structure',
        description: 'Configure academic years, terms, and calendar',
        activityId: 'SETUP-01-003',
        endpoint: '/api/v1/setup/academic',
        method: 'POST',
        template: 'setup/academic-setup',
        validation: z.object({
          academic_years: z.array(z.object({
            year_name: z.string().max(50),
            start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            is_current: z.boolean().default(false)
          })).min(1).max(5),
          terms: z.array(z.object({
            term_name: z.string().max(50),
            start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            academic_year: z.string()
          })).min(1)
        }),
        requiredRole: ['SYSTEM_ADMIN'],
        dependencies: ['school-creation']
      },
      {
        id: 'class-structure',
        title: 'Class & Section Setup',
        description: 'Define classes, sections, and subjects',
        activityId: 'SETUP-01-004',
        endpoint: '/api/v1/setup/classes',
        method: 'POST',
        template: 'setup/class-structure',
        validation: z.object({
          classes: z.array(z.object({
            class_name: z.string().max(50),
            class_code: z.string().max(10),
            grade_level: z.number().int().min(1).max(12),
            sections: z.array(z.object({
              section_name: z.string().max(10),
              capacity: z.number().int().min(1).max(100)
            })).min(1),
            subjects: z.array(z.object({
              subject_name: z.string().max(100),
              subject_code: z.string().max(10),
              is_mandatory: z.boolean().default(true)
            })).min(1)
          })).min(1)
        }),
        requiredRole: ['SYSTEM_ADMIN'],
        dependencies: ['academic-setup']
      },
      {
        id: 'grading-system',
        title: 'Grading & Assessment',
        description: 'Configure grading systems and assessment patterns',
        activityId: 'SETUP-01-005',
        endpoint: '/api/v1/setup/grading',
        method: 'POST',
        template: 'setup/grading-system',
        validation: z.object({
          grading_systems: z.array(z.object({
            name: z.string().max(50),
            type: z.enum(['PERCENTAGE', 'GRADE_POINT', 'LETTER_GRADE']),
            grades: z.array(z.object({
              grade: z.string().max(5),
              min_marks: z.number().min(0).max(100),
              max_marks: z.number().min(0).max(100),
              grade_point: z.number().min(0).max(10).optional()
            })).min(1)
          })).min(1),
          assessment_types: z.array(z.object({
            name: z.string().max(100),
            weightage: z.number().min(0).max(100),
            is_internal: z.boolean().default(true)
          })).min(1)
        }),
        requiredRole: ['SYSTEM_ADMIN'],
        dependencies: ['class-structure']
      },
      {
        id: 'system-config',
        title: 'System Configuration',
        description: 'Final system settings and preferences',
        activityId: 'SETUP-01-006',
        endpoint: '/api/v1/setup/config',
        method: 'POST',
        template: 'setup/system-config',
        validation: z.object({
          config: z.object({
            auto_generate_ids: z.boolean().default(true),
            student_id_format: z.string().default('{YEAR}{SCHOOL}{CLASS}{SEQ}'),
            fee_due_reminder_days: z.number().int().min(1).max(30).default(7),
            attendance_grace_minutes: z.number().int().min(0).max(30).default(15),
            default_late_fee_percentage: z.number().min(0).max(50).default(5),
            allow_partial_payments: z.boolean().default(true),
            enable_parent_portal: z.boolean().default(true),
            enable_teacher_portal: z.boolean().default(true),
            enable_online_payments: z.boolean().default(false),
            sms_notifications: z.boolean().default(false),
            email_notifications: z.boolean().default(true)
          })
        }),
        requiredRole: ['SYSTEM_ADMIN'],
        dependencies: ['grading-system']
      },
      {
        id: 'admin-user',
        title: 'Administrator Setup',
        description: 'Create initial administrator users',
        activityId: 'SETUP-01-007',
        endpoint: '/api/v1/setup/admin-users',
        method: 'POST',
        template: 'setup/admin-user',
        validation: z.object({
          users: z.array(z.object({
            first_name: z.string().min(2).max(100),
            last_name: z.string().min(2).max(100),
            email: z.string().email(),
            phone: z.string().min(10).max(15),
            role: z.enum(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
            school_id: z.number().int().positive().optional(),
            send_welcome_email: z.boolean().default(true)
          })).min(1).max(5)
        }),
        requiredRole: ['SYSTEM_ADMIN'],
        dependencies: ['system-config']
      }
    ]
  },

  'school-onboarding': {
    id: 'school-onboarding',
    name: 'New School Onboarding',
    description: 'Quick setup for adding new schools to existing trust',
    category: 'onboarding',
    requiredRole: ['TRUST_ADMIN'],
    restartable: true,
    saveProgress: true,
    timeoutMinutes: 30,
    steps: [
      {
        id: 'school-info',
        title: 'School Information',
        description: 'Basic school details',
        activityId: 'SETUP-01-002',
        endpoint: '/api/v1/setup/schools',
        method: 'POST',
        template: 'setup/school-info',
        validation: z.object({
          school_name: z.string().min(2).max(255),
          school_code: z.string().min(2).max(20),
          address: z.string().max(500),
          contact_email: z.string().email(),
          contact_phone: z.string().min(10).max(15),
          principal_name: z.string().max(255),
          established_year: z.number().int().min(1800).max(new Date().getFullYear())
        }),
        requiredRole: ['TRUST_ADMIN']
      },
      {
        id: 'school-admin',
        title: 'School Administrator',
        description: 'Create school admin user',
        activityId: 'SETUP-01-007',
        endpoint: '/api/v1/setup/admin-users',
        method: 'POST',
        template: 'setup/school-admin',
        validation: z.object({
          first_name: z.string().min(2).max(100),
          last_name: z.string().min(2).max(100),
          email: z.string().email(),
          phone: z.string().min(10).max(15)
        }),
        requiredRole: ['TRUST_ADMIN'],
        dependencies: ['school-info']
      }
    ]
  },

  'fee-structure': {
    id: 'fee-structure',
    name: 'Fee Structure Setup',
    description: 'Configure fee structures and payment plans',
    category: 'configuration',
    requiredRole: ['SCHOOL_ADMIN', 'TRUST_ADMIN'],
    restartable: true,
    saveProgress: true,
    steps: [
      {
        id: 'fee-categories',
        title: 'Fee Categories',
        description: 'Define fee categories and types',
        activityId: 'FEES-05-001',
        endpoint: '/api/v1/fees/structures',
        method: 'POST',
        template: 'fees/fee-categories',
        validation: z.object({
          categories: z.array(z.object({
            name: z.string().max(100),
            description: z.string().max(255),
            is_mandatory: z.boolean().default(true),
            is_refundable: z.boolean().default(false)
          })).min(1)
        }),
        requiredRole: ['SCHOOL_ADMIN', 'TRUST_ADMIN']
      }
    ]
  }
};

// Utility functions for wizard management
export class WizardManager {
  static getWizard(wizardId: string): WizardConfig | null {
    return WIZARD_CONFIGS[wizardId] || null;
  }

  static getAvailableWizards(userRole: string): WizardConfig[] {
    return Object.values(WIZARD_CONFIGS).filter(wizard => 
      wizard.requiredRole.includes(userRole)
    );
  }

  static getWizardsByCategory(category: WizardConfig['category']): WizardConfig[] {
    return Object.values(WIZARD_CONFIGS).filter(wizard => 
      wizard.category === category
    );
  }

  static addWizard(config: WizardConfig): void {
    WIZARD_CONFIGS[config.id] = config;
  }

  static removeWizard(wizardId: string): void {
    delete WIZARD_CONFIGS[wizardId];
  }

  static updateWizard(wizardId: string, updates: Partial<WizardConfig>): void {
    if (WIZARD_CONFIGS[wizardId]) {
      WIZARD_CONFIGS[wizardId] = { ...WIZARD_CONFIGS[wizardId], ...updates };
    }
  }

  static validateStep(wizardId: string, stepId: string, data: any): { success: boolean, errors?: any[] } {
    const wizard = this.getWizard(wizardId);
    if (!wizard) return { success: false, errors: ['Wizard not found'] };

    const step = wizard.steps.find(s => s.id === stepId);
    if (!step) return { success: false, errors: ['Step not found'] };

    const result = step.validation.safeParse(data);
    return {
      success: result.success,
      errors: result.success ? undefined : result.error.issues
    };
  }

  static getNextStep(wizardId: string, currentStepId: string, wizardData: any): WizardStep | null {
    const wizard = this.getWizard(wizardId);
    if (!wizard) return null;

    const currentIndex = wizard.steps.findIndex(s => s.id === currentStepId);
    if (currentIndex === -1 || currentIndex >= wizard.steps.length - 1) return null;

    // Find next non-skipped step
    for (let i = currentIndex + 1; i < wizard.steps.length; i++) {
      const step = wizard.steps[i];
      if (!step.skipCondition || !step.skipCondition(wizardData)) {
        return step;
      }
    }

    return null;
  }

  static canAccessStep(wizardId: string, stepId: string, wizardData: any): boolean {
    const wizard = this.getWizard(wizardId);
    if (!wizard) return false;

    const step = wizard.steps.find(s => s.id === stepId);
    if (!step) return false;

    // Check dependencies
    if (step.dependencies) {
      return step.dependencies.every(depId => 
        wizardData.completedSteps && wizardData.completedSteps.includes(depId)
      );
    }

    return true;
  }
}

export default WizardManager;