/**
 * DASH Module Barrel Exports
 * Dashboard and Analytics module with 3 activities
 */

export * as controllers from './controllers';
export * as services from './services';
export * as repos from './repos';
export * from './dtos';
export { dashRBAC, dashTrustAdminRBAC, dashSchoolAdminRBAC, dashTeacherRBAC } from './rbac';