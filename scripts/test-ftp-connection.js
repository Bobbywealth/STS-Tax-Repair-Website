#!/usr/bin/env node

const ftp = require('basic-ftp');
require('dotenv').config();

async function testFTPConnection() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  console.log('Testing FTP Connection...');
  console.log('------------------------');
  
  const FTP_HOST = process.env.FTP_HOST;
  const FTP_USER = process.env.FTP_USER;
  const FTP_PASSWORD = process.env.FTP_PASSWORD;
  const FTP_PORT = parseInt(process.env.FTP_PORT || '21');

  // Check if credentials are configured
  if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
    console.error('❌ FTP credentials not configured!');
    console.error('Missing environment variables:');
    if (!FTP_HOST) console.error('  - FTP_HOST');
    if (!FTP_USER) console.error('  - FTP_USER');
    if (!FTP_PASSWORD) console.error('  - FTP_PASSWORD');
    console.error('\nPlease set these in your .env file or environment.');
    process.exit(1);
  }

  console.log(`Host: ${FTP_HOST}`);
  console.log(`User: ${FTP_USER}`);
  console.log(`Port: ${FTP_PORT}`);
  console.log(`Password: ${'*'.repeat(FTP_PASSWORD.length)}`);
  console.log('');

  try {
    console.log('Connecting to FTP server...');
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      port: FTP_PORT,
      secure: false,
      secureOptions: { rejectUnauthorized: false }
    });
    
    console.log('✅ Successfully connected to FTP server!');
    
    // List root directory
    console.log('\nListing root directory:');
    const list = await client.list('/');
    console.log(`Found ${list.length} items:`);
    list.slice(0, 5).forEach(item => {
      console.log(`  - ${item.name} (${item.type})`);
    });
    if (list.length > 5) {
      console.log(`  ... and ${list.length - 5} more items`);
    }
    
    // Check if documents directory exists
    console.log('\nChecking for documents directory...');
    const documentsExists = list.some(item => item.name === 'documents' && item.type === 2);
    if (documentsExists) {
      console.log('✅ Documents directory exists');
    } else {
      console.log('⚠️  Documents directory not found - it will be created on first upload');
    }
    
  } catch (error) {
    console.error('❌ FTP connection failed!');
    console.error('Error:', error.message);
    
    if (error.code === 530) {
      console.error('\n💡 This usually means incorrect username or password.');
      console.error('   Please check your FTP credentials in GoDaddy cPanel.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused. Check if:');
      console.error('   - FTP_HOST is correct');
      console.error('   - Port 21 is open on the server');
      console.error('   - Firewall is not blocking the connection');
    }
    
    process.exit(1);
  } finally {
    client.close();
  }
  
  console.log('\n✅ FTP test completed successfully!');
  console.log('Document uploads should work once the application is restarted.');
}

testFTPConnection().catch(console.error);