/**
 * COMM Module Barrel Exports
 * Communication and Messaging module exports
 */

export * as controllers from './controllers';
export * as services from './services';
export * as repos from './repos';
export * from './dtos';
export { 
  commMessagingRBAC, 
  commAnnouncementRBAC, 
  commEmergencyRBAC 
} from './rbac';