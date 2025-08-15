-- TRUST DB INIT
CREATE TABLE IF NOT EXISTS schools (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  school_name VARCHAR(200) NOT NULL,
  school_code VARCHAR(20) NOT NULL,
  address TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(15),
  principal_name VARCHAR(255),
  established_year INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_school_code (trust_id, school_code)
);

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(15),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('TRUST_ADMIN','SCHOOL_ADMIN','TEACHER','ACCOUNTANT','PARENT','STUDENT') NOT NULL,
  school_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  employee_id VARCHAR(50),
  designation VARCHAR(100),
  department VARCHAR(100),
  date_of_joining DATE,
  qualification VARCHAR(255),
  address VARCHAR(500),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(15),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_employee_id (trust_id, employee_id),
  INDEX idx_email (email),
  INDEX idx_role (role)
);

CREATE TABLE IF NOT EXISTS fee_heads (
  fee_head_id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  fee_head_name VARCHAR(100) NOT NULL,
  class_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  description VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_receipts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  student_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  mode ENUM('CASH','BANK','UPI','ONLINE') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  school_id INT NOT NULL,
  academic_year_id INT,
  class_name VARCHAR(50) NOT NULL,
  class_code VARCHAR(10) NOT NULL,
  class_order INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_class_code (trust_id, school_id, class_code)
);

CREATE TABLE IF NOT EXISTS sections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  class_id INT NOT NULL,
  section_name VARCHAR(10) NOT NULL,
  capacity INT DEFAULT 40,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS houses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  school_id INT NOT NULL,
  house_name VARCHAR(50) NOT NULL,
  house_color VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_years (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  school_id INT NOT NULL,
  year_name VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  school_id INT NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  subject_code VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_subject_code (school_id, subject_code)
);

CREATE TABLE IF NOT EXISTS class_subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_class_subject (class_id, subject_id)
);

CREATE TABLE IF NOT EXISTS user_school_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  user_id INT NOT NULL,
  school_id INT NOT NULL,
  role ENUM('TRUST_ADMIN','SCHOOL_ADMIN','TEACHER','ACCOUNTANT') NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  start_date DATE NOT NULL,
  end_date DATE,
  permissions JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_school_role (user_id, school_id, role)
);

CREATE TABLE IF NOT EXISTS trust_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  config_key VARCHAR(100) NOT NULL,
  config_value TEXT,
  config_type ENUM('STRING','NUMBER','BOOLEAN','JSON') DEFAULT 'STRING',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_trust_config (trust_id, config_key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  user_id INT,
  activity_id VARCHAR(20),
  event_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity (activity_id),
  INDEX idx_user_time (user_id, created_at),
  INDEX idx_entity (entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  school_id INT NOT NULL,
  admission_number VARCHAR(50) NOT NULL,
  roll_number VARCHAR(20),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender ENUM('MALE','FEMALE','OTHER'),
  class_id INT,
  section_id INT,
  house_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_admission_number (trust_id, school_id, admission_number)
);

CREATE TABLE IF NOT EXISTS admissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  student_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  application_date DATE NOT NULL,
  admission_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  entity_type ENUM('STUDENT','USER','SCHOOL') NOT NULL,
  entity_id INT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_structures (
  fee_structure_id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  fee_head_id INT NOT NULL,
  class_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_installments (
  installment_id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  fee_structure_id INT NOT NULL,
  installment_name VARCHAR(50) NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_fee_assignments (
  assignment_id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  student_id INT NOT NULL,
  fee_structure_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  balance_amount DECIMAL(10,2) NOT NULL,
  special_instructions VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_discount_logs (
  discount_log_id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  student_fee_assignment_id INT NOT NULL,
  discount_type ENUM('PERCENTAGE','FIXED_AMOUNT','SIBLING','SCHOLARSHIP') NOT NULL,
  discount_percentage DECIMAL(5,2),
  discount_amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  approved_by INT NOT NULL,
  valid_until DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_service_assignments (
  service_assignment_id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  student_id INT NOT NULL,
  service_type ENUM('TRANSPORT','LIBRARY','LAB','SPORTS','MEALS') NOT NULL,
  monthly_fee DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  route_details VARCHAR(255),
  total_months INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_applications (
  leave_application_id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  student_id INT NOT NULL,
  leave_type ENUM('SICK','CASUAL','EMERGENCY','FAMILY','OTHER') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  reason TEXT NOT NULL,
  applied_by INT NOT NULL,
  contact_number VARCHAR(15),
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  application_date DATE NOT NULL,
  approved_by INT,
  approval_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_documents (
  document_id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  leave_application_id INT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_parents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  student_id INT NOT NULL,
  parent_user_id INT NOT NULL,
  relationship ENUM('FATHER','MOTHER','GUARDIAN') NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_transfers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  student_id INT NOT NULL,
  from_school_id INT NOT NULL,
  to_school_id INT NOT NULL,
  transfer_date DATE NOT NULL,
  reason TEXT,
  status ENUM('PENDING','APPROVED','COMPLETED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_daily (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('PRESENT','ABSENT','LATE','HALF_DAY') NOT NULL,
  marked_by INT,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_student_date (student_id, date)
);

CREATE TABLE IF NOT EXISTS attendance_summary (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  student_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  total_days INT NOT NULL DEFAULT 0,
  present_days INT NOT NULL DEFAULT 0,
  absent_days INT NOT NULL DEFAULT 0,
  late_days INT NOT NULL DEFAULT 0,
  half_days INT NOT NULL DEFAULT 0,
  attendance_percentage DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_student_month (student_id, month_year)
);

CREATE TABLE IF NOT EXISTS payment_gateway_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  fee_receipt_id BIGINT,
  gateway_name VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100),
  gateway_transaction_id VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('INITIATED','SUCCESS','FAILED','CANCELLED') NOT NULL,
  gateway_response JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS communication_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  template_type ENUM('EMAIL','SMS','WHATSAPP','IN_APP') NOT NULL,
  subject VARCHAR(200),
  content TEXT NOT NULL,
  variables JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS communication_campaigns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  campaign_name VARCHAR(200) NOT NULL,
  template_id INT NOT NULL,
  target_audience ENUM('ALL_USERS','STUDENTS','PARENTS','TEACHERS','ADMINS') NOT NULL,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  status ENUM('DRAFT','SCHEDULED','SENT','FAILED') DEFAULT 'DRAFT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS communication_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  campaign_id INT,
  recipient_type ENUM('EMAIL','SMS','WHATSAPP') NOT NULL,
  recipient_address VARCHAR(255) NOT NULL,
  subject VARCHAR(200),
  content TEXT NOT NULL,
  status ENUM('PENDING','SENT','DELIVERED','FAILED') DEFAULT 'PENDING',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  report_name VARCHAR(200) NOT NULL,
  report_type ENUM('STUDENT_PROFILE','FEE_COLLECTION','ATTENDANCE','ACADEMIC_PERFORMANCE','CUSTOM') NOT NULL,
  filters JSON,
  generated_by INT NOT NULL,
  file_path VARCHAR(500),
  status ENUM('GENERATING','COMPLETED','FAILED') DEFAULT 'GENERATING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_exports (
  export_id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  report_id INT NOT NULL,
  export_format ENUM('PDF','EXCEL','CSV') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  template_type ENUM('STUDENT_PROFILE','FEE_COLLECTION','ATTENDANCE','ACADEMIC_PERFORMANCE') NOT NULL,
  query_template TEXT NOT NULL,
  column_mappings JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
