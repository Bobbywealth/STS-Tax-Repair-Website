import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/mysql-schema";

const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.warn(`Missing MySQL environment variables: ${missingVars.join(', ')}`);
  console.warn('Falling back to PostgreSQL if available, or app will fail on DB operations.');
}

const poolConnection = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const mysqlDb = drizzle(poolConnection, { schema, mode: 'default' });
export const mysqlPool = poolConnection;

export async function testMySQLConnection(): Promise<boolean> {
  try {
    const connection = await poolConnection.getConnection();
    await connection.ping();
    connection.release();
    console.log('MySQL connection successful!');
    return true;
  } catch (error) {
    console.error('MySQL connection failed:', error);
    return false;
  }
}

export async function runMySQLMigrations(): Promise<void> {
  let connection;
  try {
    console.log('Starting MySQL migrations...');
    connection = await poolConnection.getConnection();
    const dbName = process.env.MYSQL_DATABASE;

    // Helper to check if a table exists
    const tableExists = async (tableName: string) => {
      const [rows] = await connection!.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [dbName, tableName]
      );
      return Array.isArray(rows) && rows.length > 0;
    };

    // 1. CRITICAL TABLES FIRST (audit_logs, agent_client_assignments)
    try {
      if (!await tableExists('audit_logs')) {
        console.log('Creating audit_logs table...');
        await connection.query(`
          CREATE TABLE audit_logs (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(50),
            resource_id VARCHAR(36),
            user_id VARCHAR(36) NOT NULL,
            user_name VARCHAR(255),
            user_role VARCHAR(20),
            office_id VARCHAR(36),
            client_id VARCHAR(36),
            details JSON,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_audit_logs_action (action),
            INDEX idx_audit_logs_resource (resource_type, resource_id),
            INDEX idx_audit_logs_user (user_id),
            INDEX idx_audit_logs_office (office_id),
            INDEX idx_audit_logs_created (created_at)
          )
        `);
        console.log('audit_logs table created successfully!');
      } else {
        // Add client_id column if missing
        const [clientIdColumn] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'client_id'`,
          [dbName]
        );
        if (Array.isArray(clientIdColumn) && clientIdColumn.length === 0) {
          console.log('Adding client_id column to audit_logs table...');
          await connection.query(`ALTER TABLE audit_logs ADD COLUMN client_id VARCHAR(36) NULL`);
        }
      }
    } catch (err: any) { console.error('Error in audit_logs migration:', err.message); }

    try {
      if (!await tableExists('agent_client_assignments')) {
        console.log('Creating agent_client_assignments table...');
        await connection.query(`
          CREATE TABLE agent_client_assignments (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            agent_id VARCHAR(36) NOT NULL,
            client_id VARCHAR(36) NOT NULL,
            assigned_by VARCHAR(36),
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            INDEX idx_agent_assignments_agent (agent_id),
            INDEX idx_agent_assignments_client (client_id)
          )
        `);
        console.log('agent_client_assignments table created successfully!');
      }
    } catch (err: any) { console.error('Error in agent_client_assignments migration:', err.message); }

    // 2. CORE USER UPDATES
    try {
      const [roleColumn] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`,
        [dbName]
      );
      if (Array.isArray(roleColumn) && roleColumn.length === 0) {
        console.log('Adding role column to users table...');
        await connection.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'client'`);
      }

      const [isActiveColumn] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active'`,
        [dbName]
      );
      if (Array.isArray(isActiveColumn) && isActiveColumn.length === 0) {
        console.log('Adding is_active column to users table...');
        await connection.query(`ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE`);
      }

      const [officeIdColumn] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'office_id'`,
        [dbName]
      );
      if (Array.isArray(officeIdColumn) && officeIdColumn.length === 0) {
        console.log('Adding office_id column to users table...');
        await connection.query(`ALTER TABLE users ADD COLUMN office_id VARCHAR(36) NULL`);
        await connection.query(`ALTER TABLE users ADD INDEX idx_users_office (office_id)`);
      }
      
      const [themePreferenceColumn] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'theme_preference'`,
        [dbName]
      );
      if (Array.isArray(themePreferenceColumn) && themePreferenceColumn.length === 0) {
        await connection.query(`ALTER TABLE users ADD COLUMN theme_preference VARCHAR(10) DEFAULT 'system'`);
      }

      const [passwordHashColumn] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'`,
        [dbName]
      );
      if (Array.isArray(passwordHashColumn) && passwordHashColumn.length === 0) {
        await connection.query(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL`);
      }

      // Add SSN and DOB columns to users table
      const [ssnColumn] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'ssn'`,
        [dbName]
      );
      if (Array.isArray(ssnColumn) && ssnColumn.length === 0) {
        console.log('Adding ssn column to users table...');
        await connection.query(`ALTER TABLE users ADD COLUMN ssn VARCHAR(255) NULL`);
      }

      const [dobColumn] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'date_of_birth'`,
        [dbName]
      );
      if (Array.isArray(dobColumn) && dobColumn.length === 0) {
        console.log('Adding date_of_birth column to users table...');
        await connection.query(`ALTER TABLE users ADD COLUMN date_of_birth VARCHAR(50) NULL`);
      }
    } catch (err: any) { console.error('Error in users table updates:', err.message); }

    // 3. OTHER TABLES
    try {
      if (!await tableExists('offices')) {
        console.log('Creating offices table...');
        await connection.query(`
          CREATE TABLE offices (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(100) UNIQUE,
            address TEXT,
            city VARCHAR(100),
            state VARCHAR(100),
            zip_code VARCHAR(20),
            phone VARCHAR(20),
            email VARCHAR(255),
            default_tax_year INT DEFAULT 2024,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_offices_slug (slug),
            INDEX idx_offices_active (is_active)
          )
        `);
      } else {
        const [defaultTaxYearColumn] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'default_tax_year'`,
          [dbName]
        );
        if (Array.isArray(defaultTaxYearColumn) && defaultTaxYearColumn.length === 0) {
          console.log('Adding default_tax_year column to offices table...');
          await connection.query(`ALTER TABLE offices ADD COLUMN default_tax_year INT DEFAULT 2024`);
        }
      }
    } catch (err: any) { console.error('Error in offices migration:', err.message); }

    try {
      if (!await tableExists('office_branding')) {
        console.log('Creating office_branding table...');
        await connection.query(`
          CREATE TABLE office_branding (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            office_id VARCHAR(36) NOT NULL UNIQUE,
            company_name VARCHAR(255) NULL,
            logo_url VARCHAR(500) NULL,
            logo_object_key VARCHAR(255) NULL,
            primary_color VARCHAR(20) DEFAULT '#1a4d2e',
            secondary_color VARCHAR(20) DEFAULT '#4CAF50',
            accent_color VARCHAR(20) DEFAULT '#22c55e',
            default_theme VARCHAR(10) DEFAULT 'light',
            reply_to_email VARCHAR(255) NULL,
            reply_to_name VARCHAR(255) NULL,
            updated_by_user_id VARCHAR(36) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_office_branding_office (office_id)
          )
        `);
      }
    } catch (err: any) { console.error('Error in office_branding migration:', err.message); }

    try {
      if (!await tableExists('notifications')) {
        console.log('Creating notifications table...');
        await connection.query(`
          CREATE TABLE notifications (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36) NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            resource_type VARCHAR(50),
            resource_id VARCHAR(36),
            link VARCHAR(255),
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_notifications_user (user_id),
            INDEX idx_notifications_read (is_read),
            INDEX idx_notifications_type (type),
            INDEX idx_notifications_created (created_at)
          )
        `);
      }
    } catch (err: any) { console.error('Error in notifications migration:', err.message); }

    try {
      if (!await tableExists('home_page_agents')) {
        console.log('Creating home_page_agents table...');
        await connection.query(`
          CREATE TABLE home_page_agents (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            name VARCHAR(255) NOT NULL,
            title VARCHAR(100) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            email VARCHAR(255) NOT NULL,
            address VARCHAR(500),
            image_url VARCHAR(1000),
            rating DECIMAL(2,1) DEFAULT 5.0,
            sort_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_home_page_agents_active (is_active),
            INDEX idx_home_page_agents_sort (sort_order)
          )
        `);
        await seedDefaultHomePageAgents(connection);
      }
    } catch (err: any) { console.error('Error in home_page_agents migration:', err.message); }

    try {
      if (!await tableExists('tax_filings')) {
        console.log('Creating tax_filings table...');
        await connection.query(`
          CREATE TABLE tax_filings (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            client_id VARCHAR(36) NOT NULL,
            tax_year INT NOT NULL,
            status ENUM('new', 'documents_pending', 'review', 'filed', 'accepted', 'approved', 'paid') DEFAULT 'new',
            documents_received_at TIMESTAMP NULL,
            submitted_at TIMESTAMP NULL,
            accepted_at TIMESTAMP NULL,
            approved_at TIMESTAMP NULL,
            funded_at TIMESTAMP NULL,
            estimated_refund DECIMAL(12,2) NULL,
            actual_refund DECIMAL(12,2) NULL,
            service_fee DECIMAL(12,2) NULL,
            fee_paid BOOLEAN DEFAULT FALSE,
            preparer_id VARCHAR(36) NULL,
            preparer_name VARCHAR(255) NULL,
            office_location VARCHAR(255) NULL,
            filing_type ENUM('individual', 'joint', 'business') DEFAULT 'individual',
            federal_status VARCHAR(50) NULL,
            state_status VARCHAR(50) NULL,
            states_filed TEXT NULL,
            notes TEXT NULL,
            status_history JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tax_filings_client (client_id),
            INDEX idx_tax_filings_year (tax_year),
            INDEX idx_tax_filings_status (status),
            UNIQUE KEY unique_client_year (client_id, tax_year)
          )
        `);
      }
    } catch (err: any) { console.error('Error in tax_filings migration:', err.message); }

    try {
      if (!await tableExists('permissions')) {
        console.log('Creating permissions table...');
        await connection.query(`
          CREATE TABLE permissions (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            slug VARCHAR(100) NOT NULL UNIQUE,
            label VARCHAR(255) NOT NULL,
            description TEXT,
            feature_group VARCHAR(100) NOT NULL,
            sort_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_permissions_group (feature_group),
            INDEX idx_permissions_slug (slug)
          )
        `);
      }
      
      if (!await tableExists('role_permissions')) {
        console.log('Creating role_permissions table...');
        await connection.query(`
          CREATE TABLE role_permissions (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            role VARCHAR(20) NOT NULL,
            permission_id VARCHAR(36) NOT NULL,
            granted BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_role_permissions_role (role),
            INDEX idx_role_permissions_permission (permission_id),
            UNIQUE KEY unique_role_permission (role, permission_id)
          )
        `);
      }
      
      // Always (re)seed idempotently so new permissions/default roles get applied
      // even when tables already exist (INSERT IGNORE prevents duplicates).
      await seedDefaultPermissions(connection);
      await seedDefaultRolePermissions(connection);
    } catch (err: any) { console.error('Error in permissions migration:', err.message); }

    try {
      if (!await tableExists('tasks')) {
        console.log('Creating tasks table...');
        await connection.query(`
          CREATE TABLE tasks (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            title TEXT NOT NULL,
            description TEXT,
            client_id VARCHAR(36),
            client_name TEXT,
            assigned_to_id VARCHAR(36),
            assigned_to TEXT NOT NULL,
            due_date TIMESTAMP NULL,
            priority VARCHAR(20) DEFAULT 'medium',
            status VARCHAR(20) DEFAULT 'todo',
            category VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tasks_assigned (assigned_to_id),
            INDEX idx_tasks_status (status),
            INDEX idx_tasks_client (client_id)
          )
        `);
      }
    } catch (err: any) { console.error('Error in tasks migration:', err.message); }

    try {
      if (!await tableExists('tickets')) {
        console.log('Creating tickets table...');
        await connection.query(`
          CREATE TABLE tickets (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            client_id VARCHAR(36),
            client_name TEXT,
            subject TEXT NOT NULL,
            description TEXT,
            category VARCHAR(50) DEFAULT 'general',
            priority VARCHAR(20) DEFAULT 'medium',
            status VARCHAR(20) DEFAULT 'open',
            assigned_to_id VARCHAR(36),
            assigned_to TEXT,
            resolved_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tickets_client (client_id),
            INDEX idx_tickets_status (status),
            INDEX idx_tickets_assigned (assigned_to_id)
          )
        `);
      }
      
      if (!await tableExists('ticket_messages')) {
        console.log('Creating ticket_messages table...');
        await connection.query(`
          CREATE TABLE ticket_messages (
            id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            ticket_id VARCHAR(36) NOT NULL,
            sender_id VARCHAR(36) NOT NULL,
            sender_name TEXT,
            message TEXT NOT NULL,
            attachments JSON,
            is_internal BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_ticket_messages_ticket (ticket_id),
            INDEX idx_ticket_messages_internal (is_internal)
          )
        `);
      }
    } catch (err: any) { console.error('Error in tickets migration:', err.message); }

    // Check for e_signatures form_data
    try {
      const [esigColumns] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'e_signatures' AND COLUMN_NAME = 'form_data'`,
        [dbName]
      );
      if (Array.isArray(esigColumns) && esigColumns.length === 0) {
        console.log('Adding form_data column to e_signatures table...');
        await connection.query(`ALTER TABLE e_signatures ADD COLUMN form_data JSON NULL`);
      }
    } catch (err: any) { console.error('Error updating e_signatures table:', err.message); }

    // Ensure notification_preferences matches expected schema (older deployments used email_enabled/in_app_enabled)
    try {
      if (await tableExists('notification_preferences')) {
        const desiredColumns: Array<{ name: string; alterSql: string }> = [
          { name: 'email_notifications', alterSql: `ALTER TABLE notification_preferences ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE` },
          { name: 'document_alerts', alterSql: `ALTER TABLE notification_preferences ADD COLUMN document_alerts BOOLEAN DEFAULT TRUE` },
          { name: 'status_notifications', alterSql: `ALTER TABLE notification_preferences ADD COLUMN status_notifications BOOLEAN DEFAULT TRUE` },
          { name: 'message_alerts', alterSql: `ALTER TABLE notification_preferences ADD COLUMN message_alerts BOOLEAN DEFAULT TRUE` },
          { name: 'sms_notifications', alterSql: `ALTER TABLE notification_preferences ADD COLUMN sms_notifications BOOLEAN DEFAULT FALSE` },
          { name: 'updated_at', alterSql: `ALTER TABLE notification_preferences ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` },
        ];

        for (const col of desiredColumns) {
          const [rows] = await connection.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notification_preferences' AND COLUMN_NAME = ?`,
            [dbName, col.name],
          );
          if (Array.isArray(rows) && rows.length === 0) {
            console.log(`Adding ${col.name} column to notification_preferences table...`);
            await connection.query(col.alterSql);
          }
        }

        // Backfill from legacy columns when present
        const [legacyEmail] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notification_preferences' AND COLUMN_NAME = 'email_enabled'`,
          [dbName],
        );
        const [legacyInApp] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notification_preferences' AND COLUMN_NAME = 'in_app_enabled'`,
          [dbName],
        );

        if (Array.isArray(legacyEmail) && legacyEmail.length > 0) {
          await connection.query(
            `UPDATE notification_preferences SET email_notifications = email_enabled WHERE email_enabled IS NOT NULL`,
          );
        }
        if (Array.isArray(legacyInApp) && legacyInApp.length > 0) {
          await connection.query(
            `UPDATE notification_preferences
             SET document_alerts = in_app_enabled,
                 status_notifications = in_app_enabled,
                 message_alerts = in_app_enabled
             WHERE in_app_enabled IS NOT NULL`,
          );
        }
      }
    } catch (err: any) {
      console.error('Error updating notification_preferences table:', err.message);
    }

    // Final catch-all for remaining tables (minimal versions)
    const tablesToCreate: Record<string, string> = {
      'sessions': `CREATE TABLE IF NOT EXISTS sessions (sid VARCHAR(255) PRIMARY KEY, sess LONGTEXT NOT NULL, expire BIGINT NOT NULL, INDEX IDX_session_expire (expire))`,
      'appointments': `CREATE TABLE IF NOT EXISTS appointments (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), client_id VARCHAR(36) NOT NULL, client_name TEXT NOT NULL, title TEXT NOT NULL, description TEXT, appointment_date TIMESTAMP NOT NULL, duration INT DEFAULT 60, status VARCHAR(50) DEFAULT 'scheduled', location TEXT, staff_id VARCHAR(36), staff_name TEXT, notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      'payments': `CREATE TABLE IF NOT EXISTS payments (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), client_id VARCHAR(36) NOT NULL, client_name TEXT NOT NULL, service_fee DECIMAL(10, 2) NOT NULL, amount_paid DECIMAL(10, 2) DEFAULT 0.00, payment_status VARCHAR(50) DEFAULT 'pending', due_date TIMESTAMP, paid_date TIMESTAMP, payment_method VARCHAR(50), notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      'document_versions': `CREATE TABLE IF NOT EXISTS document_versions (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), client_id VARCHAR(36) NOT NULL, document_name TEXT NOT NULL, document_type VARCHAR(50) NOT NULL, file_url TEXT NOT NULL, version INT DEFAULT 1, uploaded_by TEXT NOT NULL, file_size INT, mime_type VARCHAR(100), notes TEXT, uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      'e_signatures': `CREATE TABLE IF NOT EXISTS e_signatures (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), client_id VARCHAR(36) NOT NULL, client_name TEXT NOT NULL, document_name TEXT NOT NULL, document_type VARCHAR(50) DEFAULT 'form_8879', signature_data TEXT, form_data JSON, ip_address VARCHAR(45), user_agent TEXT, signed_at TIMESTAMP, status VARCHAR(50) DEFAULT 'pending', document_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      'email_logs': `CREATE TABLE IF NOT EXISTS email_logs (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), client_id VARCHAR(36), to_email VARCHAR(255) NOT NULL, from_email VARCHAR(255) NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, email_type VARCHAR(50), status VARCHAR(50) DEFAULT 'sent', sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      'document_request_templates': `CREATE TABLE IF NOT EXISTS document_request_templates (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), name TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, document_types JSON, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      'email_verification_tokens': `CREATE TABLE IF NOT EXISTS email_verification_tokens (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), user_id VARCHAR(36) NOT NULL, token VARCHAR(64) NOT NULL UNIQUE, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_email_verification_user (user_id), INDEX idx_email_verification_token (token))`,
      'password_reset_tokens': `CREATE TABLE IF NOT EXISTS password_reset_tokens (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), user_id VARCHAR(36) NOT NULL, token VARCHAR(64) NOT NULL UNIQUE, expires_at TIMESTAMP NOT NULL, used_at TIMESTAMP NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_password_reset_user (user_id), INDEX idx_password_reset_token (token))`,
      'staff_requests': `CREATE TABLE IF NOT EXISTS staff_requests (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(30), role_requested VARCHAR(20) NOT NULL, office_id VARCHAR(36), status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      'notification_preferences': `CREATE TABLE IF NOT EXISTS notification_preferences (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), user_id VARCHAR(36) NOT NULL UNIQUE, email_notifications BOOLEAN DEFAULT TRUE, document_alerts BOOLEAN DEFAULT TRUE, status_notifications BOOLEAN DEFAULT TRUE, message_alerts BOOLEAN DEFAULT TRUE, sms_notifications BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
      'leads': `CREATE TABLE IF NOT EXISTS leads (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), name VARCHAR(255) NOT NULL, email VARCHAR(255), phone VARCHAR(30), status ENUM('new', 'contacted', 'qualified', 'converted', 'lost') DEFAULT 'new', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      'staff_members': `CREATE TABLE IF NOT EXISTS staff_members (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), user_id VARCHAR(36), name TEXT NOT NULL, email VARCHAR(255), is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      'knowledge_base': `CREATE TABLE IF NOT EXISTS knowledge_base (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), title TEXT NOT NULL, content TEXT NOT NULL, category VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      'ai_chat_sessions': `CREATE TABLE IF NOT EXISTS ai_chat_sessions (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), user_id VARCHAR(36) NOT NULL, title TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      'ai_chat_messages': `CREATE TABLE IF NOT EXISTS ai_chat_messages (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), session_id VARCHAR(36) NOT NULL, role ENUM('user', 'assistant', 'system') NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      'ai_document_analysis': `CREATE TABLE IF NOT EXISTS ai_document_analysis (id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), document_id VARCHAR(36) NOT NULL, analysis_type VARCHAR(50) NOT NULL, results JSON NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
    };

    for (const [tName, sql] of Object.entries(tablesToCreate)) {
      try {
        if (!await tableExists(tName)) {
          console.log(`Creating ${tName} table (fallback)...`);
          await connection.query(sql);
        }
      } catch (err: any) { console.error(`Error in ${tName} fallback migration:`, err.message); }
    }

    // Ensure permissions are seeded even if tables were created via fallback section
    try {
      if (await tableExists('permissions') && await tableExists('role_permissions')) {
        await seedDefaultPermissions(connection);
        await seedDefaultRolePermissions(connection);
      }
    } catch (err: any) {
      console.error('Error reseeding permissions after fallback migrations:', err.message);
    }

    console.log('MySQL migrations completed successfully!');
    connection.release();
  } catch (error: any) {
    console.error('Fatal MySQL migration error:', error.message);
    if (connection) connection.release();
  }
}

// Seed default permissions based on DefaultPermissions constant
async function seedDefaultPermissions(connection: mysql.PoolConnection): Promise<void> {
  try {
    const { DefaultPermissions } = await import('@shared/mysql-schema');
    console.log('Seeding default permissions...');
    for (let i = 0; i < DefaultPermissions.length; i++) {
      const perm = DefaultPermissions[i];
      await connection.query(
        `INSERT IGNORE INTO permissions (slug, label, description, feature_group, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [perm.slug, perm.label, perm.description, perm.featureGroup, i]
      );
    }
  } catch (err: any) { console.error('Error seeding permissions:', err.message); }
}

// Seed default role permissions
async function seedDefaultRolePermissions(connection: mysql.PoolConnection): Promise<void> {
  try {
    const { DefaultPermissions } = await import('@shared/mysql-schema');
    console.log('Seeding default role permissions...');
    const [permissions] = await connection.query(`SELECT id, slug FROM permissions`);
    const permissionMap = new Map((permissions as any[]).map(p => [p.slug, p.id]));
    
    for (const perm of DefaultPermissions) {
      const permissionId = permissionMap.get(perm.slug);
      if (!permissionId) continue;
      for (const role of perm.defaultRoles) {
        await connection.query(
          `INSERT IGNORE INTO role_permissions (role, permission_id, granted) VALUES (?, ?, TRUE)`,
          [role, permissionId]
        );
      }
    }
  } catch (err: any) { console.error('Error seeding role permissions:', err.message); }
}

// Seed default homepage agents
async function seedDefaultHomePageAgents(connection: mysql.PoolConnection): Promise<void> {
  try {
    console.log('Seeding default homepage agents...');
    const defaultAgents = [
      { name: "Stephedena Cherfils", title: "Service Support", phone: "954-534-5227", email: "Info.ststax@gmail.com", address: "24 Greenway Plz Suite 1800, Houston, TX 77046, USA", imageUrl: "https://iili.io/fxO48DF.jpg", sortOrder: 1 },
      { name: "Withney Simon", title: "Service Support", phone: "407-427-7619", email: "Withney.ststax@yahoo.com", address: "24 Greenway Plz Suite 1800, Houston, TX 77046, USA", imageUrl: "https://iili.io/fxO4Uog.png", sortOrder: 2 },
      { name: "Keelie Duvignaud", title: "Service Support", phone: "772-877-1588", email: "Taxesbykeys@gmail.com", address: "3181 SW Crenshaw St, Port St. Lucie, FL 34953, USA", imageUrl: "https://www.ststaxrepair.net/wp-content/uploads/2024/12/Keelie-Duvignaud.webp", sortOrder: 3 }
    ];
    for (const agent of defaultAgents) {
      await connection.query(
        `INSERT IGNORE INTO home_page_agents (name, title, phone, email, address, image_url, sort_order, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [agent.name, agent.title, agent.phone, agent.email, agent.address, agent.imageUrl, agent.sortOrder]
      );
    }
  } catch (err: any) { console.error('Error seeding homepage agents:', err.message); }
}
