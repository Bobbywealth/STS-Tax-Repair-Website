import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

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
  try {
    const connection = await poolConnection.getConnection();
    const dbName = process.env.MYSQL_DATABASE;
    
    // Check if form_data column exists in e_signatures table
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'e_signatures' AND COLUMN_NAME = 'form_data'`,
      [dbName]
    );
    
    if (Array.isArray(columns) && columns.length === 0) {
      console.log('Adding form_data column to e_signatures table...');
      await connection.query(`ALTER TABLE e_signatures ADD COLUMN form_data JSON NULL`);
      console.log('form_data column added successfully!');
    }
    
    // Add role and is_active columns to users table
    const [roleColumn] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`,
      [dbName]
    );
    
    if (Array.isArray(roleColumn) && roleColumn.length === 0) {
      console.log('Adding role column to users table...');
      await connection.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'client'`);
      console.log('role column added successfully!');
    }
    
    const [isActiveColumn] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active'`,
      [dbName]
    );
    
    if (Array.isArray(isActiveColumn) && isActiveColumn.length === 0) {
      console.log('Adding is_active column to users table...');
      await connection.query(`ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE`);
      console.log('is_active column added successfully!');
    }
    
    const [lastLoginColumn] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_at'`,
      [dbName]
    );
    
    if (Array.isArray(lastLoginColumn) && lastLoginColumn.length === 0) {
      console.log('Adding last_login_at column to users table...');
      await connection.query(`ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL`);
      console.log('last_login_at column added successfully!');
    }
    
    const [passwordHashColumn] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'`,
      [dbName]
    );
    
    if (Array.isArray(passwordHashColumn) && passwordHashColumn.length === 0) {
      console.log('Adding password_hash column to users table...');
      await connection.query(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL`);
      console.log('password_hash column added successfully!');
    }
    
    // Create role_audit_log table
    const [roleAuditTable] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'role_audit_log'`,
      [dbName]
    );
    
    if (Array.isArray(roleAuditTable) && roleAuditTable.length === 0) {
      console.log('Creating role_audit_log table...');
      await connection.query(`
        CREATE TABLE role_audit_log (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          user_id VARCHAR(36) NOT NULL,
          user_name TEXT,
          previous_role VARCHAR(20),
          new_role VARCHAR(20) NOT NULL,
          changed_by_id VARCHAR(36) NOT NULL,
          changed_by_name TEXT,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('role_audit_log table created successfully!');
    }
    
    // Create staff_invites table
    const [staffInvitesTable] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'staff_invites'`,
      [dbName]
    );
    
    if (Array.isArray(staffInvitesTable) && staffInvitesTable.length === 0) {
      console.log('Creating staff_invites table...');
      await connection.query(`
        CREATE TABLE staff_invites (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          email VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL,
          invite_code VARCHAR(64) NOT NULL UNIQUE,
          invited_by_id VARCHAR(36) NOT NULL,
          invited_by_name TEXT,
          expires_at TIMESTAMP NOT NULL,
          used_at TIMESTAMP NULL,
          used_by_id VARCHAR(36),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('staff_invites table created successfully!');
    }
    
    // Create permissions table
    const [permissionsTable] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'permissions'`,
      [dbName]
    );
    
    if (Array.isArray(permissionsTable) && permissionsTable.length === 0) {
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
      console.log('permissions table created successfully!');
      
      // Seed default permissions
      await seedDefaultPermissions(connection);
    }
    
    // Create role_permissions table
    const [rolePermissionsTable] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'role_permissions'`,
      [dbName]
    );
    
    if (Array.isArray(rolePermissionsTable) && rolePermissionsTable.length === 0) {
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
      console.log('role_permissions table created successfully!');
      
      // Seed default role permissions
      await seedDefaultRolePermissions(connection);
    }
    
    // Create tax_filings table for per-year tax filing tracking
    const [taxFilingsTable] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tax_filings'`,
      [dbName]
    );
    
    if (Array.isArray(taxFilingsTable) && taxFilingsTable.length === 0) {
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
      console.log('tax_filings table created successfully!');
    }
    
    // Create password_reset_tokens table
    const [passwordResetTable] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'password_reset_tokens'`,
      [dbName]
    );
    
    if (Array.isArray(passwordResetTable) && passwordResetTable.length === 0) {
      console.log('Creating password_reset_tokens table...');
      await connection.query(`
        CREATE TABLE password_reset_tokens (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          user_id VARCHAR(36) NOT NULL,
          token VARCHAR(64) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          used_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_password_reset_user (user_id),
          INDEX idx_password_reset_token (token),
          INDEX idx_password_reset_expires (expires_at)
        )
      `);
      console.log('password_reset_tokens table created successfully!');
    }
    
    connection.release();
  } catch (error) {
    console.error('MySQL migration error:', error);
  }
}

// Seed default permissions based on DefaultPermissions constant
async function seedDefaultPermissions(connection: mysql.PoolConnection): Promise<void> {
  const { DefaultPermissions } = await import('@shared/mysql-schema');
  
  console.log('Seeding default permissions...');
  for (let i = 0; i < DefaultPermissions.length; i++) {
    const perm = DefaultPermissions[i];
    await connection.query(
      `INSERT INTO permissions (slug, label, description, feature_group, sort_order) VALUES (?, ?, ?, ?, ?)`,
      [perm.slug, perm.label, perm.description, perm.featureGroup, i]
    );
  }
  console.log(`Seeded ${DefaultPermissions.length} permissions successfully!`);
}

// Seed default role permissions
async function seedDefaultRolePermissions(connection: mysql.PoolConnection): Promise<void> {
  const { DefaultPermissions } = await import('@shared/mysql-schema');
  
  console.log('Seeding default role permissions...');
  
  // Get all permission IDs
  const [permissions] = await connection.query(`SELECT id, slug FROM permissions`);
  const permissionMap = new Map((permissions as any[]).map(p => [p.slug, p.id]));
  
  let count = 0;
  for (const perm of DefaultPermissions) {
    const permissionId = permissionMap.get(perm.slug);
    if (!permissionId) continue;
    
    for (const role of perm.defaultRoles) {
      await connection.query(
        `INSERT INTO role_permissions (role, permission_id, granted) VALUES (?, ?, TRUE)`,
        [role, permissionId]
      );
      count++;
    }
  }
  console.log(`Seeded ${count} role permissions successfully!`);
}
