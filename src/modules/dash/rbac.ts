/**
 * DASH Module RBAC Configuration
 * Role-based access control for Dashboard and Analytics
 */

import { requireTrustAdmin, requireSchoolAdmin, requireTeacher } from '../../lib/rbac';

// RBAC middleware for different dashboard types
export const dashTrustAdminRBAC = requireTrustAdmin();
export const dashSchoolAdminRBAC = requireSchoolAdmin();
export const dashTeacherRBAC = requireTeacher();

// Export general dashboard RBAC (allows all authenticated users with appropriate roles)
export const dashRBAC = requireTeacher(); // Most permissive for general dashboard access