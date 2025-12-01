import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ADMIN_EMAIL = 'bobbycraig1293@gmail.com';
const NEW_PASSWORD = 'Admin@2025';

async function setAdminPassword() {
  let connection;
  try {
    // Create connection using environment variables
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || process.env.PGHOST,
      user: process.env.MYSQL_USER || process.env.PGUSER,
      password: process.env.MYSQL_PASSWORD || process.env.PGPASSWORD,
      database: process.env.MYSQL_DATABASE || process.env.PGDATABASE,
      port: process.env.MYSQL_PORT || process.env.PGPORT || 3306,
    });

    // Hash the password
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);
    console.log('Password hashed successfully');

    // Update user with the hashed password
    const [result] = await connection.execute(
      `UPDATE users SET password_hash = ?, role = 'admin' WHERE email = ?`,
      [passwordHash, ADMIN_EMAIL]
    );

    if (result.affectedRows > 0) {
      console.log(`✓ Password set for ${ADMIN_EMAIL}`);
      console.log(`✓ Role set to admin`);
      console.log(`✓ Updated ${result.affectedRows} record(s)`);
    } else {
      console.log(`✗ No user found with email: ${ADMIN_EMAIL}`);
      console.log('Please ensure the user exists in the database first.');
      process.exit(1);
    }

  } catch (error) {
    console.error('Error setting password:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setAdminPassword();
