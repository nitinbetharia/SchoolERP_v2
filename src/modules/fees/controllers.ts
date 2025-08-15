/**
 * FEES Module Controllers
 * HTTP request handlers for Fee Management with proper validation and RBAC
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './services';
import {
  Fees05001Request,
  Fees05002Request,
  Fees05003Request,
  Fees05004Request,
  Fees05005Request,
  Fees05006Request,
  Fees05007Request,
  Fees05008Request,
  Fees05009Request,
  Fees05010Request,
} from './dtos';

// RBAC middleware for FEES module (simplified for now)
export function feesRBAC(req: Request, res: Response, next: any) {
  // TODO: Implement proper RBAC when auth system is complete
  next();
}

// FEES-05-001: Fee heads & structures
export async function handle_fees_05_001(req: Request, res: Response) {
  try {
    const validatedInput = Fees05001Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context
    const result = await svc.fees_05_001Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to create fee structure',
      },
    });
  }
}

// FEES-05-002: Class & student fee mapping
export async function handle_fees_05_002(req: Request, res: Response) {
  try {
    const validatedInput = Fees05002Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context
    const result = await svc.fees_05_002Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to assign fee to student',
      },
    });
  }
}

// FEES-05-003: Discount allocation
export async function handle_fees_05_003(req: Request, res: Response) {
  try {
    const validatedInput = Fees05003Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context
    const result = await svc.fees_05_003Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to allocate discount',
      },
    });
  }
}

// FEES-05-004: Transport/optional services
export async function handle_fees_05_004(req: Request, res: Response) {
  try {
    const validatedInput = Fees05004Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context
    const result = await svc.fees_05_004Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to assign service',
      },
    });
  }
}

// FEES-05-005: Late fee rules (config/override)
export async function handle_fees_05_005(req: Request, res: Response) {
  try {
    const validatedInput = Fees05005Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context

    const result = await svc.fees_05_005Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to configure late fee rules',
      },
    });
  }
}

// FEES-05-006: Fee collection & receipts
export async function handle_fees_05_006(req: Request, res: Response) {
  try {
    const validatedInput = Fees05006Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context

    const result = await svc.fees_05_006Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to collect fee',
      },
    });
  }
}

// FEES-05-007: Payment gateway integration
export async function handle_fees_05_007(req: Request, res: Response) {
  try {
    const validatedInput = Fees05007Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context

    const result = await svc.fees_05_007Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to initiate payment gateway transaction',
      },
    });
  }
}

// FEES-05-008: Refunds & adjustments
export async function handle_fees_05_008(req: Request, res: Response) {
  try {
    const validatedInput = Fees05008Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context

    const result = await svc.fees_05_008Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to process refund',
      },
    });
  }
}

// FEES-05-009: Reports, reconciliation & defaulters
export async function handle_fees_05_009(req: Request, res: Response) {
  try {
    const validatedInput = Fees05009Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context

    const result = await svc.fees_05_009Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to generate report',
      },
    });
  }
}

// FEES-05-010: Fee forecasting
export async function handle_fees_05_010(req: Request, res: Response) {
  try {
    const validatedInput = Fees05010Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context

    const result = await svc.fees_05_010Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to generate forecasting report',
      },
    });
  }
}
