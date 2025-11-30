import { testMySQLConnection, mysqlPool } from '../server/mysql-db';

async function main() {
  console.log('Testing MySQL connection to cPanel database...');
  console.log(`Host: ${process.env.MYSQL_HOST}`);
  console.log(`Database: ${process.env.MYSQL_DATABASE}`);
  console.log(`User: ${process.env.MYSQL_USER}`);
  
  const connected = await testMySQLConnection();
  
  if (connected) {
    console.log('\n✅ MySQL connection successful!');
    console.log('Your Replit app can now connect to your cPanel MySQL database.');
    
    // Try a simple query
    try {
      const connection = await mysqlPool.getConnection();
      const [rows] = await connection.query('SELECT VERSION() as version');
      console.log(`MySQL Version: ${(rows as any)[0].version}`);
      connection.release();
    } catch (error) {
      console.error('Query test failed:', error);
    }
  } else {
    console.log('\n❌ MySQL connection failed.');
    console.log('\nTroubleshooting steps:');
    console.log('1. Verify MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD secrets are set correctly');
    console.log('2. In cPanel Remote MySQL, add "%" to allow all IPs');
    console.log('3. Check if your GoDaddy hosting firewall blocks external connections');
  }
  
  // Close the pool
  await mysqlPool.end();
  process.exit(connected ? 0 : 1);
}

main().catch(console.error);
