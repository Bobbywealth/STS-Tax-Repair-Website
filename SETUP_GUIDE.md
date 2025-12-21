# Document Upload Setup Guide

## Issue
Document uploads are not working because the FTP credentials are missing from the environment configuration.

## Required Environment Variables

Since your application is deployed on ststaxrepair.org (not on Replit), it uses FTP for document storage. You need to configure the following environment variables on your server:

```bash
# FTP Configuration (GoDaddy)
FTP_HOST=198.12.220.248
FTP_USER=i28qwzd7d2dt
FTP_PASSWORD=your_ftp_password_here  # Set this to your actual FTP password
FTP_PORT=22  # Use SFTP on port 22 (recommended)
```

## Setup Steps

### 1. Get FTP Password
- Log into your GoDaddy cPanel
- Navigate to FTP Accounts
- Reset the password for user `i28qwzd7d2dt` or create a new FTP user
- Note down the password

### 2. Configure Environment Variables

#### For Local Development:
Create a `.env` file in the root directory with:
```bash
FTP_HOST=198.12.220.248
FTP_USER=i28qwzd7d2dt
FTP_PASSWORD=your_actual_password_here
FTP_PORT=21
```

#### For Production (ststaxrepair.org):
Add these environment variables to your hosting platform:
- If using a hosting control panel, look for "Environment Variables" or "Configuration"
- If using PM2, add them to your ecosystem.config.js
- If using systemd, add them to your service file

### 3. Verify FTP Connection
Test the FTP connection using the test script:
```bash
node scripts/test-ftp-connection.js
```

### 4. Restart the Application
After adding the environment variables, restart your Node.js application for the changes to take effect.

## Security Fix Applied
The `/api/objects/upload` endpoint now requires authentication, preventing unauthorized access.

## Alternative Solutions

If FTP setup is not possible, consider:
1. **Local Storage**: Store files on the server's local filesystem (not recommended for production)
2. **Cloud Storage**: Migrate to AWS S3, Google Cloud Storage, or similar services
3. **Replit Deployment**: Deploy on Replit which has built-in object storage

## Testing
After configuration:
1. Log into the application
2. Navigate to a client's detail page
3. Go to the Documents tab
4. Try uploading a document
5. Check the server logs for any error messages

## Troubleshooting

If uploads still fail after configuration:
1. Check server logs for FTP connection errors
2. Verify FTP credentials are correct
3. Ensure FTP port 21 is not blocked by firewall
4. Test FTP connection manually using an FTP client