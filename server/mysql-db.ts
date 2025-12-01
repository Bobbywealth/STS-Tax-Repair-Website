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
    
    // Check if form_data column exists in e_signatures table
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'e_signatures' AND COLUMN_NAME = 'form_data'`,
      [process.env.MYSQL_DATABASE]
    );
    
    if (Array.isArray(columns) && columns.length === 0) {
      console.log('Adding form_data column to e_signatures table...');
      await connection.query(`ALTER TABLE e_signatures ADD COLUMN form_data JSON NULL`);
      console.log('form_data column added successfully!');
    }
    
    connection.release();
  } catch (error) {
    console.error('MySQL migration error:', error);
  }
}
