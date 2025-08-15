/**
 * ATTD Module Services
 * Business logic layer for Attendance Management
 */

import type {
  Attd06001RequestT,
  Attd06001ResponseT,
  Attd06002RequestT,
  Attd06002ResponseT,
  Attd06003RequestT,
  Attd06003ResponseT,
  Attd06004RequestT,
  Attd06004ResponseT,
} from './dtos';
import * as repo from './repos';

// ATTD-06-001: Daily attendance & bulk import
export async function attd_06_001Service(input: Attd06001RequestT, trustId: number): Promise<Attd06001ResponseT> {
  const { date, class_id, section_id, attendance_records, marked_by } = input;

  // Business validation
  const attendanceDate = new Date(date);
  const today = new Date();
  if (attendanceDate > today) {
    throw new Error('Cannot mark attendance for future dates');
  }

  // Check if attendance already exists for this date/class/section
  const existingAttendance = await repo.findAttendanceByDateAndClass(date, class_id, section_id, trustId);
  if (existingAttendance && existingAttendance.length > 0) {
    throw new Error('Attendance already marked for this date and class');
  }

  // Validate all student IDs belong to the specified class/section
  const classStudents = await repo.getStudentsByClassSection(class_id, section_id, trustId);
  const classStudentIds = classStudents.map(s => s.student_id);
  
  for (const record of attendance_records) {
    if (!classStudentIds.includes(record.student_id)) {
      throw new Error(`Student ID ${record.student_id} does not belong to the specified class/section`);
    }
  }

  // Create attendance records
  const createdRecords = [];
  for (const record of attendance_records) {
    const attendanceData = {
      student_id: record.student_id,
      class_id,
      section_id: section_id || null,
      date,
      status: record.status,
      remarks: record.remarks || null,
      arrival_time: record.arrival_time || null,
      marked_by,
    };
    
    const created = await repo.createAttendanceRecord(attendanceData, trustId);
    createdRecords.push(created);
  }

  // Update attendance summary for each student
  for (const record of attendance_records) {
    await repo.updateAttendanceSummary(record.student_id, date, trustId);
  }

  // Calculate statistics
  const totalStudents = classStudents.length;
  const presentCount = attendance_records.filter(r => r.status === 'PRESENT').length;
  const absentCount = attendance_records.filter(r => r.status === 'ABSENT').length;
  const lateCount = attendance_records.filter(r => r.status === 'LATE').length;
  const halfDayCount = attendance_records.filter(r => r.status === 'HALF_DAY').length;
  const attendancePercentage = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

  return {
    date,
    class_id,
    section_id: section_id || null,
    total_students: totalStudents,
    present_count: presentCount,
    absent_count: absentCount,
    late_count: lateCount,
    half_day_count: halfDayCount,
    attendance_percentage: Math.round(attendancePercentage * 100) / 100,
    records_created: createdRecords.length,
    marked_at: new Date().toISOString(),
  };
}

// ATTD-06-002: Leave/absence workflows
export async function attd_06_002Service(input: Attd06002RequestT, trustId: number): Promise<Attd06002ResponseT> {
  const { student_id, leave_type, start_date, end_date, reason, supporting_documents, applied_by, contact_number } = input;

  // Business validation
  const startDateObj = new Date(start_date);
  const endDateObj = new Date(end_date);
  
  if (endDateObj < startDateObj) {
    throw new Error('End date cannot be before start date');
  }

  // Calculate total days (excluding weekends for now - can be enhanced)
  const timeDiff = endDateObj.getTime() - startDateObj.getTime();
  const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

  if (totalDays > 30) {
    throw new Error('Leave application cannot exceed 30 days. Please contact administration for longer leaves');
  }

  // Verify student exists
  const student = await repo.findStudentById(student_id, trustId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Check for overlapping leave applications
  const overlappingLeave = await repo.findOverlappingLeave(student_id, start_date, end_date, trustId);
  if (overlappingLeave) {
    throw new Error('Student already has a leave application for overlapping dates');
  }

  // Create leave application
  const leaveData = {
    student_id,
    leave_type,
    start_date,
    end_date,
    total_days: totalDays,
    reason,
    applied_by,
    contact_number: contact_number || null,
    status: 'PENDING',
    application_date: new Date().toISOString().split('T')[0],
  };

  const leaveApplication = await repo.createLeaveApplication(leaveData, trustId);

  // Store supporting documents if provided
  if (supporting_documents && supporting_documents.length > 0) {
    for (const doc of supporting_documents) {
      await repo.createLeaveDocument({
        leave_application_id: leaveApplication.leave_application_id,
        document_type: doc.document_type,
        file_path: doc.file_path,
      }, trustId);
    }
  }

  return {
    leave_application_id: leaveApplication.leave_application_id,
    student_id: leaveApplication.student_id,
    leave_type: leaveApplication.leave_type,
    start_date: leaveApplication.start_date,
    end_date: leaveApplication.end_date,
    total_days: leaveApplication.total_days,
    status: leaveApplication.status,
    application_date: leaveApplication.application_date,
    created_at: leaveApplication.created_at,
  };
}

// ATTD-06-003: Attendance reporting/analytics
export async function attd_06_003Service(input: Attd06003RequestT, trustId: number): Promise<Attd06003ResponseT> {
  const { report_type, date_from, date_to, class_id, section_id, student_id, min_attendance_percentage, include_leave_data, format } = input;

  // Business validation
  const fromDate = new Date(date_from);
  const toDate = new Date(date_to);
  
  if (toDate < fromDate) {
    throw new Error('End date cannot be before start date');
  }

  const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24));
  if (daysDiff > 365) {
    throw new Error('Report period cannot exceed 1 year');
  }

  // Get attendance data based on filters
  const attendanceData = await repo.getAttendanceReport({
    date_from,
    date_to,
    class_id,
    section_id,
    student_id,
    min_attendance_percentage,
    include_leave_data,
  }, trustId);

  // Calculate summary statistics
  const totalStudents = attendanceData.length;
  const totalSchoolDays = await repo.getSchoolDaysBetween(date_from, date_to, trustId);
  const averageAttendance = totalStudents > 0 
    ? attendanceData.reduce((sum, student) => sum + student.attendance_percentage, 0) / totalStudents
    : 0;
  
  const defaulterCount = attendanceData.filter(s => s.attendance_percentage < (min_attendance_percentage || 75)).length;
  const perfectAttendanceCount = attendanceData.filter(s => s.attendance_percentage === 100).length;

  const summary = {
    total_students: totalStudents,
    total_school_days: totalSchoolDays,
    average_attendance: Math.round(averageAttendance * 100) / 100,
    defaulter_count: defaulterCount,
    perfect_attendance_count: perfectAttendanceCount,
  };

  let filePath;
  if (format !== 'JSON') {
    // Generate file-based report (PDF/Excel)
    filePath = await repo.generateAttendanceReportFile(report_type, attendanceData, summary, format, trustId);
  }

  return {
    report_type,
    period: {
      from: date_from,
      to: date_to,
    },
    summary,
    data: attendanceData,
    generated_at: new Date().toISOString(),
    file_path: filePath,
  };
}

// ATTD-06-004: Student attendance profiles
export async function attd_06_004Service(input: Attd06004RequestT, trustId: number): Promise<Attd06004ResponseT> {
  const { student_id, academic_year_id, include_monthly_breakdown, include_leave_history, include_patterns } = input;

  // Verify student exists and get basic info
  const student = await repo.getStudentProfile(student_id, academic_year_id, trustId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Get overall attendance summary
  const overallSummary = await repo.getStudentAttendanceSummary(student_id, academic_year_id, trustId);

  let monthlyBreakdown;
  if (include_monthly_breakdown) {
    monthlyBreakdown = await repo.getStudentMonthlyAttendance(student_id, academic_year_id, trustId);
  }

  let leaveHistory;
  if (include_leave_history) {
    leaveHistory = await repo.getStudentLeaveHistory(student_id, academic_year_id, trustId);
  }

  let attendancePatterns;
  if (include_patterns) {
    attendancePatterns = await repo.analyzeAttendancePatterns(student_id, academic_year_id, trustId);
  }

  return {
    student_id,
    student_info: {
      name: student.name,
      admission_number: student.admission_number,
      class_section: student.class_section,
      academic_year: student.academic_year,
    },
    overall_summary: overallSummary as any,
    monthly_breakdown: monthlyBreakdown as any,
    leave_history: leaveHistory as any,
    attendance_patterns: attendancePatterns,
    generated_at: new Date().toISOString(),
  };
}
