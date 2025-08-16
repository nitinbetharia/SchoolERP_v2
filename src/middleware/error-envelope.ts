/**
 * Error Handling Middleware for Frontend Routes
 * Provides flash message support and consistent error handling
 */

import { Request, Response, NextFunction } from 'express';

export interface FlashMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  details?: any;
}

// Extend Express Session to include flash
declare module 'express-session' {
  interface SessionData {
    flash?: FlashMessage;
    fieldErrors?: Record<string, string>;
  }
}

/**
 * Flash message middleware
 */
export const flashMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.locals.flash = (req.session as any)?.flash || null;
  
  // Clear flash message after use
  if ((req.session as any)?.flash) {
    delete (req.session as any).flash;
  }
  
  next();
};

/**
 * Convert error to flash message format
 */
export function asFlash(error: any): FlashMessage {
  if (error?.response?.data?.error) {
    // API error response
    const apiError = error.response.data.error;
    return {
      type: 'error',
      title: 'Error',
      message: apiError.message || 'An error occurred',
      details: apiError.details
    };
  }
  
  if (error?.response?.status === 429) {
    // Rate limiting error
    const retryAfter = error.response.headers?.['retry-after'] || '60';
    return {
      type: 'error',
      title: 'Too Many Requests',
      message: `Please wait ${retryAfter} seconds before trying again`,
      details: { retryAfter }
    };
  }
  
  if (error?.issues) {
    // Zod validation error
    return {
      type: 'error',
      title: 'Validation Error',
      message: 'Please check the form and correct any errors',
      details: error.issues
    };
  }
  
  if (error?.message) {
    return {
      type: 'error',
      title: 'Error',
      message: error.message,
      details: null
    };
  }
  
  return {
    type: 'error',
    title: 'Error',
    message: 'An unexpected error occurred',
    details: null
  };
}

/**
 * Create success flash message
 */
export function successFlash(message: string, title?: string): FlashMessage {
  return {
    type: 'success',
    title: title || 'Success',
    message,
    details: null
  };
}

/**
 * Create warning flash message
 */
export function warningFlash(message: string, title?: string): FlashMessage {
  return {
    type: 'warning',
    title: title || 'Warning',
    message,
    details: null
  };
}

/**
 * Create info flash message
 */
export function infoFlash(message: string, title?: string): FlashMessage {
  return {
    type: 'info',
    title: title || 'Information',
    message,
    details: null
  };
}

/**
 * Frontend error handler middleware
 */
export const frontendErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Frontend error:', error);
  
  // Set flash message
  (req.session as any).flash = asFlash(error);
  
  // Handle different error types
  if (error.status === 404) {
    return res.status(404).render('errors/404', {
      title: 'Page Not Found',
      message: 'The requested page could not be found',
      hideNavigation: false
    });
  }
  
  if (error.status === 403) {
    return res.status(403).render('errors/403', {
      title: 'Access Denied',
      message: 'You do not have permission to access this resource',
      hideNavigation: false
    });
  }
  
  if (error.status === 401) {
    // Redirect to login for authentication errors
    (req.session as any).returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  
  // Generic error page
  res.status(500).render('errors/500', {
    title: 'Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An internal server error occurred' 
      : error.message,
    hideNavigation: false
  });
};