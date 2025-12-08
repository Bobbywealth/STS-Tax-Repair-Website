import * as ftp from 'basic-ftp';
import { Readable } from 'stream';

const FTP_HOST = process.env.FTP_HOST || '';
const FTP_USER = process.env.FTP_USER || '';
const FTP_PASSWORD = process.env.FTP_PASSWORD || '';
const FTP_PORT = parseInt(process.env.FTP_PORT || '21');

// The FTP user lands in /home/i28qwzd7d2dt/ so paths are relative to that
const BASE_PATH = 'public_html/ststaxrepair.org';
const UPLOADS_DIR = 'uploads/clients';

export class FTPStorageService {
  private async getClient(): Promise<ftp.Client> {
    const client = new ftp.Client();
    client.ftp.verbose = true; // Enable verbose logging
    
    if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
      throw new Error('FTP credentials not configured. Set FTP_HOST, FTP_USER, and FTP_PASSWORD environment variables.');
    }
    
    console.log(`[FTP] Connecting to ${FTP_HOST}:${FTP_PORT} as ${FTP_USER}...`);
    
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      port: FTP_PORT,
      secure: false,
    });
    
    // Log the current working directory after login
    const pwd = await client.pwd();
    console.log(`[FTP] Connected successfully. Current directory: ${pwd}`);
    
    return client;
  }

  async uploadFile(
    clientId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType?: string
  ): Promise<{ filePath: string; fileUrl: string }> {
    const client = await this.getClient();
    
    try {
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
      
      // Use relative path from FTP home directory
      const remoteDirPath = `${BASE_PATH}/${UPLOADS_DIR}/${clientId}`;
      const remoteFilePath = `${remoteDirPath}/${uniqueFileName}`;
      
      console.log(`[FTP] Preparing to upload file:`);
      console.log(`[FTP]   - Client ID: ${clientId}`);
      console.log(`[FTP]   - Original filename: ${fileName}`);
      console.log(`[FTP]   - Sanitized filename: ${uniqueFileName}`);
      console.log(`[FTP]   - Remote directory: ${remoteDirPath}`);
      console.log(`[FTP]   - Remote file path: ${remoteFilePath}`);
      console.log(`[FTP]   - File size: ${fileBuffer.length} bytes`);
      
      await this.ensureDirectory(client, remoteDirPath);
      
      // Verify we're in the right directory
      const pwdAfterMkdir = await client.pwd();
      console.log(`[FTP] Current directory after ensureDirectory: ${pwdAfterMkdir}`);
      
      const stream = Readable.from(fileBuffer);
      const uploadResponse = await client.uploadFrom(stream, remoteFilePath);
      
      console.log(`[FTP] Upload response code: ${uploadResponse.code}`);
      console.log(`[FTP] Upload response message: ${uploadResponse.message}`);
      
      // Verify file exists after upload
      try {
        const fileSize = await client.size(remoteFilePath);
        console.log(`[FTP] Verified file exists with size: ${fileSize} bytes`);
      } catch (verifyError) {
        console.error(`[FTP] WARNING: Could not verify file after upload:`, verifyError);
      }
      
      const relativeFilePath = `${UPLOADS_DIR}/${clientId}/${uniqueFileName}`;
      const fileUrl = `/ftp/${relativeFilePath}`;
      
      console.log(`[FTP] Successfully uploaded. Returning fileUrl: ${fileUrl}`);
      
      return {
        filePath: relativeFilePath,
        fileUrl,
      };
    } catch (uploadError) {
      console.error(`[FTP] Upload failed with error:`, uploadError);
      throw uploadError;
    } finally {
      client.close();
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    const client = await this.getClient();
    
    try {
      const fullPath = `${BASE_PATH}/${filePath}`;
      await client.remove(fullPath);
      console.log(`[FTP] Deleted file: ${fullPath}`);
      return true;
    } catch (error) {
      console.error(`[FTP] Failed to delete file:`, error);
      return false;
    } finally {
      client.close();
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    const client = await this.getClient();
    
    try {
      const fullPath = `${BASE_PATH}/${filePath}`;
      const fileSize = await client.size(fullPath);
      return fileSize > 0;
    } catch {
      return false;
    } finally {
      client.close();
    }
  }

  private async ensureDirectory(client: ftp.Client, dirPath: string): Promise<void> {
    const parts = dirPath.split('/').filter(p => p);
    let currentPath = '';
    
    for (const part of parts) {
      currentPath += '/' + part;
      try {
        await client.cd(currentPath);
      } catch {
        try {
          await client.send(`MKD ${currentPath}`);
          console.log(`[FTP] Created directory: ${currentPath}`);
        } catch (mkdError: any) {
          if (!mkdError.message?.includes('550') && !mkdError.message?.includes('exists')) {
            throw mkdError;
          }
        }
      }
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 200);
  }

  getPublicUrl(filePath: string): string {
    // Files are in public_html, so they're directly accessible via the domain
    // Encode each path segment to handle special characters in filenames
    const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
    return `https://ststaxrepair.org/${encodedPath}`;
  }

  getDirectUrl(filePath: string): string {
    const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
    return `https://ststaxrepair.org/${encodedPath}`;
  }
}

export const ftpStorageService = new FTPStorageService();
