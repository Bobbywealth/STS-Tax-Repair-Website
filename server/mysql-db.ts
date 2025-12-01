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
    
    connection.release();
  } catch (error) {
    console.error('MySQL migration error:', error);
  }
}
