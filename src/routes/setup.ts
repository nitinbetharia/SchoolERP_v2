/**
 * SETUP Routes - Wizard-based system configuration
 * Implementation of trust setup, school onboarding, and configuration wizards
 */

import { Router } from 'express';
import { z } from 'zod';
import { trustContextMiddleware, requireTrustContext } from '../middleware/trust-context';
import { flashMiddleware, asFlash, successFlash, frontendErrorHandler } from '../middleware/error-envelope';
import { api } from '../ui/adapters/api-client';

export const setupRouter = Router();

// Apply middleware
setupRouter.use(trustContextMiddleware);
setupRouter.use(flashMiddleware);

// Require authentication for all setup routes
setupRouter.use((req, res, next) => {
  if (!(req.session as any)?.user) {
    (req.session as any).returnTo = req.originalUrl;
    (req.session as any).flash = asFlash({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Please sign in to access the setup wizard'
      }
    });
    return res.redirect('/auth/login');
  }
  
  // Check if user has admin permissions
  const userRole = (req.session as any).user.role;
  if (!['SYSTEM_ADMIN', 'GROUP_ADMIN', 'TRUST_ADMIN'].includes(userRole)) {
    return res.status(403).render('errors/403', {
      title: 'Access Denied',
      message: 'You do not have permission to access the setup wizard',
      hideNavigation: false
    });
  }
  
  next();
});

// Wizard configuration
const WIZARD_CONFIGS: Record<string, any> = {
  'trust-setup': {
    id: 'trust-setup',
    name: 'Trust Setup Wizard',
    description: 'Configure your educational trust and schools step by step',
    saveProgress: true,
    restartable: true,
    timeoutMinutes: 120, // 2 hours
    steps: [
      {
        id: 'trust-basic',
        title: 'Trust Information',
        description: 'Basic trust details and branding',
        activityId: 'SETUP-01-001',
        endpoint: '/setup/trusts',
        dependencies: []
      },
      {
        id: 'school-basic',
        title: 'School Information', 
        description: 'Add your first school',
        activityId: 'SETUP-01-002',
        endpoint: '/setup/schools',
        dependencies: ['trust-basic']
      },
      {
        id: 'academic-year',
        title: 'Academic Year',
        description: 'Set up the current academic year',
        activityId: 'SETUP-01-003', 
        endpoint: '/setup/academic-years',
        dependencies: ['school-basic']
      },
      {
        id: 'classes-sections',
        title: 'Classes & Sections',
        description: 'Configure class structure and houses',
        activityId: 'SETUP-01-004',
        endpoint: '/setup/classes',
        dependencies: ['academic-year']
      },
      {
        id: 'subjects-grading',
        title: 'Subjects & Grading',
        description: 'Set up subjects and grading system',
        activityId: 'SETUP-01-005',
        endpoint: '/setup/academics',
        dependencies: ['classes-sections']
      },
      {
        id: 'configuration',
        title: 'System Configuration',
        description: 'Configure school-level settings',
        activityId: 'SETUP-01-006',
        endpoint: '/setup/config',
        dependencies: ['school-basic']
      },
      {
        id: 'admin-users',
        title: 'Administrator Setup',
        description: 'Create admin users and assign roles',
        activityId: 'SETUP-01-007',
        endpoint: '/setup/roles',
        dependencies: ['school-basic']
      }
    ]
  }
};

// Wizard helper functions
function getWizardHelpers(wizardId: string, session: any) {
  const config = WIZARD_CONFIGS[wizardId];
  const wizardSession = session.wizards?.[wizardId] || {
    completedSteps: [],
    currentData: {},
    startedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  return {
    isStepCompleted: (stepId: string) => wizardSession.completedSteps.includes(stepId),
    isStepAccessible: (stepId: string) => {
      const step = config.steps.find((s: any) => s.id === stepId);
      if (!step) return false;
      
      // Check if all dependencies are completed
      return step.dependencies.every((dep: string) => wizardSession.completedSteps.includes(dep));
    },
    getStepNumber: (stepId: string) => {
      const index = config.steps.findIndex((s: any) => s.id === stepId);
      return index >= 0 ? index + 1 : 0;
    },
    getProgress: () => {
      return Math.round((wizardSession.completedSteps.length / config.steps.length) * 100);
    },
    getCurrentStep: (stepId?: string) => {
      if (stepId) {
        return config.steps.find((s: any) => s.id === stepId) || config.steps[0];
      }
      
      // Find the first incomplete accessible step
      for (const step of config.steps) {
        if (!wizardSession.completedSteps.includes(step.id) && 
            step.dependencies.every((dep: string) => wizardSession.completedSteps.includes(dep))) {
          return step;
        }
      }
      
      // All steps completed
      return config.steps[config.steps.length - 1];
    }
  };
}

/**
 * SETUP Wizard Entry Point
 */
setupRouter.get('/', requireTrustContext, (req, res) => {
  res.render('setup/index', {
    title: 'System Setup',
    pageHeader: {
      title: 'System Setup',
      description: 'Configure your school management system'
    },
    wizards: Object.values(WIZARD_CONFIGS),
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Setup', href: '/setup' }
    ]
  });
});

/**
 * Trust Setup Wizard - Entry Point
 */
setupRouter.get('/trust-setup', requireTrustContext, (req, res) => {
  const helpers = getWizardHelpers('trust-setup', req.session);
  const currentStep = helpers.getCurrentStep();
  
  // Redirect to the current step
  res.redirect(`/setup/trust-setup/${currentStep.id}`);
});

/**
 * Trust Setup Wizard - Specific Step
 */
setupRouter.get('/trust-setup/:stepId', requireTrustContext, (req, res) => {
  const { stepId } = req.params;
  const config = WIZARD_CONFIGS['trust-setup'];
  const helpers = getWizardHelpers('trust-setup', req.session);
  
  // Validate step exists
  const step = config.steps.find((s: any) => s.id === stepId);
  if (!step) {
    return res.status(404).render('errors/404', {
      title: 'Step Not Found',
      message: 'The requested wizard step was not found'
    });
  }
  
  // Check if step is accessible
  if (!helpers.isStepAccessible(stepId)) {
    (req.session as any).flash = asFlash({
      error: {
        code: 'STEP_NOT_ACCESSIBLE',
        message: 'Please complete the previous steps first'
      }
    });
    const currentStep = helpers.getCurrentStep();
    return res.redirect(`/setup/trust-setup/${currentStep.id}`);
  }
  
  // Initialize wizard session if needed
  if (!(req.session as any).wizards) (req.session as any).wizards = {};
  if (!(req.session as any).wizards['trust-setup']) {
    (req.session as any).wizards['trust-setup'] = {
      completedSteps: [],
      currentData: {},
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
  }
  
  // Update last activity
  (req.session as any).wizards['trust-setup'].lastActivity = new Date().toISOString();
  
  // Prepare wizard data for template
  const wizardData = {
    config,
    currentStep: step,
    session: (req.session as any).wizards['trust-setup'],
    progress: helpers.getProgress()
  };
  
  // Prepare form data (from session or empty)
  const formData = (req.session as any).wizards['trust-setup'].currentData[stepId] || {};
  
  res.render(`setup/steps/${stepId}`, {
    title: `${step.title} - Trust Setup`,
    wizard: wizardData,
    wizardHelpers: helpers,
    formData,
    fieldErrors: (req.session as any).fieldErrors || {},
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Setup', href: '/setup' },
      { label: 'Trust Setup', href: '/setup/trust-setup' },
      { label: step.title }
    ],
    hideNavigation: false,
    pageStyles: ['/css/wizard.css']
  });
  
  // Clear field errors after use
  delete (req.session as any).fieldErrors;
});

/**
 * Trust Setup Wizard - Process Step Submission
 */
setupRouter.post('/trust-setup/:stepId', requireTrustContext, async (req, res) => {
  const { stepId } = req.params;
  const config = WIZARD_CONFIGS['trust-setup'];
  const helpers = getWizardHelpers('trust-setup', req.session);
  
  try {
    const step = config.steps.find((s: any) => s.id === stepId);
    if (!step || !helpers.isStepAccessible(stepId)) {
      return res.status(404).json({
        success: false,
        error: { code: 'INVALID_STEP', message: 'Invalid wizard step' }
      });
    }
    
    // Initialize wizard session
    if (!(req.session as any).wizards) (req.session as any).wizards = {};
    if (!(req.session as any).wizards['trust-setup']) {
      (req.session as any).wizards['trust-setup'] = {
        completedSteps: [],
        currentData: {},
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
    }
    
    // Save form data to session
    (req.session as any).wizards['trust-setup'].currentData[stepId] = req.body;
    (req.session as any).wizards['trust-setup'].lastActivity = new Date().toISOString();
    
    // Submit to backend API
    const headers: Record<string, string> = {
      'X-Trust-Context': res.locals.trust?.slug || 'default'
    };
    
    if ((req.session as any).sessionToken) {
      headers['Authorization'] = `Bearer ${(req.session as any).sessionToken}`;
    }
    
    const apiResponse = await api.post(step.endpoint, req.body, {
      headers
    });
    
    if (apiResponse.data.success) {
      // Mark step as completed
      if (!(req.session as any).wizards['trust-setup'].completedSteps.includes(stepId)) {
        (req.session as any).wizards['trust-setup'].completedSteps.push(stepId);
      }
      
      // Store result data
      (req.session as any).wizards['trust-setup'].currentData[`${stepId}_result`] = apiResponse.data.data;
      
      // Determine next step
      const nextStep = helpers.getCurrentStep();
      const isLastStep = config.steps[config.steps.length - 1].id === stepId;
      
      if (isLastStep) {
        // Wizard completed
        (req.session as any).flash = successFlash('Trust setup completed successfully!');
        res.json({
          success: true,
          data: {
            completed: true,
            redirect: '/dashboard'
          }
        });
      } else {
        // Continue to next step
        res.json({
          success: true,
          data: {
            completed: false,
            redirect: `/setup/trust-setup/${nextStep.id}`,
            nextStep: nextStep.title
          }
        });
      }
    } else {
      throw new Error(apiResponse.data.error?.message || 'API request failed');
    }
    
  } catch (error: any) {
    console.error(`Setup step ${stepId} error:`, error);
    
    // Handle validation errors
    if (error?.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData?.error?.details) {
        const fieldErrors: Record<string, string> = {};
        errorData.error.details.forEach((issue: any) => {
          if (issue.path?.length > 0) {
            fieldErrors[issue.path[0]] = issue.message;
          }
        });
        (req.session as any).fieldErrors = fieldErrors;
      }
    }
    
    res.status(error?.response?.status || 500).json({
      success: false,
      error: (asFlash(error) as any).error || { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' }
    });
  }
});

/**
 * Auto-save wizard progress
 */
setupRouter.post('/trust-setup/:stepId/auto-save', requireTrustContext, (req, res) => {
  const { stepId } = req.params;
  
  try {
    // Initialize wizard session if needed
    if (!(req.session as any).wizards) (req.session as any).wizards = {};
    if (!(req.session as any).wizards['trust-setup']) {
      (req.session as any).wizards['trust-setup'] = {
        completedSteps: [],
        currentData: {},
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
    }
    
    // Save form data
    (req.session as any).wizards['trust-setup'].currentData[stepId] = req.body;
    (req.session as any).wizards['trust-setup'].lastActivity = new Date().toISOString();
    
    res.json({ success: true, data: { saved: true } });
  } catch (error) {
    console.error('Auto-save error:', error);
    res.status(500).json({ success: false, error: { message: 'Auto-save failed' } });
  }
});

/**
 * Restart wizard
 */
setupRouter.post('/trust-setup/restart', requireTrustContext, (req, res) => {
  try {
    // Clear wizard session data
    if ((req.session as any).wizards) {
      delete (req.session as any).wizards['trust-setup'];
    }
    
    (req.session as any).flash = successFlash('Wizard has been restarted');
    res.json({ success: true, data: { restarted: true } });
  } catch (error) {
    console.error('Restart wizard error:', error);
    res.status(500).json({ success: false, error: { message: 'Restart failed' } });
  }
});

// Error handler
setupRouter.use(frontendErrorHandler);

export default setupRouter;