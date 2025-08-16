/**
 * Trust Context Middleware - Multi-tenant support
 * Extracts trust context from subdomain and loads tenant-specific settings
 */

import { Request, Response, NextFunction } from 'express';
import { dbManager } from '../lib/database';
import type { RowDataPacket } from 'mysql2';

export interface TrustContext {
  trustId: number;
  slug: string;
  name: string;
  logo?: string;
  theme: string;
  theme_css?: string;
  settings: Record<string, any>;
  storage_config: {
    type: 'local' | 's3' | 'azure';
    basePath: string;
    maxFileSize: string;
    allowedTypes: string[];
  };
}

export interface TrustRequest extends Request {
  trustContext?: TrustContext;
}

/**
 * Extract trust context from subdomain
 */
export async function trustContextMiddleware(req: TrustRequest, res: Response, next: NextFunction) {
  try {
    // Extract trust slug from subdomain
    // Format: mytrust.schoolerp.com -> mytrust
    const host = req.hostname;
    const parts = host.split('.');
    let trustSlug: string;

    if (parts.length >= 3) {
      // Subdomain format
      trustSlug = parts[0];
    } else if (process.env.NODE_ENV === 'development') {
      // Development fallback
      trustSlug = req.headers['x-trust-slug'] as string || 'dev-trust';
    } else {
      return res.status(400).render('errors/400', {
        title: 'Invalid Domain',
        message: 'Please access the system through your organization\'s subdomain',
        hideNavigation: true,
        flash: null
      });
    }

    // Get trust details from database
    const trustContext = await getTrustContext(trustSlug);
    
    if (!trustContext) {
      return res.status(404).render('errors/404', {
        title: 'Organization Not Found',
        message: `Organization '${trustSlug}' not found. Please check the URL or contact your administrator.`,
        hideNavigation: true,
        flash: null
      });
    }

    // Attach trust context to request and response locals
    req.trustContext = trustContext;
    res.locals.trust = trustContext;
    res.locals.ctx = { trust: trustSlug, trustId: trustContext.trustId };

    // Set tenant theme in HTML data attribute
    res.locals.tenantTheme = trustContext.theme;

    next();
  } catch (error) {
    console.error('Trust context middleware error:', error);
    next(error);
  }
}

/**
 * Fetch trust context from database with caching
 */
const trustCache = new Map<string, { context: TrustContext; expiry: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

async function getTrustContext(trustSlug: string): Promise<TrustContext | null> {
  // Check cache first
  const cached = trustCache.get(trustSlug);
  if (cached && cached.expiry > Date.now()) {
    return cached.context;
  }

  try {
    const masterConnection = await dbManager.getMasterConnection();

    // Get trust basic info
    const [trustRows] = await masterConnection.execute<RowDataPacket[]>(
      'SELECT id, trust_name, trust_code, subdomain, is_active FROM trusts WHERE subdomain = ? AND is_active = 1',
      [trustSlug]
    );

    if (trustRows.length === 0) {
      return null;
    }

    const trust = trustRows[0];

    // Get trust configuration
    const [configRows] = await masterConnection.execute<RowDataPacket[]>(
      'SELECT config_key, config_value FROM system_config WHERE trust_id = ?',
      [trust.id]
    );

    const settings: Record<string, any> = {};
    let theme = 'default';
    let theme_css = '';
    let logo = '';

    configRows.forEach((row: any) => {
      const key = row.config_key;
      let value;
      try {
        value = JSON.parse(row.config_value);
      } catch {
        value = row.config_value;
      }

      settings[key] = value;

      // Extract specific UI-relevant settings
      if (key === 'theme') theme = value;
      if (key === 'theme_css') theme_css = value;
      if (key === 'logo') logo = value;
    });

    // Build storage configuration
    const storage_config = {
      type: settings.storage_type || 'local',
      basePath: settings.storage_path || `/uploads/${trustSlug}`,
      maxFileSize: settings.max_file_size || '10MB',
      allowedTypes: settings.allowed_file_types || ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xlsx']
    };

    const context: TrustContext = {
      trustId: trust.id,
      slug: trustSlug,
      name: trust.trust_name,
      logo,
      theme,
      theme_css,
      settings,
      storage_config
    };

    // Cache the result
    trustCache.set(trustSlug, {
      context,
      expiry: Date.now() + CACHE_TTL
    });

    return context;

  } catch (error) {
    console.error(`Error fetching trust context for '${trustSlug}':`, error);
    return null;
  }
}

/**
 * Clear trust context cache (useful for updates)
 */
export function clearTrustCache(trustSlug?: string) {
  if (trustSlug) {
    trustCache.delete(trustSlug);
  } else {
    trustCache.clear();
  }
}

/**
 * Require trust context middleware
 */
export function requireTrustContext(req: TrustRequest, res: Response, next: NextFunction) {
  if (!req.trustContext) {
    return res.status(400).render('errors/400', {
      title: 'Invalid Request',
      message: 'Trust context is required',
      hideNavigation: true,
      flash: null
    });
  }
  next();
}

export default trustContextMiddleware;