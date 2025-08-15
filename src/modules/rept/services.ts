/**
 * REPT Module Services
 * Business logic layer for Reporting and Analytics
 */

import type {
  Rept07001RequestT,
  Rept07001ResponseT,
  Rept07002RequestT,
  Rept07002ResponseT,
  Rept07003RequestT,
  Rept07003ResponseT,
  Rept07004RequestT,
  Rept07004ResponseT,
  Rept07005RequestT,
  Rept07005ResponseT,
  Rept07006RequestT,
  Rept07006ResponseT,
} from './dtos';
import * as repo from './repos';

// REPT-07-001: Student profile reports
export async function rept_07_001Service(input: Rept07001RequestT, trustId: number): Promise<Rept07001ResponseT> {
  const { 
    report_scope, 
    class_id, 
    section_id, 
    student_ids, 
    academic_year_id, 
    include_admission_details,
    include_parent_details,
    include_documents,
    include_transfers,
    filters,
    format 
  } = input;

  // Business validation
  if (report_scope === 'INDIVIDUAL' && (!student_ids || student_ids.length === 0)) {
    throw new Error('Student IDs are required for individual report scope');
  }

  if (report_scope === 'CLASS_WISE' && !class_id) {
    throw new Error('Class ID is required for class-wise report scope');
  }

  // Generate report
  const reportData = await repo.generateStudentProfileReport({
    scope: report_scope,
    class_id,
    section_id,
    student_ids,
    academic_year_id,
    include_admission_details,
    include_parent_details,
    include_documents,
    include_transfers,
    filters,
  }, trustId);

  // Create report record
  const reportRecord = await repo.createReportRecord({
    report_name: `Student Profile Report - ${report_scope}`,
    report_type: 'STUDENT_PROFILE',
    generated_by: 1, // TODO: Get from auth context
    status: 'COMPLETED',
  }, trustId);

  let filePath;
  if (format !== 'JSON') {
    filePath = await repo.exportReportToFile(reportRecord.report_id, reportData, format, trustId);
  }

  return {
    report_id: reportRecord.report_id,
    report_type: 'STUDENT_PROFILE',
    generated_at: new Date().toISOString(),
    total_students: reportData.length,
    students: reportData,
    file_path: filePath,
  };
}

// REPT-07-002: Fee collection reports
export async function rept_07_002Service(input: Rept07002RequestT, trustId: number): Promise<Rept07002ResponseT> {
  const { 
    report_period, 
    date_from, 
    date_to, 
    class_id, 
    payment_mode, 
    include_pending_fees,
    include_discounts,
    include_refunds,
    group_by,
    format 
  } = input;

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

  // Generate fee collection data
  const feeData = await repo.generateFeeCollectionReport({
    date_from,
    date_to,
    class_id,
    payment_mode,
    include_pending_fees,
    include_discounts,
    include_refunds,
    group_by,
  }, trustId);

  // Calculate summary statistics
  const summary = {
    total_collected: feeData.breakdown.reduce((sum: number, item: any) => sum + item.collected_amount, 0),
    total_pending: feeData.breakdown.reduce((sum: number, item: any) => sum + item.pending_amount, 0),
    total_students: feeData.breakdown.reduce((sum: number, item: any) => sum + item.student_count, 0),
    total_receipts: feeData.breakdown.reduce((sum: number, item: any) => sum + item.receipt_count, 0),
    collection_efficiency: 0,
    average_collection_per_student: 0,
  };

  const totalExpected = summary.total_collected + summary.total_pending;
  summary.collection_efficiency = totalExpected > 0 ? (summary.total_collected / totalExpected) * 100 : 0;
  summary.average_collection_per_student = summary.total_students > 0 ? summary.total_collected / summary.total_students : 0;

  // Create report record
  const reportRecord = await repo.createReportRecord({
    report_name: `Fee Collection Report - ${report_period}`,
    report_type: 'FEE_COLLECTION',
    generated_by: 1, // TODO: Get from auth context
    status: 'COMPLETED',
  }, trustId);

  let filePath;
  if (format !== 'JSON') {
    filePath = await repo.exportReportToFile(reportRecord.report_id, feeData, format, trustId);
  }

  return {
    report_id: reportRecord.report_id,
    report_type: 'FEE_COLLECTION',
    period: { from: date_from, to: date_to },
    summary,
    breakdown: feeData.breakdown,
    defaulters: feeData.defaulters,
    generated_at: new Date().toISOString(),
    file_path: filePath,
  };
}

// REPT-07-003: Attendance summary reports
export async function rept_07_003Service(input: Rept07003RequestT, trustId: number): Promise<Rept07003ResponseT> {
  const { 
    report_period, 
    date_from, 
    date_to, 
    class_id, 
    section_id, 
    min_attendance_threshold,
    include_leave_data,
    group_by,
    format 
  } = input;

  // Business validation
  const fromDate = new Date(date_from);
  const toDate = new Date(date_to);
  
  if (toDate < fromDate) {
    throw new Error('End date cannot be before start date');
  }

  // Generate attendance data
  const attendanceData = await repo.generateAttendanceSummaryReport({
    date_from,
    date_to,
    class_id,
    section_id,
    min_attendance_threshold,
    include_leave_data,
    group_by,
  }, trustId);

  // Calculate summary statistics
  const summary = {
    total_students: attendanceData.data.reduce((sum: number, group: any) => sum + group.student_count, 0),
    total_school_days: attendanceData.school_days,
    overall_attendance_rate: 0,
    students_above_threshold: 0,
    students_below_threshold: 0,
    perfect_attendance_count: 0,
  };

  const totalAttendancePoints = attendanceData.data.reduce((sum: number, group: any) => 
    sum + (group.attendance_percentage * group.student_count), 0
  );
  summary.overall_attendance_rate = summary.total_students > 0 ? totalAttendancePoints / summary.total_students : 0;

  // Calculate threshold statistics
  attendanceData.defaulters.forEach((student: any) => {
    if (student.attendance_percentage >= min_attendance_threshold) {
      summary.students_above_threshold++;
    } else {
      summary.students_below_threshold++;
    }
    if (student.attendance_percentage === 100) {
      summary.perfect_attendance_count++;
    }
  });

  // Create report record
  const reportRecord = await repo.createReportRecord({
    report_name: `Attendance Summary Report - ${report_period}`,
    report_type: 'ATTENDANCE',
    generated_by: 1, // TODO: Get from auth context
    status: 'COMPLETED',
  }, trustId);

  let filePath;
  if (format !== 'JSON') {
    filePath = await repo.exportReportToFile(reportRecord.report_id, attendanceData, format, trustId);
  }

  return {
    report_id: reportRecord.report_id,
    report_type: 'ATTENDANCE',
    period: { from: date_from, to: date_to },
    summary,
    attendance_data: attendanceData.data,
    defaulters: attendanceData.defaulters,
    generated_at: new Date().toISOString(),
    file_path: filePath,
  };
}

// REPT-07-004: Academic performance reports
export async function rept_07_004Service(input: Rept07004RequestT, trustId: number): Promise<Rept07004ResponseT> {
  const { 
    academic_year_id, 
    report_scope, 
    class_id, 
    subject_id, 
    teacher_id, 
    include_trends,
    include_comparisons,
    performance_metrics,
    format 
  } = input;

  // Business validation based on scope
  if (report_scope === 'CLASS_PERFORMANCE' && !class_id) {
    throw new Error('Class ID is required for class performance scope');
  }
  if (report_scope === 'SUBJECT_ANALYSIS' && !subject_id) {
    throw new Error('Subject ID is required for subject analysis scope');
  }
  if (report_scope === 'TEACHER_PERFORMANCE' && !teacher_id) {
    throw new Error('Teacher ID is required for teacher performance scope');
  }

  // Generate academic performance data
  const performanceData = await repo.generateAcademicPerformanceReport({
    academic_year_id,
    scope: report_scope,
    class_id,
    subject_id,
    teacher_id,
    performance_metrics,
    include_trends,
    include_comparisons,
  }, trustId);

  // Create report record
  const reportRecord = await repo.createReportRecord({
    report_name: `Academic Performance Report - ${report_scope}`,
    report_type: 'ACADEMIC_PERFORMANCE',
    generated_by: 1, // TODO: Get from auth context
    status: 'COMPLETED',
  }, trustId);

  let filePath;
  if (format !== 'JSON') {
    filePath = await repo.exportReportToFile(reportRecord.report_id, performanceData, format, trustId);
  }

  return {
    report_id: reportRecord.report_id,
    report_type: 'ACADEMIC_PERFORMANCE',
    academic_year: performanceData.academic_year,
    scope: report_scope,
    summary: performanceData.summary,
    performance_data: performanceData.data,
    trends: include_trends ? performanceData.trends : undefined,
    generated_at: new Date().toISOString(),
    file_path: filePath,
  };
}

// REPT-07-005: Custom report builder
export async function rept_07_005Service(input: Rept07005RequestT, trustId: number): Promise<Rept07005ResponseT> {
  const { 
    report_name, 
    template_id, 
    data_sources, 
    filters, 
    columns, 
    grouping, 
    save_as_template,
    format 
  } = input;

  // Business validation
  if (columns.length === 0) {
    throw new Error('At least one column must be specified');
  }

  if (data_sources.length === 0) {
    throw new Error('At least one data source must be specified');
  }

  // Generate custom report
  const reportData = await repo.generateCustomReport({
    data_sources,
    filters,
    columns,
    grouping,
  }, trustId);

  // Create report record
  const reportRecord = await repo.createReportRecord({
    report_name,
    report_type: 'CUSTOM',
    generated_by: 1, // TODO: Get from auth context
    status: 'COMPLETED',
  }, trustId);

  // Save as template if requested
  let savedTemplateId = template_id;
  if (save_as_template) {
    savedTemplateId = await repo.saveReportTemplate({
      template_name: report_name,
      template_type: 'CUSTOM',
      column_mappings: columns,
      query_template: JSON.stringify({ data_sources, filters, grouping }),
    }, trustId);
  }

  let filePath;
  if (format !== 'JSON') {
    filePath = await repo.exportReportToFile(reportRecord.report_id, reportData, format, trustId);
  }

  return {
    report_id: reportRecord.report_id,
    report_name,
    template_id: savedTemplateId,
    columns: columns.map(col => ({
      field_name: col.field_name,
      display_name: col.display_name,
      data_type: col.data_type,
    })),
    total_rows: reportData.length,
    data: reportData,
    generated_at: new Date().toISOString(),
    file_path: filePath,
  };
}

// REPT-07-006: Export to PDF/Excel
export async function rept_07_006Service(input: Rept07006RequestT, trustId: number): Promise<Rept07006ResponseT> {
  const { report_id, export_format, include_charts, include_summary, page_orientation, custom_styling } = input;

  // Verify report exists
  const report = await repo.findReportById(report_id, trustId);
  if (!report) {
    throw new Error('Report not found');
  }

  // Generate export file
  const exportResult = await repo.exportReportWithCustomization({
    report_id,
    export_format,
    include_charts,
    include_summary,
    page_orientation,
    custom_styling,
  }, trustId);

  // Create export record
  const exportRecord = await repo.createExportRecord({
    report_id,
    export_format,
    file_path: exportResult.file_path,
    file_size: exportResult.file_size,
  }, trustId);

  return {
    export_id: exportRecord.export_id,
    original_report_id: report_id,
    export_format,
    file_path: exportResult.file_path,
    file_size: exportResult.file_size,
    download_url: `/api/v1/reports/download/${exportRecord.export_id}`,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    created_at: exportRecord.created_at,
  };
}
