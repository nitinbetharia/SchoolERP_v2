/**
 * Session Helper Utilities
 * Provides type-safe access to session properties
 */

import { Request } from 'express';

export interface ExtendedSession {
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

/**
 * Type-safe session access
 */
export function getSession(req: Request): ExtendedSession {
  return (req.session as any) || {};
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(req: Request): boolean {
  const session = getSession(req);
  return !!session.user;
}

/**
 * Get logged in user
 */
export function getUser(req: Request) {
  const session = getSession(req);
  return session.user;
}

/**
 * Set user in session
 */
export function setUser(req: Request, user: ExtendedSession['user']): void {
  const session = getSession(req);
  session.user = user;
  Object.assign(req.session as any, session);
}

/**
 * Clear user session
 */
export function clearSession(req: Request): void {
  if (req.session) {
    req.session.destroy(() => {});
  }
}