import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const MYSQL_HOST = process.env.MYSQL_HOST;
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_DATABASE = process.env.MYSQL_DATABASE;
const MYSQL_PORT = Number(process.env.MYSQL_PORT) || 3306;

const ADMIN_EMAIL = 'admin@ststaxrepair.org';
const ADMIN_PASSWORD = 'AdminTest123!';
const FIRST_NAME = 'System';
const LAST_NAME = 'Administrator';

async function createAdminUser() {
  let connection;
  try {
    console.log('Connecting to MySQL database...');
    console.log(`Host: ${MYSQL_HOST}, Database: ${MYSQL_DATABASE}`);
    
    connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      port: MYSQL_PORT,
      enableKeepAlive: true,
    });

    console.log('Connected to database');

    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    console.log('Password hashed successfully');

    const [existingUsers] = await connection.execute(
      `SELECT id, email, role FROM users WHERE email = ?`,
      [ADMIN_EMAIL]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      const user = existingUsers[0] as any;
      console.log(`\nUser already exists: ${user.email} (ID: ${user.id})`);
      console.log('Updating password and ensuring admin role...');
      
      await connection.execute(
        `UPDATE users SET password_hash = ?, role = 'admin', first_name = ?, last_name = ?, email_verified_at = NOW() WHERE email = ?`,
        [passwordHash, FIRST_NAME, LAST_NAME, ADMIN_EMAIL]
      );
      
      console.log(`\n✓ Password updated for ${ADMIN_EMAIL}`);
      console.log(`✓ Role set to admin`);
    } else {
      console.log('\nCreating new admin user...');
      
      const userId = randomUUID();
      
      await connection.execute(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'admin', 1, NOW(), NOW(), NOW())`,
        [userId, ADMIN_EMAIL, passwordHash, FIRST_NAME, LAST_NAME]
      );
      
      console.log(`\n✓ Admin user created successfully!`);
      console.log(`  ID: ${userId}`);
      console.log(`  Email: ${ADMIN_EMAIL}`);
      console.log(`  Role: admin`);
    }

    console.log('\n========================================');
    console.log('ADMIN ACCOUNT READY!');
    console.log('========================================');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`Role: admin`);
    console.log('========================================');

  } catch (error: any) {
    console.error('\n✗ Error:', error.message);
    if (error.code) {
      console.error(`  Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createAdminUser();
