import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

const perfexPoolConnection = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: 'perfexcrm',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const perfexPool = perfexPoolConnection;

export async function testPerfexConnection(): Promise<boolean> {
  try {
    const connection = await perfexPoolConnection.getConnection();
    await connection.ping();
    connection.release();
    console.log('Perfex CRM database connection successful!');
    return true;
  } catch (error) {
    console.error('Perfex CRM database connection failed:', error);
    return false;
  }
}

export async function getPerfexTables(): Promise<string[]> {
  try {
    const [rows] = await perfexPoolConnection.query('SHOW TABLES');
    return (rows as any[]).map(row => Object.values(row)[0] as string);
  } catch (error) {
    console.error('Failed to get Perfex tables:', error);
    return [];
  }
}

export async function describePerfexTable(tableName: string): Promise<any[]> {
  try {
    const [rows] = await perfexPoolConnection.query(`DESCRIBE ${tableName}`);
    return rows as any[];
  } catch (error) {
    console.error(`Failed to describe table ${tableName}:`, error);
    return [];
  }
}

export async function queryPerfex(sql: string, params: any[] = []): Promise<any[]> {
  try {
    const [rows] = await perfexPoolConnection.query(sql, params);
    return rows as any[];
  } catch (error) {
    console.error('Perfex query failed:', error);
    throw error;
  }
}
