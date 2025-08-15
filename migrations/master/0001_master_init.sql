-- MASTER DB INIT
CREATE TABLE IF NOT EXISTS system_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT,
  config_key VARCHAR(100) NOT NULL,
  config_value TEXT,
  config_type ENUM('STRING','NUMBER','BOOLEAN','JSON') DEFAULT 'STRING',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_trust_config (trust_id, config_key)
);

CREATE TABLE IF NOT EXISTS trusts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_name VARCHAR(200) NOT NULL,
  trust_code VARCHAR(20) NOT NULL UNIQUE,
  subdomain VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(15),
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('SYSTEM_ADMIN','GROUP_ADMIN') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS migration_versions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT,
  migration_version VARCHAR(20) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('PENDING','SUCCESS','FAILED') DEFAULT 'SUCCESS',
  INDEX (trust_id, migration_version)
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  user_id INT,
  trust_id INT,
  expires BIGINT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  data TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_expires (expires),
  INDEX idx_expires_at (expires_at),
  INDEX idx_user (user_id)
);

CREATE TABLE IF NOT EXISTS system_audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT, 
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
