import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { controllers as dataControllers, dataRBAC } from './modules/data';
import { controllers as setupControllers, setupRBAC } from './modules/setup';
import { controllers as authControllers } from './modules/auth';
import { controllers as userControllers, userRBAC } from './modules/user';
import { controllers as studControllers, studRBAC } from './modules/stud';
import { controllers as feesControllers, feesRBAC } from './modules/fees';
import { controllers as attdControllers, attdRBAC } from './modules/attd';
import { controllers as reptControllers, reptRBAC } from './modules/rept';
import { controllers as dashControllers, dashTrustAdminRBAC, dashSchoolAdminRBAC, dashTeacherRBAC } from './modules/dash';
import { controllers as commControllers, commMessagingRBAC, commAnnouncementRBAC, commEmergencyRBAC } from './modules/comm';
import type { Request, Response } from 'express';

// Load env (if not already loaded)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const app = express();

// Security & basics
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global request logging
app.use((req, res, next) => {
  console.log(`GLOBAL: ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set true when behind HTTPS
  })
);

// Views (EJS)
app.set('views', path.join(process.cwd(), 'views'));
app.set('view engine', 'ejs');
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// API v1 router
const api = express.Router();

// Debug middleware to log all requests
api.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health
api.get('/health', (_req: Request, res: Response) => res.json({ ok: true, ts: new Date().toISOString() }));

// Phase 0 – DATA module routes (Industry Standard REST + RBAC)
api.get('/system/connections/status', dataRBAC, dataControllers.handle_data_00_001);
api.post('/system/schemas/master', dataRBAC, dataControllers.handle_data_00_002);
api.post('/system/schemas/trusts', dataRBAC, dataControllers.handle_data_00_003);
api.post('/system/config', dataRBAC, dataControllers.handle_data_00_004);
api.post('/system/trusts', dataRBAC, dataControllers.handle_data_00_005);
api.post('/system/users', dataRBAC, dataControllers.handle_data_00_006);
api.post('/system/migrations', dataRBAC, dataControllers.handle_data_00_007);
api.post('/system/sessions', dataRBAC, dataControllers.handle_data_00_008);
api.post('/system/audit-logs/system', dataRBAC, dataControllers.handle_data_00_009);
api.post('/system/audit-logs/tenants', dataRBAC, dataControllers.handle_data_00_010);
api.put('/system/config/cache', dataRBAC, dataControllers.handle_data_00_011);
api.post('/system/connections/cleanup', dataRBAC, dataControllers.handle_data_00_012);

// Phase 1 – SETUP module routes
api.post('/setup/trusts', setupRBAC, setupControllers.handle_setup_01_001);
api.post('/setup/schools', setupRBAC, setupControllers.handle_setup_01_002);
api.post('/setup/academic-years', setupRBAC, setupControllers.handle_setup_01_003);
api.post('/setup/classes', setupRBAC, setupControllers.handle_setup_01_004);
api.post('/setup/academics', setupRBAC, setupControllers.handle_setup_01_005);
api.post('/setup/config', setupRBAC, setupControllers.handle_setup_01_006);
api.post('/setup/roles', setupRBAC, setupControllers.handle_setup_01_007);

// Phase 3 – USER module routes 
console.log('Registering USER routes...');
api.post('/users', userRBAC, userControllers.handle_user_03_001);                    // USER-03-001: User creation & management
api.post('/users/assignments', userRBAC, userControllers.handle_user_03_002);       // USER-03-002: User-school assignments
api.post('/users/roles', userRBAC, userControllers.handle_user_03_003);             // USER-03-003: Role & permission assignment
api.post('/users/teachers/assignments', userRBAC, userControllers.handle_user_03_004);  // USER-03-004: Teacher subject/class allocation
api.put('/users/profiles', userRBAC, userControllers.handle_user_03_005);           // USER-03-005: Staff profile management
api.post('/users/parents/links', userRBAC, userControllers.handle_user_03_006);     // USER-03-006: Parent-student linking
console.log('USER routes registered successfully');

// Phase 4 – STUD module routes
console.log('Registering STUD routes...');
api.post('/students/admissions', studRBAC, studControllers.handle_stud_04_001);     // STUD-04-001: Student admission
api.put('/students/admissions/:id', studRBAC, studControllers.handle_stud_04_002);  // STUD-04-002: Admission approval workflow
api.post('/students/promotions', studRBAC, studControllers.handle_stud_04_003);     // STUD-04-003: Readmission/promotion
api.post('/students/transfers', studRBAC, studControllers.handle_stud_04_004);      // STUD-04-004: Inter-school transfer
api.put('/students/:id/roll', studRBAC, studControllers.handle_stud_04_005);        // STUD-04-005: Student ID & roll allocation
api.put('/students/:id/details', studRBAC, studControllers.handle_stud_04_006);     // STUD-04-006: Siblings & category allocation
api.post('/students/documents', studRBAC, studControllers.handle_stud_04_007);      // STUD-04-007: Student documents & certificates
api.post('/students/analytics', studRBAC, studControllers.handle_stud_04_008);      // STUD-04-008: Student analytics
console.log('STUD routes registered successfully');

// Phase 5 – FEES module routes
console.log('Registering FEES routes...');
api.post('/fees/structures', feesRBAC, feesControllers.handle_fees_05_001);        // FEES-05-001: Fee heads & structures
api.post('/fees/assignments', feesRBAC, feesControllers.handle_fees_05_002);       // FEES-05-002: Class & student fee mapping
api.post('/fees/discounts', feesRBAC, feesControllers.handle_fees_05_003);         // FEES-05-003: Discount allocation
api.post('/fees/services', feesRBAC, feesControllers.handle_fees_05_004);          // FEES-05-004: Transport/optional services
api.post('/fees/late-rules', feesRBAC, feesControllers.handle_fees_05_005);        // FEES-05-005: Late fee rules
api.post('/fees/collections', feesRBAC, feesControllers.handle_fees_05_006);       // FEES-05-006: Fee collection & receipts
api.post('/fees/gateways', feesRBAC, feesControllers.handle_fees_05_007);          // FEES-05-007: Payment gateway integration
api.post('/fees/refunds', feesRBAC, feesControllers.handle_fees_05_008);           // FEES-05-008: Refunds & adjustments
api.post('/fees/reports', feesRBAC, feesControllers.handle_fees_05_009);           // FEES-05-009: Reports, reconciliation & defaulters
api.post('/fees/forecasting', feesRBAC, feesControllers.handle_fees_05_010);       // FEES-05-010: Fee forecasting
console.log('FEES routes registered successfully');

// Phase 6 – ATTD module routes
console.log('Registering ATTD routes...');
api.post('/attendance/daily', attdRBAC, attdControllers.handle_attd_06_001);         // ATTD-06-001: Daily attendance & bulk import
api.post('/attendance/leave', attdRBAC, attdControllers.handle_attd_06_002);          // ATTD-06-002: Leave/absence workflows
api.post('/attendance/reports', attdRBAC, attdControllers.handle_attd_06_003);        // ATTD-06-003: Attendance reporting/analytics
api.post('/attendance/profiles', attdRBAC, attdControllers.handle_attd_06_004);       // ATTD-06-004: Student attendance profiles
console.log('ATTD routes registered successfully');

// Phase 7 – REPT module routes
console.log('Registering REPT routes...');
api.post('/reports/students', reptRBAC, reptControllers.handle_rept_07_001);          // REPT-07-001: Student profile reports
api.post('/reports/fees', reptRBAC, reptControllers.handle_rept_07_002);              // REPT-07-002: Fee collection reports
api.post('/reports/attendance', reptRBAC, reptControllers.handle_rept_07_003);        // REPT-07-003: Attendance summary reports
api.post('/reports/academic', reptRBAC, reptControllers.handle_rept_07_004);          // REPT-07-004: Academic performance reports
api.post('/reports/custom', reptRBAC, reptControllers.handle_rept_07_005);            // REPT-07-005: Custom report builder
api.post('/reports/export', reptRBAC, reptControllers.handle_rept_07_006);            // REPT-07-006: Export to PDF/Excel
console.log('REPT routes registered successfully');

// Phase 8 – DASH module routes
console.log('Registering DASH routes...');
api.get('/dashboards/trust', dashTrustAdminRBAC, dashControllers.handle_dash_08_001);       // DASH-08-001: Trust admin dashboard
api.get('/dashboards/school', dashSchoolAdminRBAC, dashControllers.handle_dash_08_002);     // DASH-08-002: School admin dashboard  
api.get('/dashboards/teacher', dashTeacherRBAC, dashControllers.handle_dash_08_003);        // DASH-08-003: Teacher dashboard
console.log('DASH routes registered successfully');

// Phase 9 – COMM module routes
console.log('Registering COMM routes...');
api.post('/communications/messages', commMessagingRBAC, commControllers.handle_comm_09_001);      // COMM-09-001: Notifications (SMS/Email/WhatsApp)
api.post('/communications/announcements', commAnnouncementRBAC, commControllers.handle_comm_09_002);  // COMM-09-002: In-app announcements
api.post('/communications/alerts', commEmergencyRBAC, commControllers.handle_comm_09_003);        // COMM-09-003: Emergency alerts (broadcast)
console.log('COMM routes registered successfully');

// Phase 2 – AUTH module routes (Public endpoints with rate limiting)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
});

api.post('/auth/sessions', authLimiter, authControllers.handle_auth_02_001);  // Session login
api.post('/auth/tokens', authLimiter, authControllers.handle_auth_02_002);    // JWT login

app.use('/api/v1', api);

// Root
app.get('/', (_req: Request, res: Response) => {
  res.send('School ERP API running. See /api/v1/health');
});
