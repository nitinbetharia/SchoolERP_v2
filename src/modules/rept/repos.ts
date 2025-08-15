/**
 * REPT Module Repository
 * Data access layer for Reporting and Analytics with parameterized queries
 */

import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbManager } from '../../lib/database';

// Report Record operations
export async function createReportRecord(reportData: any, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO reports 
     (trust_id, report_name, report_type, generated_by, status, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [trustId, reportData.report_name, reportData.report_type, reportData.generated_by, reportData.status]
  );

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT * FROM reports WHERE id = ?`,
    [result.insertId]
  );
  return { report_id: result.insertId, ...rows[0] };
}

export async function findReportById(reportId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT * FROM reports WHERE id = ?`,
    [reportId]
  );
  return rows[0] || null;
}

// Student Profile Report operations
export async function generateStudentProfileReport(params: any, trustId: number): Promise<any[]> {
  const connection = await dbManager.getTrustConnection(trustId);
  
  let query = `
    SELECT 
      s.id as student_id,
      s.admission_number,
      CONCAT(s.first_name, ' ', s.last_name) as name,
      CONCAT(c.class_name, '-', COALESCE(sec.section_name, 'A')) as class_section,
      s.date_of_birth,
      s.gender,
      a.admission_date,
      s.is_active
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN admissions a ON s.id = a.student_id
    WHERE s.trust_id = ?
  `;

  const queryParams = [trustId];

  if (params.class_id) {
    query += ` AND s.class_id = ?`;
    queryParams.push(params.class_id);
  }

  if (params.section_id) {
    query += ` AND s.section_id = ?`;
    queryParams.push(params.section_id);
  }

  if (params.student_ids && params.student_ids.length > 0) {
    query += ` AND s.id IN (${params.student_ids.map(() => '?').join(',')})`;
    queryParams.push(...params.student_ids);
  }

  if (params.filters?.gender) {
    query += ` AND s.gender = ?`;
    queryParams.push(params.filters.gender);
  }

  query += ` ORDER BY s.first_name, s.last_name`;

  const [rows] = await connection.execute<RowDataPacket[]>(query, queryParams);
  
  // Add parent details if requested
  if (params.include_parent_details) {
    for (const student of rows) {
      const [parentRows] = await connection.execute<RowDataPacket[]>(
        `SELECT u.full_name, u.phone as contact_phone, u.email as contact_email, sp.relationship
         FROM student_parents sp
         JOIN users u ON sp.parent_user_id = u.id
         WHERE sp.student_id = ? AND sp.is_primary = true`,
        [student.student_id]
      );
      
      student.parent_details = parentRows.length > 0 ? {
        father_name: parentRows.find(p => p.relationship === 'FATHER')?.full_name || null,
        mother_name: parentRows.find(p => p.relationship === 'MOTHER')?.full_name || null,
        contact_phone: parentRows[0]?.contact_phone || null,
        contact_email: parentRows[0]?.contact_email || null,
      } : {};
    }
  }

  return rows as any[];
}

// Fee Collection Report operations
export async function generateFeeCollectionReport(params: any, trustId: number): Promise<any> {
  const connection = await dbManager.getTrustConnection(trustId);
  
  // Generate breakdown data based on group_by parameter
  let breakdownQuery = `
    SELECT 
      DATE(fr.created_at) as period_label,
      SUM(fr.amount) as collected_amount,
      COUNT(DISTINCT fr.id) as receipt_count,
      COUNT(DISTINCT fr.student_id) as student_count,
      0 as pending_amount
    FROM fee_receipts fr
    WHERE fr.trust_id = ? AND DATE(fr.created_at) BETWEEN ? AND ?
  `;

  const queryParams = [trustId, params.date_from, params.date_to];

  if (params.class_id) {
    breakdownQuery += ` AND fr.student_id IN (
      SELECT id FROM students WHERE class_id = ? AND trust_id = ?
    )`;
    queryParams.push(params.class_id, trustId);
  }

  if (params.payment_mode) {
    breakdownQuery += ` AND fr.mode = ?`;
    queryParams.push(params.payment_mode);
  }

  breakdownQuery += ` GROUP BY DATE(fr.created_at) ORDER BY DATE(fr.created_at)`;

  const [breakdownRows] = await connection.execute<RowDataPacket[]>(breakdownQuery, queryParams);

  // Get defaulters data
  const [defaulterRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      s.id as student_id,
      CONCAT(s.first_name, ' ', s.last_name) as student_name,
      CONCAT(c.class_name, '-', COALESCE(sec.section_name, 'A')) as class_section,
      sfa.balance_amount as pending_amount,
      DATEDIFF(NOW(), fi.due_date) as overdue_days
     FROM students s
     LEFT JOIN classes c ON s.class_id = c.id
     LEFT JOIN sections sec ON s.section_id = sec.id
     LEFT JOIN student_fee_assignments sfa ON s.id = sfa.student_id
     LEFT JOIN fee_installments fi ON sfa.fee_structure_id = fi.fee_structure_id
     WHERE s.trust_id = ? AND sfa.balance_amount > 0
     ORDER BY sfa.balance_amount DESC
     LIMIT 20`,
    [trustId]
  );

  return {
    breakdown: breakdownRows,
    defaulters: defaulterRows,
  };
}

// Attendance Summary Report operations
export async function generateAttendanceSummaryReport(params: any, trustId: number): Promise<any> {
  const connection = await dbManager.getTrustConnection(trustId);
  
  let query = `
    SELECT 
      CONCAT(c.class_name, '-', COALESCE(sec.section_name, 'A')) as group_label,
      COUNT(DISTINCT s.id) as student_count,
      SUM(ads.present_days) as total_present,
      SUM(ads.absent_days) as total_absent,
      SUM(ads.late_days) as total_late,
      ROUND(AVG(ads.attendance_percentage), 2) as attendance_percentage
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN attendance_summary ads ON s.id = ads.student_id
      AND ads.month_year BETWEEN ? AND ?
    WHERE s.trust_id = ? AND s.is_active = true
  `;

  const queryParams = [
    params.date_from.substring(0, 7), // Convert to YYYY-MM format
    params.date_to.substring(0, 7),
    trustId
  ];

  if (params.class_id) {
    query += ` AND s.class_id = ?`;
    queryParams.push(params.class_id);
  }

  if (params.section_id) {
    query += ` AND s.section_id = ?`;
    queryParams.push(params.section_id);
  }

  query += ` GROUP BY c.class_name, sec.section_name ORDER BY c.class_name`;

  const [dataRows] = await connection.execute<RowDataPacket[]>(query, queryParams);

  // Get defaulters (students with low attendance)
  const [defaulterRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      s.id as student_id,
      CONCAT(s.first_name, ' ', s.last_name) as student_name,
      CONCAT(c.class_name, '-', COALESCE(sec.section_name, 'A')) as class_section,
      ROUND(AVG(ads.attendance_percentage), 2) as attendance_percentage,
      SUM(ads.absent_days) as total_absences,
      MAX(consecutive_absent_days) as consecutive_absences
     FROM students s
     LEFT JOIN classes c ON s.class_id = c.id
     LEFT JOIN sections sec ON s.section_id = sec.id
     LEFT JOIN attendance_summary ads ON s.id = ads.student_id
     WHERE s.trust_id = ? AND ads.attendance_percentage < ?
     GROUP BY s.id, s.first_name, s.last_name, c.class_name, sec.section_name
     ORDER BY attendance_percentage ASC
     LIMIT 50`,
    [trustId, params.min_attendance_threshold]
  );

  // Calculate school days between dates (simplified)
  const schoolDays = Math.floor((new Date(params.date_to).getTime() - new Date(params.date_from).getTime()) / (1000 * 60 * 60 * 24));

  return {
    data: dataRows,
    defaulters: defaulterRows,
    school_days: schoolDays,
  };
}

// Academic Performance Report operations
export async function generateAcademicPerformanceReport(params: any, trustId: number): Promise<any> {
  const connection = await dbManager.getTrustConnection(trustId);
  
  // For now, return placeholder data since we don't have academic records tables yet
  const [academicYearRow] = await connection.execute<RowDataPacket[]>(
    `SELECT year_name FROM academic_years WHERE id = ?`,
    [params.academic_year_id]
  );

  const academicYear = academicYearRow[0]?.year_name || 'Unknown';

  // Placeholder performance data
  const performanceData = [
    {
      entity_name: 'Class 1',
      entity_type: 'CLASS',
      student_count: 25,
      pass_rate: 85.5,
      average_marks: 78.2,
      highest_marks: 95,
      lowest_marks: 45,
    },
    {
      entity_name: 'Class 2',
      entity_type: 'CLASS', 
      student_count: 30,
      pass_rate: 90.0,
      average_marks: 82.1,
      highest_marks: 98,
      lowest_marks: 52,
    }
  ];

  const summary = {
    total_students: performanceData.reduce((sum, item) => sum + item.student_count, 0),
    total_classes: performanceData.length,
    overall_pass_rate: performanceData.reduce((sum, item) => sum + item.pass_rate, 0) / performanceData.length,
    average_score: performanceData.reduce((sum, item) => sum + item.average_marks, 0) / performanceData.length,
    top_performing_class: performanceData.sort((a, b) => b.average_marks - a.average_marks)[0]?.entity_name,
    improvement_trend: 'STABLE' as const,
  };

  const trends = params.include_trends ? [
    { period: '2024-Q1', metric: 'pass_rate', value: 85.2, change_percentage: 2.1 },
    { period: '2024-Q2', metric: 'pass_rate', value: 87.8, change_percentage: 3.0 },
  ] : [];

  return {
    academic_year: academicYear,
    summary,
    data: performanceData,
    trends,
  };
}

// Custom Report operations
export async function generateCustomReport(params: any, trustId: number): Promise<any[]> {
  const connection = await dbManager.getTrustConnection(trustId);
  
  // Build dynamic query based on data sources and columns
  let query = 'SELECT ';
  const columns = params.columns.map((col: any) => `${col.field_name} as ${col.display_name}`).join(', ');
  query += columns;

  // Add FROM clause based on primary data source
  const primarySource = params.data_sources[0];
  switch (primarySource) {
    case 'STUDENTS':
      query += ' FROM students s';
      break;
    case 'FEES':
      query += ' FROM fee_receipts fr';
      break;
    case 'ATTENDANCE':
      query += ' FROM attendance_summary ads';
      break;
    default:
      query += ' FROM students s';
  }

  query += ' WHERE trust_id = ?';
  const queryParams = [trustId];

  // Add filters
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      query += ` AND ${key} = ?`;
      queryParams.push(value as any);
    });
  }

  // Add grouping and sorting
  if (params.grouping?.group_by && params.grouping.group_by.length > 0) {
    query += ` GROUP BY ${params.grouping.group_by.join(', ')}`;
  }

  if (params.grouping?.sort_by) {
    query += ` ORDER BY ${params.grouping.sort_by} ${params.grouping.sort_order || 'ASC'}`;
  }

  query += ' LIMIT 1000'; // Safety limit

  const [rows] = await connection.execute<RowDataPacket[]>(query, queryParams);
  return rows as any[];
}

// Report Template operations
export async function saveReportTemplate(templateData: any, trustId: number): Promise<number> {
  const connection = await dbManager.getTrustConnection(trustId);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO report_templates 
     (trust_id, template_name, template_type, query_template, column_mappings, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, true, NOW())`,
    [
      trustId,
      templateData.template_name,
      templateData.template_type,
      templateData.query_template,
      JSON.stringify(templateData.column_mappings),
    ]
  );
  return result.insertId;
}

// Export operations
export async function exportReportToFile(reportId: number, data: any, format: string, trustId: number): Promise<string> {
  // TODO: Implement actual file export (PDF/Excel/CSV generation)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `/reports/exports/${reportId}_${timestamp}.${format.toLowerCase()}`;
}

export async function exportReportWithCustomization(params: any, trustId: number): Promise<any> {
  // TODO: Implement customized export with styling
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = `/reports/exports/${params.report_id}_custom_${timestamp}.${params.export_format.toLowerCase()}`;
  
  return {
    file_path: filePath,
    file_size: 1024 * 50, // 50KB placeholder
  };
}

export async function createExportRecord(exportData: any, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO report_exports 
     (trust_id, report_id, export_format, file_path, file_size, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [trustId, exportData.report_id, exportData.export_format, exportData.file_path, exportData.file_size]
  );

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT * FROM report_exports WHERE export_id = ?`,
    [result.insertId]
  );
  
  return { export_id: result.insertId, created_at: new Date().toISOString(), ...rows[0] };
}