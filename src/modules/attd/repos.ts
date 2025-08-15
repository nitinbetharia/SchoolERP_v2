/**
 * ATTD Module Repository
 * Data access layer for Attendance Management with parameterized queries
 */

import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbManager } from '../../lib/database';

// Attendance Daily Record operations
export async function findAttendanceByDateAndClass(
  date: string,
  classId: number,
  sectionId: number | undefined,
  trustId: number
): Promise<any[]> {
  const connection = await dbManager.getTrustConnection(trustId);
  const query = sectionId
    ? `SELECT * FROM attendance_daily WHERE date = ? AND class_id = ? AND section_id = ?`
    : `SELECT * FROM attendance_daily WHERE date = ? AND class_id = ? AND section_id IS NULL`;
  
  const params = sectionId ? [date, classId, sectionId] : [date, classId];
  const [rows] = await connection.execute<RowDataPacket[]>(query, params);
  return rows;
}

export async function getStudentsByClassSection(
  classId: number,
  sectionId: number | undefined,
  trustId: number
): Promise<any[]> {
  const connection = await dbManager.getTrustConnection(trustId);
  const query = sectionId
    ? `SELECT student_id, first_name, last_name FROM students WHERE class_id = ? AND section_id = ? AND is_active = true`
    : `SELECT student_id, first_name, last_name FROM students WHERE class_id = ? AND section_id IS NULL AND is_active = true`;
  
  const params = sectionId ? [classId, sectionId] : [classId];
  const [rows] = await connection.execute<RowDataPacket[]>(query, params);
  return rows.map(row => ({ student_id: row.id || row.student_id, name: `${row.first_name} ${row.last_name}` }));
}

export async function createAttendanceRecord(attendanceData: any, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO attendance_daily 
     (trust_id, student_id, class_id, section_id, date, status, remarks, arrival_time, marked_by, marked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      trustId,
      attendanceData.student_id,
      attendanceData.class_id,
      attendanceData.section_id,
      attendanceData.date,
      attendanceData.status,
      attendanceData.remarks,
      attendanceData.arrival_time,
      attendanceData.marked_by,
    ]
  );

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT * FROM attendance_daily WHERE id = ?`,
    [result.insertId]
  );
  return rows[0];
}

export async function updateAttendanceSummary(studentId: number, date: string, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const monthYear = date.substring(0, 7); // Extract YYYY-MM
  
  // Get current month's attendance data
  const [attendanceRows] = await connection.execute<RowDataPacket[]>(
    `SELECT status, COUNT(*) as count 
     FROM attendance_daily 
     WHERE student_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?
     GROUP BY status`,
    [studentId, monthYear]
  );

  const stats = {
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    half_days: 0,
  };

  attendanceRows.forEach(row => {
    switch (row.status) {
      case 'PRESENT':
        stats.present_days = row.count;
        break;
      case 'ABSENT':
        stats.absent_days = row.count;
        break;
      case 'LATE':
        stats.late_days = row.count;
        break;
      case 'HALF_DAY':
        stats.half_days = row.count;
        break;
    }
  });

  const totalDays = stats.present_days + stats.absent_days + stats.late_days + stats.half_days;
  const attendancePercentage = totalDays > 0 ? (stats.present_days / totalDays) * 100 : 0;

  // Upsert attendance summary
  await connection.execute(
    `INSERT INTO attendance_summary 
     (trust_id, student_id, month_year, total_days, present_days, absent_days, late_days, half_days, attendance_percentage)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     total_days = VALUES(total_days),
     present_days = VALUES(present_days),
     absent_days = VALUES(absent_days),
     late_days = VALUES(late_days),
     half_days = VALUES(half_days),
     attendance_percentage = VALUES(attendance_percentage),
     updated_at = NOW()`,
    [
      trustId,
      studentId,
      monthYear,
      totalDays,
      stats.present_days,
      stats.absent_days,
      stats.late_days,
      stats.half_days,
      attendancePercentage,
    ]
  );
}

// Student operations
export async function findStudentById(studentId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT * FROM students WHERE id = ? AND is_active = true`,
    [studentId]
  );
  return rows[0] || null;
}

// Leave Application operations
export async function findOverlappingLeave(
  studentId: number,
  startDate: string,
  endDate: string,
  trustId: number
) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT * FROM leave_applications 
     WHERE student_id = ? 
       AND status IN ('PENDING', 'APPROVED')
       AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))`,
    [studentId, startDate, startDate, endDate, endDate]
  );
  return rows[0] || null;
}

export async function createLeaveApplication(leaveData: any, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO leave_applications 
     (trust_id, student_id, leave_type, start_date, end_date, total_days, reason, 
      applied_by, contact_number, status, application_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      trustId,
      leaveData.student_id,
      leaveData.leave_type,
      leaveData.start_date,
      leaveData.end_date,
      leaveData.total_days,
      leaveData.reason,
      leaveData.applied_by,
      leaveData.contact_number,
      leaveData.status,
      leaveData.application_date,
    ]
  );

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT * FROM leave_applications WHERE leave_application_id = ?`,
    [result.insertId]
  );
  return rows[0];
}

export async function createLeaveDocument(docData: any, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO leave_documents 
     (trust_id, leave_application_id, document_type, file_path, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [trustId, docData.leave_application_id, docData.document_type, docData.file_path]
  );
  return { document_id: result.insertId };
}

// Reporting operations
export async function getAttendanceReport(filters: any, trustId: number): Promise<any[]> {
  const connection = await dbManager.getTrustConnection(trustId);
  
  let query = `
    SELECT 
      s.id as student_id,
      CONCAT(s.first_name, ' ', s.last_name) as student_name,
      CONCAT(c.class_name, '-', COALESCE(sec.section_name, 'A')) as class_section,
      COUNT(ad.id) as total_days,
      SUM(CASE WHEN ad.status = 'PRESENT' THEN 1 ELSE 0 END) as present_days,
      SUM(CASE WHEN ad.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_days,
      SUM(CASE WHEN ad.status = 'LATE' THEN 1 ELSE 0 END) as late_days,
      SUM(CASE WHEN ad.status = 'HALF_DAY' THEN 1 ELSE 0 END) as half_days,
      ROUND(
        (SUM(CASE WHEN ad.status = 'PRESENT' THEN 1 ELSE 0 END) / COUNT(ad.id)) * 100, 2
      ) as attendance_percentage
    FROM students s
    LEFT JOIN attendance_daily ad ON s.id = ad.student_id 
      AND ad.date BETWEEN ? AND ?
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN sections sec ON s.section_id = sec.id
    WHERE s.is_active = true
  `;

  const params = [filters.date_from, filters.date_to];

  if (filters.class_id) {
    query += ` AND s.class_id = ?`;
    params.push(filters.class_id);
  }

  if (filters.section_id) {
    query += ` AND s.section_id = ?`;
    params.push(filters.section_id);
  }

  if (filters.student_id) {
    query += ` AND s.id = ?`;
    params.push(filters.student_id);
  }

  query += ` GROUP BY s.id, s.first_name, s.last_name, c.class_name, sec.section_name`;

  if (filters.min_attendance_percentage) {
    query += ` HAVING attendance_percentage >= ?`;
    params.push(filters.min_attendance_percentage);
  }

  const [rows] = await connection.execute<RowDataPacket[]>(query, params);
  return rows;
}

export async function getSchoolDaysBetween(dateFrom: string, dateTo: string, trustId: number): Promise<number> {
  // For now, calculate weekdays only (excluding weekends)
  // This can be enhanced to exclude holidays from a holidays table
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  let schoolDays = 0;
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
      schoolDays++;
    }
  }
  
  return schoolDays;
}

export async function generateAttendanceReportFile(
  reportType: string,
  data: any[],
  summary: any,
  format: string,
  trustId: number
): Promise<string> {
  // TODO: Implement actual file generation (PDF/Excel)
  // For now, return a placeholder path
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `/reports/attendance/${reportType}_${timestamp}.${format.toLowerCase()}`;
}

// Student Profile operations
export async function getStudentProfile(studentId: number, academicYearId: number | undefined, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      s.id as student_id,
      CONCAT(s.first_name, ' ', s.last_name) as name,
      s.admission_number,
      CONCAT(c.class_name, '-', COALESCE(sec.section_name, 'A')) as class_section,
      ay.year_name as academic_year
     FROM students s
     LEFT JOIN classes c ON s.class_id = c.id
     LEFT JOIN sections sec ON s.section_id = sec.id
     LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
     WHERE s.id = ? AND s.is_active = true`,
    [studentId]
  );
  return rows[0] || null;
}

export async function getStudentAttendanceSummary(studentId: number, academicYearId: number | undefined, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      SUM(total_days) as total_school_days,
      SUM(present_days) as total_present,
      SUM(absent_days) as total_absent,
      SUM(late_days) as total_late,
      SUM(half_days) as total_half_days,
      ROUND(AVG(attendance_percentage), 2) as overall_percentage
     FROM attendance_summary 
     WHERE student_id = ?`,
    [studentId]
  );
  return rows[0] || {
    total_school_days: 0,
    total_present: 0,
    total_absent: 0,
    total_late: 0,
    total_half_days: 0,
    overall_percentage: 0,
  };
}

export async function getStudentMonthlyAttendance(studentId: number, academicYearId: number | undefined, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      month_year,
      total_days as school_days,
      present_days as present,
      absent_days as absent,
      late_days as late,
      half_days,
      attendance_percentage as percentage
     FROM attendance_summary 
     WHERE student_id = ?
     ORDER BY month_year`,
    [studentId]
  );
  return rows;
}

export async function getStudentLeaveHistory(studentId: number, academicYearId: number | undefined, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      leave_type,
      start_date,
      end_date,
      total_days as days,
      status,
      reason
     FROM leave_applications 
     WHERE student_id = ?
     ORDER BY start_date DESC`,
    [studentId]
  );
  return rows;
}

export async function analyzeAttendancePatterns(studentId: number, academicYearId: number | undefined, trustId: number) {
  // TODO: Implement sophisticated pattern analysis
  // For now, return a simple analysis
  return {
    frequent_absent_days: ['Monday'], // Placeholder
    consecutive_absences: 2,
    improvement_trend: 'STABLE' as const,
  };
}