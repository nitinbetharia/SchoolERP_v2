/**
 * DASH Module Repository
 * Data access layer for Dashboard and Analytics with parameterized queries
 */

import type { RowDataPacket } from 'mysql2';
import { dbManager } from '../../lib/database';

// Trust Summary operations for DASH-08-001
export async function getTrustSummary(trustId: number, startDate: string, endDate: string, schoolIds?: number[]) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  let schoolFilter = '';
  const queryParams = [trustId, startDate, endDate];
  
  if (schoolIds && schoolIds.length > 0) {
    schoolFilter = ` AND s.id IN (${schoolIds.map(() => '?').join(',')})`;
    queryParams.push(...schoolIds);
  }

  // Get summary statistics
  const [summaryRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      COUNT(DISTINCT s.id) as total_schools,
      COUNT(DISTINCT st.id) as total_students,
      COUNT(DISTINCT u.id) as total_teachers,
      COALESCE(SUM(fr.amount), 0) as total_revenue,
      COALESCE(SUM(sfa.balance_amount), 0) as pending_fees,
      COALESCE(AVG(ads.attendance_percentage), 0) as overall_attendance_rate
     FROM schools s
     LEFT JOIN students st ON s.id = st.school_id AND st.trust_id = s.trust_id
     LEFT JOIN users u ON s.id = u.school_id AND u.role = 'TEACHER' AND u.is_active = true
     LEFT JOIN fee_receipts fr ON st.id = fr.student_id AND DATE(fr.created_at) BETWEEN ? AND ? AND fr.trust_id = ?
     LEFT JOIN student_fee_assignments sfa ON st.id = sfa.student_id AND sfa.is_active = true
     LEFT JOIN attendance_summary ads ON st.id = ads.student_id AND ads.month_year BETWEEN SUBSTRING(?, 1, 7) AND SUBSTRING(?, 1, 7)
     WHERE s.trust_id = ? AND s.is_active = true ${schoolFilter}`,
    [startDate, endDate, trustId, startDate, endDate, trustId, ...queryParams.slice(3)]
  );

  return summaryRows[0] || {
    total_schools: 0,
    total_students: 0,
    total_teachers: 0,
    total_revenue: 0,
    pending_fees: 0,
    overall_attendance_rate: 0
  };
}

// Schools Overview for DASH-08-001
export async function getSchoolsOverview(trustId: number, startDate: string, endDate: string, schoolIds?: number[]) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  let schoolFilter = '';
  const queryParams = [trustId, startDate, endDate, trustId, startDate, endDate];
  
  if (schoolIds && schoolIds.length > 0) {
    schoolFilter = ` AND s.id IN (${schoolIds.map(() => '?').join(',')})`;
    queryParams.push(...schoolIds);
  }

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      s.id as school_id,
      s.school_name,
      COUNT(DISTINCT st.id) as student_count,
      COUNT(DISTINCT u.id) as teacher_count,
      COALESCE(
        (SUM(CASE WHEN fr.amount IS NOT NULL THEN fr.amount ELSE 0 END) / 
         NULLIF(SUM(CASE WHEN sfa.final_amount IS NOT NULL THEN sfa.final_amount ELSE 0 END), 0)) * 100, 0
      ) as fee_collection_rate,
      COALESCE(AVG(ads.attendance_percentage), 0) as attendance_rate,
      MAX(COALESCE(fr.created_at, st.created_at, u.created_at)) as last_updated
     FROM schools s
     LEFT JOIN students st ON s.id = st.school_id AND st.trust_id = s.trust_id AND st.is_active = true
     LEFT JOIN users u ON s.id = u.school_id AND u.role = 'TEACHER' AND u.is_active = true
     LEFT JOIN fee_receipts fr ON st.id = fr.student_id AND DATE(fr.created_at) BETWEEN ? AND ? AND fr.trust_id = ?
     LEFT JOIN student_fee_assignments sfa ON st.id = sfa.student_id AND sfa.is_active = true
     LEFT JOIN attendance_summary ads ON st.id = ads.student_id AND ads.month_year BETWEEN SUBSTRING(?, 1, 7) AND SUBSTRING(?, 1, 7)
     WHERE s.trust_id = ? AND s.is_active = true ${schoolFilter}
     GROUP BY s.id, s.school_name
     ORDER BY s.school_name`,
    [...queryParams.slice(0, 6), trustId, ...queryParams.slice(6)]
  );

  return rows.map(row => ({
    school_id: row.school_id,
    school_name: row.school_name,
    student_count: row.student_count || 0,
    teacher_count: row.teacher_count || 0,
    fee_collection_rate: parseFloat(row.fee_collection_rate) || 0,
    attendance_rate: parseFloat(row.attendance_rate) || 0,
    last_updated: row.last_updated ? new Date(row.last_updated).toISOString() : new Date().toISOString()
  }));
}

// Financial Summary for DASH-08-001
export async function getFinancialSummary(trustId: number, startDate: string, endDate: string, schoolIds?: number[]) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  let schoolFilter = '';
  const queryParams = [trustId, startDate, endDate];
  
  if (schoolIds && schoolIds.length > 0) {
    schoolFilter = ` AND fr.student_id IN (SELECT id FROM students WHERE school_id IN (${schoolIds.map(() => '?').join(',')}))`;
    queryParams.push(...schoolIds);
  }

  // Get revenue trends (weekly)
  const [trendsRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      DATE_FORMAT(fr.created_at, '%Y-%m-%d') as period,
      SUM(fr.amount) as collected,
      0 as pending
     FROM fee_receipts fr
     WHERE fr.trust_id = ? AND DATE(fr.created_at) BETWEEN ? AND ? ${schoolFilter}
     GROUP BY DATE(fr.created_at)
     ORDER BY DATE(fr.created_at)`,
    queryParams
  );

  // Get top defaulters
  const [defaultersRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      s.school_name,
      SUM(sfa.balance_amount) as pending_amount,
      DATEDIFF(NOW(), fi.due_date) as overdue_days
     FROM student_fee_assignments sfa
     JOIN students st ON sfa.student_id = st.id
     JOIN schools s ON st.school_id = s.id
     LEFT JOIN fee_installments fi ON sfa.fee_structure_id = fi.fee_structure_id
     WHERE sfa.trust_id = ? AND sfa.balance_amount > 0 ${schoolFilter.replace('fr.student_id', 'sfa.student_id')}
     GROUP BY s.id, s.school_name, fi.due_date
     ORDER BY pending_amount DESC
     LIMIT 5`,
    [trustId, ...(schoolIds || [])]
  );

  // Calculate collection efficiency
  const [efficiencyRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      SUM(fr.amount) as total_collected,
      SUM(sfa.final_amount) as total_expected
     FROM fee_receipts fr
     JOIN student_fee_assignments sfa ON fr.student_id = sfa.student_id
     WHERE fr.trust_id = ? AND DATE(fr.created_at) BETWEEN ? AND ? ${schoolFilter}`,
    queryParams
  );

  const efficiency = efficiencyRows[0];
  const collectionEfficiency = efficiency?.total_expected > 0 
    ? (efficiency.total_collected / efficiency.total_expected) * 100 
    : 0;

  return {
    revenue_trends: trendsRows,
    collection_efficiency: parseFloat(collectionEfficiency.toString()) || 0,
    top_defaulters: defaultersRows.map(row => ({
      school_name: row.school_name,
      pending_amount: parseFloat(row.pending_amount) || 0,
      overdue_days: row.overdue_days || 0
    }))
  };
}

// Attendance Analytics for DASH-08-001
export async function getAttendanceAnalytics(trustId: number, startDate: string, endDate: string, schoolIds?: number[]) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  let schoolFilter = '';
  const queryParams = [trustId, startDate.substring(0, 7), endDate.substring(0, 7)];
  
  if (schoolIds && schoolIds.length > 0) {
    schoolFilter = ` AND st.school_id IN (${schoolIds.map(() => '?').join(',')})`;
    queryParams.push(...schoolIds);
  }

  // Get attendance trends
  const [trendsRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      ads.month_year as period,
      AVG(ads.attendance_percentage) as attendance_rate
     FROM attendance_summary ads
     JOIN students st ON ads.student_id = st.id
     WHERE ads.trust_id = ? AND ads.month_year BETWEEN ? AND ? ${schoolFilter}
     GROUP BY ads.month_year
     ORDER BY ads.month_year`,
    queryParams
  );

  // Get school comparison
  const [comparisonRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      s.school_name,
      AVG(ads.attendance_percentage) as attendance_rate
     FROM attendance_summary ads
     JOIN students st ON ads.student_id = st.id
     JOIN schools s ON st.school_id = s.id
     WHERE ads.trust_id = ? AND ads.month_year BETWEEN ? AND ? ${schoolFilter}
     GROUP BY s.id, s.school_name
     ORDER BY attendance_rate DESC`,
    queryParams
  );

  return {
    attendance_trends: trendsRows.map(row => ({
      period: row.period,
      attendance_rate: parseFloat(row.attendance_rate) || 0
    })),
    school_comparison: comparisonRows.map(row => ({
      school_name: row.school_name,
      attendance_rate: parseFloat(row.attendance_rate) || 0
    }))
  };
}

// School Info for DASH-08-002
export async function getSchoolInfo(schoolId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      s.id as school_id,
      s.school_name,
      ay.year_name as academic_year
     FROM schools s
     LEFT JOIN academic_years ay ON s.id = ay.school_id AND ay.is_current = true
     WHERE s.id = ? AND s.trust_id = ?`,
    [schoolId, trustId]
  );

  return rows[0] || {
    school_id: schoolId,
    school_name: 'Unknown School',
    academic_year: 'Unknown'
  };
}

// School Summary for DASH-08-002
export async function getSchoolSummary(schoolId: number, trustId: number, startDate: string, endDate: string, classIds?: number[]) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  let classFilter = '';
  const queryParams = [schoolId, trustId, startDate, endDate, trustId];
  
  if (classIds && classIds.length > 0) {
    classFilter = ` AND st.class_id IN (${classIds.map(() => '?').join(',')})`;
    queryParams.push(...classIds);
  }

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      COUNT(DISTINCT st.id) as total_students,
      COUNT(DISTINCT u.id) as total_teachers,
      COUNT(DISTINCT c.id) as total_classes,
      COALESCE(SUM(fr.amount), 0) as total_fee_collected,
      COALESCE(SUM(sfa.balance_amount), 0) as pending_fees,
      COALESCE(AVG(ads.attendance_percentage), 0) as average_attendance
     FROM students st
     LEFT JOIN users u ON st.school_id = u.school_id AND u.role = 'TEACHER' AND u.is_active = true
     LEFT JOIN classes c ON st.class_id = c.id
     LEFT JOIN fee_receipts fr ON st.id = fr.student_id AND DATE(fr.created_at) BETWEEN ? AND ? AND fr.trust_id = ?
     LEFT JOIN student_fee_assignments sfa ON st.id = sfa.student_id AND sfa.is_active = true
     LEFT JOIN attendance_summary ads ON st.id = ads.student_id AND ads.month_year BETWEEN SUBSTRING(?, 1, 7) AND SUBSTRING(?, 1, 7)
     WHERE st.school_id = ? AND st.trust_id = ? AND st.is_active = true ${classFilter}`,
    [startDate, endDate, trustId, startDate, endDate, schoolId, trustId, ...(classIds || [])]
  );

  return rows[0] || {
    total_students: 0,
    total_teachers: 0,
    total_classes: 0,
    total_fee_collected: 0,
    pending_fees: 0,
    average_attendance: 0
  };
}

// Class Analytics for DASH-08-002
export async function getClassAnalytics(schoolId: number, trustId: number, startDate: string, endDate: string, classIds?: number[]) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  let classFilter = '';
  const queryParams = [schoolId, trustId, startDate, endDate];
  
  if (classIds && classIds.length > 0) {
    classFilter = ` AND c.id IN (${classIds.map(() => '?').join(',')})`;
    queryParams.push(...classIds);
  }

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      c.id as class_id,
      c.class_name,
      COUNT(DISTINCT st.id) as student_count,
      COALESCE(AVG(ads.attendance_percentage), 0) as attendance_rate,
      COALESCE(
        (SUM(CASE WHEN fr.amount IS NOT NULL THEN fr.amount ELSE 0 END) / 
         NULLIF(SUM(CASE WHEN sfa.final_amount IS NOT NULL THEN sfa.final_amount ELSE 0 END), 0)) * 100, 0
      ) as fee_collection_rate,
      CASE WHEN COUNT(DISTINCT usa.user_id) > 0 THEN true ELSE false END as teacher_assigned
     FROM classes c
     LEFT JOIN students st ON c.id = st.class_id AND st.is_active = true
     LEFT JOIN fee_receipts fr ON st.id = fr.student_id AND DATE(fr.created_at) BETWEEN ? AND ?
     LEFT JOIN student_fee_assignments sfa ON st.id = sfa.student_id AND sfa.is_active = true
     LEFT JOIN attendance_summary ads ON st.id = ads.student_id AND ads.month_year BETWEEN SUBSTRING(?, 1, 7) AND SUBSTRING(?, 1, 7)
     LEFT JOIN user_school_assignments usa ON c.school_id = usa.school_id AND usa.role = 'TEACHER' AND usa.is_active = true
     WHERE c.school_id = ? AND c.trust_id = ? AND c.is_active = true ${classFilter}
     GROUP BY c.id, c.class_name
     ORDER BY c.class_order, c.class_name`,
    [...queryParams.slice(2), schoolId, trustId, ...(classIds || [])]
  );

  return rows.map(row => ({
    class_id: row.class_id,
    class_name: row.class_name,
    student_count: row.student_count || 0,
    attendance_rate: parseFloat(row.attendance_rate) || 0,
    fee_collection_rate: parseFloat(row.fee_collection_rate) || 0,
    teacher_assigned: row.teacher_assigned
  }));
}

// School Fee Analytics for DASH-08-002
export async function getSchoolFeeAnalytics(schoolId: number, trustId: number, startDate: string, endDate: string) {
  const connection = await dbManager.getTrustConnection(trustId);

  // Get collection trends
  const [trendsRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      DATE_FORMAT(fr.created_at, '%Y-%m-%d') as period,
      SUM(fr.amount) as collected,
      0 as pending
     FROM fee_receipts fr
     JOIN students st ON fr.student_id = st.id
     WHERE st.school_id = ? AND fr.trust_id = ? AND DATE(fr.created_at) BETWEEN ? AND ?
     GROUP BY DATE(fr.created_at)
     ORDER BY DATE(fr.created_at)`,
    [schoolId, trustId, startDate, endDate]
  );

  // Get defaulter summary
  const [defaulterRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      COUNT(DISTINCT sfa.student_id) as total_defaulters,
      SUM(sfa.balance_amount) as total_pending,
      COUNT(CASE WHEN sfa.balance_amount > 10000 THEN 1 END) as critical_cases
     FROM student_fee_assignments sfa
     JOIN students st ON sfa.student_id = st.id
     WHERE st.school_id = ? AND sfa.trust_id = ? AND sfa.balance_amount > 0`,
    [schoolId, trustId]
  );

  return {
    collection_trends: trendsRows,
    defaulter_summary: defaulterRows[0] || {
      total_defaulters: 0,
      total_pending: 0,
      critical_cases: 0
    }
  };
}

// Staff Summary for DASH-08-002
export async function getStaffSummary(schoolId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      COUNT(DISTINCT CASE WHEN u.role = 'TEACHER' AND u.is_active = true THEN u.id END) as active_teachers,
      COUNT(DISTINCT st.id) / NULLIF(COUNT(DISTINCT CASE WHEN u.role = 'TEACHER' THEN u.id END), 0) as teacher_student_ratio,
      0 as pending_assignments
     FROM users u
     LEFT JOIN students st ON u.school_id = st.school_id
     WHERE u.school_id = ? AND u.trust_id = ?`,
    [schoolId, trustId]
  );

  const result = rows[0];
  return {
    active_teachers: result?.active_teachers || 0,
    teacher_student_ratio: parseFloat(result?.teacher_student_ratio) || 0,
    pending_assignments: result?.pending_assignments || 0
  };
}

// Recent Activities for DASH-08-002
export async function getRecentActivities(schoolId: number, trustId: number, limit: number = 10) {
  const connection = await dbManager.getTrustConnection(trustId);

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      al.event_type as activity_type,
      CONCAT(al.event_type, ' - ', COALESCE(al.entity_type, 'System')) as description,
      al.created_at as timestamp,
      COALESCE(u.full_name, 'System') as user_name
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     WHERE al.trust_id = ?
     ORDER BY al.created_at DESC
     LIMIT ?`,
    [trustId, limit]
  );

  return rows.map(row => ({
    activity_type: row.activity_type,
    description: row.description,
    timestamp: new Date(row.timestamp).toISOString(),
    user_name: row.user_name
  }));
}

// Teacher Info for DASH-08-003
export async function getTeacherInfo(teacherId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      u.id as teacher_id,
      u.full_name as teacher_name,
      u.designation
     FROM users u
     WHERE u.id = ? AND u.trust_id = ? AND u.role = 'TEACHER'`,
    [teacherId, trustId]
  );

  return rows[0] || {
    teacher_id: teacherId,
    teacher_name: 'Unknown Teacher',
    designation: 'Teacher'
  };
}

// Teacher Classes for DASH-08-003
export async function getTeacherClasses(teacherId: number, trustId: number, classIds?: number[]) {
  const connection = await dbManager.getTrustConnection(trustId);
  
  let classFilter = '';
  const queryParams = [teacherId, trustId];
  
  if (classIds && classIds.length > 0) {
    classFilter = ` AND c.id IN (${classIds.map(() => '?').join(',')})`;
    queryParams.push(...classIds);
  }

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      c.id as class_id,
      c.class_name,
      COALESCE(sec.section_name, '') as section,
      COUNT(DISTINCT st.id) as student_count,
      COUNT(DISTINCT CASE WHEN ad.date = CURDATE() AND ad.status = 'PRESENT' THEN ad.student_id END) as present_today,
      COUNT(DISTINCT CASE WHEN ad.date = CURDATE() AND ad.status = 'ABSENT' THEN ad.student_id END) as absent_today,
      CASE WHEN COUNT(DISTINCT CASE WHEN ad.date = CURDATE() THEN ad.student_id END) > 0 THEN true ELSE false END as marked,
      COALESCE(AVG(ads.attendance_percentage), 0) as recent_attendance_rate
     FROM user_school_assignments usa
     JOIN classes c ON usa.school_id = c.school_id
     LEFT JOIN sections sec ON c.id = sec.class_id
     LEFT JOIN students st ON c.id = st.class_id AND st.is_active = true
     LEFT JOIN attendance_daily ad ON st.id = ad.student_id
     LEFT JOIN attendance_summary ads ON st.id = ads.student_id AND ads.month_year = DATE_FORMAT(NOW(), '%Y-%m')
     WHERE usa.user_id = ? AND usa.trust_id = ? AND usa.role = 'TEACHER' AND usa.is_active = true ${classFilter}
     GROUP BY c.id, c.class_name, sec.section_name
     ORDER BY c.class_order, c.class_name`,
    queryParams
  );

  return rows.map(row => ({
    class_id: row.class_id,
    class_name: row.class_name,
    section: row.section,
    student_count: row.student_count || 0,
    today_attendance: {
      present: row.present_today || 0,
      absent: row.absent_today || 0,
      marked: row.marked
    },
    recent_attendance_rate: parseFloat(row.recent_attendance_rate) || 0
  }));
}

// Teacher Attendance Summary for DASH-08-003
export async function getTeacherAttendanceSummary(teacherId: number, trustId: number, startDate: string, endDate: string) {
  const connection = await dbManager.getTrustConnection(trustId);

  // Get weekly trends
  const [trendsRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      ad.date,
      (COUNT(CASE WHEN ad.status = 'PRESENT' THEN 1 END) / COUNT(*)) * 100 as attendance_rate
     FROM attendance_daily ad
     JOIN students st ON ad.student_id = st.id
     JOIN user_school_assignments usa ON st.class_id = usa.school_id AND usa.user_id = ?
     WHERE usa.trust_id = ? AND ad.date BETWEEN ? AND ? AND usa.role = 'TEACHER' AND usa.is_active = true
     GROUP BY ad.date
     ORDER BY ad.date`,
    [teacherId, trustId, startDate, endDate]
  );

  // Get class comparison
  const [comparisonRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      c.class_name,
      AVG(ads.attendance_percentage) as attendance_rate
     FROM user_school_assignments usa
     JOIN classes c ON usa.school_id = c.school_id
     JOIN students st ON c.id = st.class_id
     JOIN attendance_summary ads ON st.id = ads.student_id
     WHERE usa.user_id = ? AND usa.trust_id = ? AND usa.role = 'TEACHER' AND usa.is_active = true
       AND ads.month_year BETWEEN SUBSTRING(?, 1, 7) AND SUBSTRING(?, 1, 7)
     GROUP BY c.id, c.class_name
     ORDER BY attendance_rate DESC`,
    [teacherId, trustId, startDate, endDate]
  );

  return {
    weekly_trends: trendsRows.map(row => ({
      date: row.date,
      attendance_rate: parseFloat(row.attendance_rate) || 0
    })),
    class_comparison: comparisonRows.map(row => ({
      class_name: row.class_name,
      attendance_rate: parseFloat(row.attendance_rate) || 0
    }))
  };
}

// Student Performance for DASH-08-003
export async function getStudentPerformance(teacherId: number, trustId: number, startDate: string, endDate: string) {
  const connection = await dbManager.getTrustConnection(trustId);

  // Get top performers
  const [topRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      st.id as student_id,
      CONCAT(st.first_name, ' ', st.last_name) as student_name,
      c.class_name,
      AVG(ads.attendance_percentage) as attendance_rate
     FROM user_school_assignments usa
     JOIN classes c ON usa.school_id = c.school_id
     JOIN students st ON c.id = st.class_id
     JOIN attendance_summary ads ON st.id = ads.student_id
     WHERE usa.user_id = ? AND usa.trust_id = ? AND usa.role = 'TEACHER' AND usa.is_active = true
       AND ads.month_year BETWEEN SUBSTRING(?, 1, 7) AND SUBSTRING(?, 1, 7)
     GROUP BY st.id, st.first_name, st.last_name, c.class_name
     ORDER BY attendance_rate DESC
     LIMIT 5`,
    [teacherId, trustId, startDate, endDate]
  );

  // Get students needing attention
  const [attentionRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
      st.id as student_id,
      CONCAT(st.first_name, ' ', st.last_name) as student_name,
      c.class_name,
      AVG(ads.attendance_percentage) as attendance_rate
     FROM user_school_assignments usa
     JOIN classes c ON usa.school_id = c.school_id
     JOIN students st ON c.id = st.class_id
     JOIN attendance_summary ads ON st.id = ads.student_id
     WHERE usa.user_id = ? AND usa.trust_id = ? AND usa.role = 'TEACHER' AND usa.is_active = true
       AND ads.month_year BETWEEN SUBSTRING(?, 1, 7) AND SUBSTRING(?, 1, 7)
       AND ads.attendance_percentage < 75
     GROUP BY st.id, st.first_name, st.last_name, c.class_name
     ORDER BY attendance_rate ASC
     LIMIT 5`,
    [teacherId, trustId, startDate, endDate]
  );

  return {
    top_performers: topRows.map(row => ({
      student_id: row.student_id,
      student_name: row.student_name,
      class_name: row.class_name,
      attendance_rate: parseFloat(row.attendance_rate) || 0
    })),
    attention_needed: attentionRows.map(row => ({
      student_id: row.student_id,
      student_name: row.student_name,
      class_name: row.class_name,
      attendance_rate: parseFloat(row.attendance_rate) || 0,
      issues: row.attendance_rate < 50 ? ['Critical attendance'] : ['Low attendance']
    }))
  };
}

// Upcoming Tasks for DASH-08-003
export async function getUpcomingTasks(teacherId: number, trustId: number) {
  // This is a placeholder implementation as we don't have a tasks system yet
  return [
    {
      task_type: 'ATTENDANCE_MARKING',
      description: 'Mark attendance for today\'s classes',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'HIGH' as const
    },
    {
      task_type: 'PROGRESS_REPORT',
      description: 'Submit monthly progress reports',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'MEDIUM' as const
    }
  ];
}