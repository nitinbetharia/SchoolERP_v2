/**
 * DASH Module Services
 * Business logic layer for Dashboard and Analytics
 */

import type {
  Dash08001RequestT,
  Dash08001ResponseT,
  Dash08002RequestT,
  Dash08002ResponseT,
  Dash08003RequestT,
  Dash08003ResponseT,
} from './dtos';
import * as repo from './repos';

// DASH-08-001: Trust admin dashboard
export async function dash_08_001Service(input: Dash08001RequestT, trustId: number): Promise<Dash08001ResponseT> {
  const { time_range, date_from, date_to, school_ids, include_trends, include_financial, include_analytics } = input;

  // Calculate date range based on time_range
  let startDate: string;
  let endDate: string;
  
  if (time_range === 'CUSTOM' && date_from && date_to) {
    startDate = date_from;
    endDate = date_to;
  } else {
    const dateRange = calculateDateRange(time_range);
    startDate = dateRange.start;
    endDate = dateRange.end;
  }

  // Business validation
  const fromDate = new Date(startDate);
  const toDate = new Date(endDate);
  
  if (toDate < fromDate) {
    throw new Error('End date cannot be before start date');
  }

  // Get trust-level summary data
  const summaryData = await repo.getTrustSummary(trustId, startDate, endDate, school_ids) as any;
  
  // Get schools overview
  const schoolsData = await repo.getSchoolsOverview(trustId, startDate, endDate, school_ids);

  // Get financial summary if requested
  let financialSummary;
  if (include_financial) {
    financialSummary = await repo.getFinancialSummary(trustId, startDate, endDate, school_ids) as any;
  }

  // Get attendance analytics if requested
  let attendanceAnalytics;
  if (include_analytics) {
    attendanceAnalytics = await repo.getAttendanceAnalytics(trustId, startDate, endDate, school_ids);
  }

  return {
    dashboard_type: 'TRUST_ADMIN',
    time_period: { from: startDate, to: endDate },
    summary: summaryData,
    schools_overview: schoolsData,
    financial_summary: financialSummary,
    attendance_analytics: attendanceAnalytics,
    generated_at: new Date().toISOString(),
  };
}

// DASH-08-002: School admin dashboard
export async function dash_08_002Service(input: Dash08002RequestT, trustId: number, schoolId: number): Promise<Dash08002ResponseT> {
  const { time_range, date_from, date_to, class_ids, include_class_breakdown, include_fee_analytics, include_staff_summary } = input;

  // Calculate date range
  let startDate: string;
  let endDate: string;
  
  if (time_range === 'CUSTOM' && date_from && date_to) {
    startDate = date_from;
    endDate = date_to;
  } else {
    const dateRange = calculateDateRange(time_range);
    startDate = dateRange.start;
    endDate = dateRange.end;
  }

  // Business validation
  if (new Date(endDate) < new Date(startDate)) {
    throw new Error('End date cannot be before start date');
  }

  // Get school info
  const schoolInfo = await repo.getSchoolInfo(schoolId, trustId) as any;
  
  // Get school summary data
  const summaryData = await repo.getSchoolSummary(schoolId, trustId, startDate, endDate, class_ids) as any;

  // Get class analytics if requested
  let classAnalytics;
  if (include_class_breakdown) {
    classAnalytics = await repo.getClassAnalytics(schoolId, trustId, startDate, endDate, class_ids);
  }

  // Get fee analytics if requested
  let feeAnalytics;
  if (include_fee_analytics) {
    feeAnalytics = await repo.getSchoolFeeAnalytics(schoolId, trustId, startDate, endDate) as any;
  }

  // Get staff summary if requested
  let staffSummary;
  if (include_staff_summary) {
    staffSummary = await repo.getStaffSummary(schoolId, trustId);
  }

  // Get recent activities
  const recentActivities = await repo.getRecentActivities(schoolId, trustId, 10);

  return {
    dashboard_type: 'SCHOOL_ADMIN',
    school_info: schoolInfo,
    time_period: { from: startDate, to: endDate },
    summary: summaryData,
    class_analytics: classAnalytics,
    fee_analytics: feeAnalytics,
    staff_summary: staffSummary,
    recent_activities: recentActivities,
    generated_at: new Date().toISOString(),
  };
}

// DASH-08-003: Teacher dashboard
export async function dash_08_003Service(input: Dash08003RequestT, trustId: number, teacherId: number): Promise<Dash08003ResponseT> {
  const { time_range, date_from, date_to, class_ids, include_student_performance, include_attendance_details } = input;

  // Calculate date range
  let startDate: string;
  let endDate: string;
  
  if (time_range === 'CUSTOM' && date_from && date_to) {
    startDate = date_from;
    endDate = date_to;
  } else {
    const dateRange = calculateDateRange(time_range);
    startDate = dateRange.start;
    endDate = dateRange.end;
  }

  // Business validation
  if (new Date(endDate) < new Date(startDate)) {
    throw new Error('End date cannot be before start date');
  }

  // Get teacher info
  const teacherInfo = await repo.getTeacherInfo(teacherId, trustId) as any;
  
  // Get teacher's classes
  const teacherClasses = await repo.getTeacherClasses(teacherId, trustId, class_ids);
  
  // Calculate summary from teacher's classes
  const summary = {
    total_classes: teacherClasses.length,
    total_students: teacherClasses.reduce((sum: number, cls: any) => sum + cls.student_count, 0),
    classes_today: teacherClasses.filter((cls: any) => cls.today_attendance.marked).length,
    average_attendance: teacherClasses.length > 0 
      ? teacherClasses.reduce((sum: number, cls: any) => sum + cls.recent_attendance_rate, 0) / teacherClasses.length 
      : 0,
    pending_tasks: 0 // TODO: Implement task tracking
  };

  // Get attendance summary if requested
  let attendanceSummary;
  if (include_attendance_details) {
    attendanceSummary = await repo.getTeacherAttendanceSummary(teacherId, trustId, startDate, endDate);
  }

  // Get student performance if requested
  let studentPerformance;
  if (include_student_performance) {
    studentPerformance = await repo.getStudentPerformance(teacherId, trustId, startDate, endDate);
  }

  // Get upcoming tasks
  const upcomingTasks = await repo.getUpcomingTasks(teacherId, trustId);

  return {
    dashboard_type: 'TEACHER',
    teacher_info: teacherInfo,
    time_period: { from: startDate, to: endDate },
    summary,
    my_classes: teacherClasses,
    attendance_summary: attendanceSummary,
    student_performance: studentPerformance,
    upcoming_tasks: upcomingTasks,
    generated_at: new Date().toISOString(),
  };
}

// Helper function to calculate date ranges
function calculateDateRange(timeRange: string): { start: string; end: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (timeRange) {
    case 'TODAY':
      return {
        start: today.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    
    case 'YESTERDAY':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: yesterday.toISOString().split('T')[0],
        end: yesterday.toISOString().split('T')[0]
      };
    
    case 'THIS_WEEK':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        start: startOfWeek.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    
    case 'LAST_WEEK':
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
      return {
        start: lastWeekStart.toISOString().split('T')[0],
        end: lastWeekEnd.toISOString().split('T')[0]
      };
    
    case 'THIS_MONTH':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: startOfMonth.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    
    case 'LAST_MONTH':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        start: lastMonthStart.toISOString().split('T')[0],
        end: lastMonthEnd.toISOString().split('T')[0]
      };
    
    case 'THIS_YEAR':
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return {
        start: startOfYear.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    
    default:
      // Default to this month
      const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: defaultStart.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
  }
}
