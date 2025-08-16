/**
 * Session Type Extensions
 * Extends Express session to include application-specific data
 */

import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      permissions: string[];
      school_id?: number;
      trustId: number;
    };
    trustId?: number;
    sessionToken?: string;
    returnTo?: string;
    flash?: any;
    fieldErrors?: Record<string, string>;
    loginFormData?: {
      email: string;
      remember_me: boolean;
    };
    otpPhone?: string;
    wizards?: Record<string, {
      completedSteps: string[];
      currentData: Record<string, any>;
      startedAt: string;
      lastActivity: string;
    }>;
  }
}