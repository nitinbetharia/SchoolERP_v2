/**
 * Error Envelope Middleware - Convert API errors to flash messages
 * Provides DRY error handling for frontend
 */

import { Request, Response, NextFunction } from 'express';

export interface ErrorEnvelope {
  code: string;
  message: string;
  details?: any[];
  traceId?: string;
}

export interface FlashMessage {
  error?: ErrorEnvelope;
  success?: string | { message: string };
  warning?: string | { message: string };
  info?: string | { message: string };
}

/**
 * Convert various error formats to flash message format
 */
export function asFlash(error: any): FlashMessage {
  // Already in flash format
  if (error && typeof error === 'object' && (error.error || error.success || error.warning || error.info)) {
    return error;
  }

  // API response error format
  if (error?.response?.data?.error) {
    return { error: error.response.data.error };
  }

  // Axios error with response
  if (error?.response?.data) {
    const data = error.response.data;
    if (data.success === false && data.error) {
      return { error: data.error };
    }
  }

  // HTTP status code errors
  if (error?.response?.status) {
    const status = error.response.status;
    let message = 'An error occurred';
    let code = 'HTTP_ERROR';

    switch (status) {
      case 400:
        message = 'Invalid request data';
        code = 'BAD_REQUEST';
        break;
      case 401:
        message = 'Authentication required';
        code = 'UNAUTHORIZED';
        break;
      case 403:
        message = 'Access denied';
        code = 'FORBIDDEN';
        break;
      case 404:
        message = 'Resource not found';
        code = 'NOT_FOUND';
        break;
      case 429:
        message = 'Too many requests. Please wait and try again.';
        code = 'RATE_LIMIT';
        break;
      case 500:
        message = 'Internal server error';
        code = 'INTERNAL_ERROR';
        break;
      default:
        message = `Server error (${status})`;
        code = `HTTP_${status}`;
    }

    return {
      error: {
        code,
        message,
        details: error.response.data?.details || [],
        traceId: error.response.headers['x-trace-id']
      }
    };
  }

  // Validation errors (Zod)
  if (error?.issues && Array.isArray(error.issues)) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please fix the highlighted fields',
        details: error.issues.map((issue: any) => ({
          path: issue.path?.join('.') || 'unknown',
          message: issue.message
        }))
      }
    };
  }

  // Generic error with message
  if (error?.message) {
    return {
      error: {
        code: error.code || 'GENERIC_ERROR',
        message: error.message,
        details: error.details ? [error.details] : []
      }
    };
  }

  // String error
  if (typeof error === 'string') {
    return {
      error: {
        code: 'GENERIC_ERROR',
        message: error
      }
    };
  }

  // Fallback
  return {
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: []
    }
  };
}

/**
 * Create success flash message
 */
export function successFlash(message: string): FlashMessage {
  return { success: message };
}

/**
 * Create warning flash message
 */
export function warningFlash(message: string): FlashMessage {
  return { warning: message };
}

/**
 * Create info flash message
 */
export function infoFlash(message: string): FlashMessage {
  return { info: message };
}

/**
 * Flash message middleware - sets up flash messaging
 */
export function flashMiddleware(req: Request, res: Response, next: NextFunction) {
  // Initialize session flash if not exists
  if (!req.session.flash) {
    req.session.flash = {};
  }

  // Helper to set flash message
  res.locals.setFlash = function(flash: FlashMessage) {
    Object.assign(req.session.flash, flash);
  };

  // Helper to get and clear flash messages
  res.locals.getFlash = function(): FlashMessage | null {
    const flash = req.session.flash;
    req.session.flash = {}; // Clear after retrieving
    return Object.keys(flash).length > 0 ? flash : null;
  };

  // Make flash available in templates
  res.locals.flash = res.locals.getFlash();

  next();
}

/**
 * Error handling middleware for frontend routes
 */
export function frontendErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Frontend error:', err);

  const flash = asFlash(err);
  
  // If it's an API call (AJAX), return JSON
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(err.status || 500).json({
      success: false,
      error: flash.error
    });
  }

  // For regular page requests, render error page or redirect with flash
  const status = err.status || 500;

  if (status === 404) {
    return res.status(404).render('errors/404', {
      title: 'Page Not Found',
      message: 'The requested page could not be found',
      flash,
      hideNavigation: false
    });
  }

  if (status === 403) {
    return res.status(403).render('errors/403', {
      title: 'Access Denied',
      message: 'You do not have permission to access this resource',
      flash,
      hideNavigation: false
    });
  }

  if (status === 500) {
    return res.status(500).render('errors/500', {
      title: 'Server Error',
      message: 'An internal server error occurred',
      flash,
      hideNavigation: false
    });
  }

  // For other errors, redirect to previous page with flash message
  if (req.get('Referer')) {
    req.session.flash = flash;
    return res.redirect(req.get('Referer')!);
  }

  // Fallback to home page
  req.session.flash = flash;
  res.redirect('/');
}

/**
 * Rate limit error handler
 */
export function rateLimitHandler(req: Request, res: Response) {
  const flash = asFlash({
    response: {
      status: 429,
      headers: { 'retry-after': res.get('Retry-After') || '60' }
    }
  });

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(429).json({
      success: false,
      error: flash.error
    });
  }

  req.session.flash = flash;
  const referer = req.get('Referer');
  res.redirect(referer || '/');
}

export default {
  asFlash,
  successFlash,
  warningFlash,
  infoFlash,
  flashMiddleware,
  frontendErrorHandler,
  rateLimitHandler
};