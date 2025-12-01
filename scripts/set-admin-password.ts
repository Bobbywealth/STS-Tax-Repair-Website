import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

// Get environment variables
const MYSQL_HOST = process.env.MYSQL_HOST;
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_DATABASE = process.env.MYSQL_DATABASE;
const MYSQL_PORT = Number(process.env.MYSQL_PORT) || 3306;

const ADMIN_EMAIL = 'bobbycraig1293@gmail.com';
const NEW_PASSWORD = 'Admin@2025';

async function setAdminPassword() {
  let connection;
  try {
    console.log('Connecting to MySQL database...');
    console.log(`Host: ${MYSQL_HOST}, Database: ${MYSQL_DATABASE}`);
    
    // Create connection using environment variables
    connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      port: MYSQL_PORT,
      enableKeepAlive: true,
    });

    console.log('Connected to database');

    // Hash the password using bcrypt
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);
    console.log('Password hashed successfully');

    // First check if user exists
    const [users] = await connection.execute(
      `SELECT id, email, role FROM users WHERE email = ?`,
      [ADMIN_EMAIL]
    );

    if (Array.isArray(users) && users.length > 0) {
      const user = users[0] as any;
      console.log(`\nFound user: ${user.email} (ID: ${user.id})`);
      console.log(`Current role: ${user.role}`);

      // Update user with the hashed password and admin role
      const [result] = await connection.execute(
        `UPDATE users SET password_hash = ?, role = 'admin' WHERE email = ?`,
        [passwordHash, ADMIN_EMAIL]
      );

      console.log(`\n✓ Password set for ${ADMIN_EMAIL}`);
      console.log(`✓ Role set to admin`);
      console.log(`✓ Updated ${(result as any).affectedRows} record(s)`);
      console.log('\nAdmin account is ready to use!');
    } else {
      console.log(`\n✗ No user found with email: ${ADMIN_EMAIL}`);
      console.log('Please create the user account first through the registration page.');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n✗ Error setting password:', error.message);
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

setAdminPassword();
