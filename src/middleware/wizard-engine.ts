/**
 * Wizard Engine Middleware - DRY approach for all setup wizards
 * Handles wizard state, navigation, validation, and progress tracking
 */

import { Request, Response, NextFunction } from 'express';
import { WizardManager, WizardConfig, WizardStep } from '../ui/dto/wizard-config';

export interface WizardSession {
  wizardId: string;
  currentStep: string;
  completedSteps: string[];
  data: Record<string, any>;
  startedAt: Date;
  lastActivity: Date;
  isComplete: boolean;
}

export interface WizardRequest extends Request {
  wizard?: {
    config: WizardConfig;
    session: WizardSession;
    currentStep: WizardStep;
    nextStep: WizardStep | null;
    previousStep: WizardStep | null;
    progress: number;
    canProceed: boolean;
  };
}

export class WizardEngine {
  /**
   * Initialize wizard session
   */
  static initializeWizard(req: WizardRequest, res: Response, wizardId: string): boolean {
    const config = WizardManager.getWizard(wizardId);
    if (!config) return false;

    // Check user permissions
    const userRole = res.locals.user?.role || '';
    if (!config.requiredRole.includes(userRole)) {
      return false;
    }

    // Initialize or restore session
    const sessionKey = `wizard_${wizardId}`;
    let session: WizardSession = (req.session as any)[sessionKey] || {
      wizardId,
      currentStep: config.steps[0].id,
      completedSteps: [],
      data: {},
      startedAt: new Date(),
      lastActivity: new Date(),
      isComplete: false
    };

    // Check timeout
    if (config.timeoutMinutes) {
      const timeoutMs = config.timeoutMinutes * 60 * 1000;
      if (new Date().getTime() - session.lastActivity.getTime() > timeoutMs) {
        // Reset expired session
        session = {
          wizardId,
          currentStep: config.steps[0].id,
          completedSteps: [],
          data: {},
          startedAt: new Date(),
          lastActivity: new Date(),
          isComplete: false
        };
      }
    }

    session.lastActivity = new Date();
    (req.session as any)[sessionKey] = session;

    // Attach wizard context to request
    const currentStep = config.steps.find(s => s.id === session.currentStep)!;
    const currentIndex = config.steps.findIndex(s => s.id === session.currentStep);
    
    req.wizard = {
      config,
      session,
      currentStep,
      nextStep: WizardManager.getNextStep(wizardId, session.currentStep, session.data),
      previousStep: currentIndex > 0 ? config.steps[currentIndex - 1] : null,
      progress: Math.round((session.completedSteps.length / config.steps.length) * 100),
      canProceed: WizardManager.canAccessStep(wizardId, session.currentStep, session.data)
    };

    return true;
  }

  /**
   * Validate and process wizard step
   */
  static async processStep(req: WizardRequest, res: Response, data: any): Promise<{
    success: boolean;
    errors?: any[];
    redirectTo?: string;
  }> {
    if (!req.wizard) {
      return { success: false, errors: ['Wizard not initialized'] };
    }

    const { config, session, currentStep } = req.wizard;

    // Validate step data
    const validation = WizardManager.validateStep(config.id, currentStep.id, data);
    if (!validation.success) {
      return { success: false, errors: validation.errors };
    }

    try {
      // Save step data
      session.data[currentStep.id] = data;
      
      // Mark step as completed
      if (!session.completedSteps.includes(currentStep.id)) {
        session.completedSteps.push(currentStep.id);
      }

      // Check if wizard is complete
      const allStepsCompleted = config.steps.every(step => 
        session.completedSteps.includes(step.id) || 
        (step.optional && (!step.skipCondition || step.skipCondition(session.data)))
      );

      if (allStepsCompleted) {
        session.isComplete = true;
        return {
          success: true,
          redirectTo: `/setup/${config.id}/complete`
        };
      }

      // Move to next step
      const nextStep = WizardManager.getNextStep(config.id, currentStep.id, session.data);
      if (nextStep) {
        session.currentStep = nextStep.id;
        return {
          success: true,
          redirectTo: `/setup/${config.id}/${nextStep.id}`
        };
      }

      // No next step but wizard not complete (shouldn't happen)
      return {
        success: true,
        redirectTo: `/setup/${config.id}/review`
      };

    } catch (error: any) {
      return {
        success: false,
        errors: [`Processing error: ${error?.message || 'Unknown error'}`]
      };
    }
  }

  /**
   * Navigate to specific step
   */
  static navigateToStep(req: WizardRequest, stepId: string): boolean {
    if (!req.wizard) return false;

    const { config, session } = req.wizard;
    const step = config.steps.find(s => s.id === stepId);
    if (!step) return false;

    // Check if user can access this step
    if (!WizardManager.canAccessStep(config.id, stepId, session.data)) {
      return false;
    }

    session.currentStep = stepId;
    session.lastActivity = new Date();
    return true;
  }

  /**
   * Reset wizard session
   */
  static resetWizard(req: Request, wizardId: string): void {
    const sessionKey = `wizard_${wizardId}`;
    delete (req.session as any)[sessionKey];
  }

  /**
   * Get wizard completion summary
   */
  static getCompletionSummary(req: WizardRequest): any {
    if (!req.wizard || !req.wizard.session.isComplete) return null;

    const { config, session } = req.wizard;
    
    return {
      wizardId: config.id,
      wizardName: config.name,
      completedAt: new Date(),
      duration: new Date().getTime() - session.startedAt.getTime(),
      stepsCompleted: session.completedSteps.length,
      totalSteps: config.steps.length,
      data: session.data
    };
  }
}

/**
 * Wizard middleware factory
 */
export function wizardMiddleware(wizardId: string) {
  return (req: WizardRequest, res: Response, next: NextFunction) => {
    const initialized = WizardEngine.initializeWizard(req, res, wizardId);
    
    if (!initialized) {
      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        message: 'You do not have permission to access this wizard',
        flash: null
      });
    }

    // Add helper functions to response locals
    res.locals.wizard = req.wizard;
    res.locals.wizardHelpers = {
      isStepCompleted: (stepId: string) => req.wizard!.session.completedSteps.includes(stepId),
      isStepAccessible: (stepId: string) => WizardManager.canAccessStep(wizardId, stepId, req.wizard!.session.data),
      getStepData: (stepId: string) => req.wizard!.session.data[stepId] || {},
      formatProgress: () => `${req.wizard!.progress}%`,
      getStepNumber: (stepId: string) => req.wizard!.config.steps.findIndex(s => s.id === stepId) + 1
    };

    next();
  };
}

/**
 * Step access control middleware
 */
export function requireStepAccess(req: WizardRequest, res: Response, next: NextFunction) {
  if (!req.wizard) {
    return res.redirect('/setup');
  }

  const stepId = req.params.step || req.wizard.currentStep.id;
  
  if (!WizardManager.canAccessStep(req.wizard.config.id, stepId, req.wizard.session.data)) {
    return res.redirect(`/setup/${req.wizard.config.id}/${req.wizard.currentStep.id}`);
  }

  next();
}

export default WizardEngine;