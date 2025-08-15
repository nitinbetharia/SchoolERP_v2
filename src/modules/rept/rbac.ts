/**
 * REPT Module RBAC Configuration
 * Role-based access control for Reporting and Analytics
 */

import { requireAccountant } from '../../lib/rbac';

// RBAC middleware for REPT module - reporting access for admins and accountants
export const reptRBAC = requireAccountant();