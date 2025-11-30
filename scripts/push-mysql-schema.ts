import { testMySQLConnection, mysqlPool } from '../server/mysql-db';

const createTablesSQL = `
-- Sessions table for Replit Auth
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL,
  INDEX IDX_session_expire (expire)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  profile_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tax Deadlines table
CREATE TABLE IF NOT EXISTS tax_deadlines (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title TEXT NOT NULL,
  description TEXT,
  deadline_date TIMESTAMP NOT NULL,
  deadline_type VARCHAR(50) NOT NULL,
  tax_year INT NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  notify_days_before INT DEFAULT 7,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  client_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  appointment_date TIMESTAMP NOT NULL,
  duration INT DEFAULT 60,
  status VARCHAR(50) DEFAULT 'scheduled',
  location TEXT,
  staff_id VARCHAR(36),
  staff_name TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  client_name TEXT NOT NULL,
  service_fee DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0.00,
  payment_status VARCHAR(50) DEFAULT 'pending',
  due_date TIMESTAMP,
  paid_date TIMESTAMP,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  document_name TEXT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL,
  version INT DEFAULT 1,
  uploaded_by TEXT NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  notes TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- E-Signatures table
CREATE TABLE IF NOT EXISTS e_signatures (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  client_name TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_type VARCHAR(50) DEFAULT 'form_8879',
  signature_data TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  signed_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  document_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36),
  to_email VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  email_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Request Templates table
CREATE TABLE IF NOT EXISTS document_request_templates (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  document_types JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function main() {
  console.log('Pushing schema to MySQL database...\n');
  
  const connected = await testMySQLConnection();
  if (!connected) {
    console.error('❌ Cannot connect to MySQL database. Check your credentials.');
    process.exit(1);
  }
  
  const connection = await mysqlPool.getConnection();
  
  // Split and execute each CREATE TABLE statement
  const statements = createTablesSQL.split(';').filter(s => s.trim().length > 0);
  
  for (const statement of statements) {
    const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    if (tableName) {
      try {
        await connection.query(statement);
        console.log(`✅ Created/verified table: ${tableName}`);
      } catch (error: any) {
        console.error(`❌ Error with table ${tableName}:`, error.message);
      }
    }
  }
  
  connection.release();
  await mysqlPool.end();
  
  console.log('\n✅ Schema push complete!');
  console.log('Your cPanel MySQL database is now ready to use.');
}

main().catch(console.error);
