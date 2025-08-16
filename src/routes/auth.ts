/**
 * AUTH Routes - Session and JWT authentication
 * Fully responsive UI implementation following activity-driven pattern
 */

import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { trustContextMiddleware, requireTrustContext } from '../middleware/trust-context';
import { flashMiddleware, asFlash, successFlash, frontendErrorHandler } from '../middleware/error-envelope';
import { api } from '../ui/adapters/api-client';

export const authRouter = Router();

// Apply middleware
authRouter.use(trustContextMiddleware);
authRouter.use(flashMiddleware);

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many login attempts. Please wait 15 minutes and try again.',
      retryAfter: 900
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET', // Only limit POST requests
});

const otpRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many OTP requests. Please wait 5 minutes and try again.',
      retryAfter: 300
    }
  },
});

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  remember_me: z.boolean().optional()
}).strict();

const OTPRequestSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number')
}).strict();

const OTPVerifySchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().regex(/^\d{6}$/, 'Please enter a valid 6-digit OTP')
}).strict();

const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
}).strict();

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Invalid reset token'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirm_password: z.string().min(6, 'Please confirm your password')
}).strict().refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password']
});

/**
 * AUTH-02-001: Session Login - GET
 * Display login form
 */
authRouter.get('/login', requireTrustContext, async (req, res) => {
  try {
    // Redirect if already authenticated
    if ((req.session as any)?.user) {
      return res.redirect('/dashboard');
    }

    // Prepare page data
    const pageData = {
      title: 'Sign In',
      description: `Sign in to ${res.locals.trust?.name || 'School ERP'} system`,
      currentUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      hideNavigation: true,
      hideFooter: true,
      formData: (req.session as any)?.loginFormData || {},
      fieldErrors: (req.session as any)?.fieldErrors || {}
    };

    // Clear session form data after use
    delete (req.session as any)?.loginFormData;
    delete (req.session as any)?.fieldErrors;

    res.render('auth/AUTH-02-001', pageData);
  } catch (error) {
    console.error('Login page error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      message: 'Unable to load login page',
      hideNavigation: true,
      flash: asFlash(error)
    });
  }
});

/**
 * AUTH-02-001: Session Login - POST
 * Process login form submission
 */
authRouter.post('/login', requireTrustContext, authRateLimit, async (req, res) => {
  try {
    // Validate input
    const validation = LoginSchema.safeParse(req.body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        if (issue.path.length > 0) {
          fieldErrors[String(issue.path[0])] = issue.message;
        }
      });

      (req.session as any).loginFormData = {
        email: req.body.email || '',
        remember_me: req.body.remember_me || false
      };
      (req.session as any).fieldErrors = fieldErrors;
      (req.session as any).flash = asFlash({ issues: validation.error.issues });

      return res.redirect('/auth/login');
    }

    const { email, password, remember_me } = validation.data;

    // Call backend API
    const loginResponse = await api.post('/api/v1/auth/session/login', {
      email,
      password,
      remember_me: remember_me || false
    }, {
      headers: {
        'X-Trust-Context': res.locals.trust?.slug || 'default'
      }
    });

    if (loginResponse.data.success) {
      const userData = loginResponse.data.data;

      // Set session data
      (req.session as any).user = {
        id: userData.user_id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        permissions: userData.permissions || [],
        school_id: userData.school_id,
        trustId: res.locals.trust?.trustId || 1
      };

      (req.session as any).trustId = res.locals.trust?.trustId || 1;
      (req.session as any).sessionToken = userData.session_token;

      // Set session timeout based on remember_me
      if (remember_me) {
        (req.session as any).cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        (req.session as any).cookie.maxAge = 8 * 60 * 60 * 1000; // 8 hours
      }

      // Clear any previous login errors
      delete (req.session as any).loginFormData;
      delete (req.session as any).fieldErrors;

      // Set success flash message
      (req.session as any).flash = successFlash(`Welcome back, ${userData.first_name}!`);

      // Redirect to intended page or dashboard
      const redirectTo = (req.session as any).returnTo || '/dashboard';
      delete (req.session as any).returnTo;
      
      return res.redirect(redirectTo);
    } else {
      // Backend returned error
      throw new Error(loginResponse.data.error?.message || 'Login failed');
    }

  } catch (error: any) {
    console.error('Login error:', error);

    // Preserve form data
    (req.session as any).loginFormData = {
      email: req.body.email || '',
      remember_me: req.body.remember_me || false
    };

    // Handle specific error types
    if (error?.response?.status === 401) {
      (req.session as any).flash = asFlash({
        response: {
          data: {
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password. Please try again.',
            }
          }
        }
      });
    } else if (error?.response?.status === 429) {
      (req.session as any).flash = asFlash({
        response: {
          status: 429,
          headers: { 'retry-after': '900' }
        }
      });
    } else {
      (req.session as any).flash = asFlash(error);
    }

    res.redirect('/auth/login');
  }
});

/**
 * OTP Login Request - POST
 */
authRouter.post('/otp/request', requireTrustContext, otpRateLimit, async (req, res) => {
  try {
    const validation = OTPRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid phone number',
          details: validation.error.issues
        }
      });
    }

    const { phone } = validation.data;

    // Call backend API to send OTP
    const otpResponse = await api.post('/api/v1/auth/otp/request', {
      phone
    }, {
      headers: {
        'X-Trust-Context': res.locals.trust?.slug || 'default'
      }
    });

    if (otpResponse.data.success) {
      // Store phone in session for verification
      (req.session as any).otpPhone = phone;
      
      res.json({
        success: true,
        data: {
          message: 'OTP sent successfully',
          phone: phone.replace(/(\d{5})(\d{5})/, '$1*****')
        }
      });
    } else {
      throw new Error(otpResponse.data.error?.message || 'Failed to send OTP');
    }

  } catch (error: any) {
    console.error('OTP request error:', error);
    res.status(error?.response?.status || 500).json({
      success: false,
      error: (asFlash(error) as any).error || { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' }
    });
  }
});

/**
 * OTP Login Verify - POST
 */
authRouter.post('/otp/verify', requireTrustContext, authRateLimit, async (req, res) => {
  try {
    const validation = OTPVerifySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid OTP format',
          details: validation.error.issues
        }
      });
    }

    const { phone, otp } = validation.data;

    // Verify phone matches session
    if ((req.session as any).otpPhone !== phone) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: 'Phone number does not match session'
        }
      });
    }

    // Call backend API to verify OTP
    const verifyResponse = await api.post('/api/v1/auth/otp/verify', {
      phone,
      otp
    }, {
      headers: {
        'X-Trust-Context': res.locals.trust?.slug || 'default'
      }
    });

    if (verifyResponse.data.success) {
      const userData = verifyResponse.data.data;

      // Set session data
      (req.session as any).user = {
        id: userData.user_id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        permissions: userData.permissions || [],
        school_id: userData.school_id,
        trustId: res.locals.trust?.trustId || 1
      };

      (req.session as any).trustId = res.locals.trust?.trustId || 1;
      (req.session as any).sessionToken = userData.session_token;

      // Clean up OTP session data
      delete (req.session as any).otpPhone;

      res.json({
        success: true,
        data: {
          message: 'Login successful',
          redirect: (req.session as any).returnTo || '/dashboard'
        }
      });
    } else {
      throw new Error(verifyResponse.data.error?.message || 'OTP verification failed');
    }

  } catch (error: any) {
    console.error('OTP verify error:', error);
    res.status(error?.response?.status || 500).json({
      success: false,
      error: (asFlash(error) as any).error || { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' }
    });
  }
});

/**
 * Logout - POST
 */
authRouter.post('/logout', async (req, res) => {
  try {
    // Call backend to invalidate session if token exists
    if ((req.session as any)?.sessionToken) {
      try {
        await api.post('/api/v1/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${(req.session as any).sessionToken}`,
            'X-Trust-Context': res.locals.trust?.slug
          }
        });
      } catch (error) {
        // Log but don't fail logout on backend error
        console.warn('Backend logout error:', error);
      }
    }

    // Destroy session
    (req.session as any).destroy((err: any) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });

    // Clear session cookie
    res.clearCookie('connect.sid');

    // Redirect to login with success message
    res.redirect('/auth/login?message=logged_out');

  } catch (error) {
    console.error('Logout error:', error);
    res.redirect('/auth/login');
  }
});

/**
 * Forgot Password - GET
 */
authRouter.get('/forgot-password', requireTrustContext, (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password',
    hideNavigation: true,
    hideFooter: true
  });
});

/**
 * Forgot Password - POST
 */
authRouter.post('/forgot-password', requireTrustContext, otpRateLimit, async (req, res) => {
  try {
    const validation = ForgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      (req.session as any).flash = asFlash({ issues: validation.error.issues });
      return res.redirect('/auth/forgot-password');
    }

    const { email } = validation.data;

    // Call backend API
    await api.post('/api/v1/auth/password/forgot', {
      email
    }, {
      headers: {
        'X-Trust-Context': res.locals.trust?.slug || 'default'
      }
    });

    // Always show success message for security
    (req.session as any).flash = successFlash(
      'If an account with that email exists, we have sent password reset instructions.'
    );
    
    res.redirect('/auth/forgot-password');

  } catch (error) {
    console.error('Forgot password error:', error);
    (req.session as any).flash = successFlash(
      'If an account with that email exists, we have sent password reset instructions.'
    );
    res.redirect('/auth/forgot-password');
  }
});

// Error handler
authRouter.use(frontendErrorHandler);

export default authRouter;