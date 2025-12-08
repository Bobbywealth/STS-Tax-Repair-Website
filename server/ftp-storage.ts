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
      
      console.log(`[FTP] Preparing to upload file:`);
      console.log(`[FTP]   - Client ID: ${clientId}`);
      console.log(`[FTP]   - Original filename: ${fileName}`);
      console.log(`[FTP]   - Sanitized filename: ${uniqueFileName}`);
      console.log(`[FTP]   - Remote directory: ${remoteDirPath}`);
      console.log(`[FTP]   - File size: ${fileBuffer.length} bytes`);
      
      // Navigate to the target directory (this also creates it if needed)
      await this.ensureDirectory(client, remoteDirPath);
      
      // We're now IN the target directory, so just upload with the filename
      const pwdAfterMkdir = await client.pwd();
      console.log(`[FTP] Current directory after ensureDirectory: ${pwdAfterMkdir}`);
      console.log(`[FTP] Uploading file as: ${uniqueFileName} (filename only, since we're in the target dir)`);
      
      const stream = Readable.from(fileBuffer);
      // Upload using just the filename since we're already in the target directory
      const uploadResponse = await client.uploadFrom(stream, uniqueFileName);
      
      console.log(`[FTP] Upload response code: ${uploadResponse.code}`);
      console.log(`[FTP] Upload response message: ${uploadResponse.message}`);
      
      // Verify file exists after upload
      try {
        const fileSize = await client.size(uniqueFileName);
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

  async streamFileToResponse(filePath: string, res: any, documentName: string): Promise<boolean> {
    const client = await this.getClient();
    
    try {
      let fullPath = `${BASE_PATH}/${filePath}`;
      console.log(`[FTP-STREAM] Relative path: ${filePath}`);
      console.log(`[FTP-STREAM] Full path: ${fullPath}`);
      
      // Get file size first
      let fileSize: number;
      try {
        fileSize = await client.size(fullPath);
        console.log(`[FTP-STREAM] SUCCESS! File size: ${fileSize} bytes`);
      } catch (sizeError: any) {
        console.error(`[FTP-STREAM] FAILED - File not found at: ${fullPath}`);
        console.error(`[FTP-STREAM] Error details:`, sizeError.message);
        
        // Try alternate paths for Perfex migration compatibility
        let foundPath = false;
        
        // Pattern 1: If path is uploads/customers/{id}/..., try uploads/clients/perfex-{id}/...
        if (filePath.includes('uploads/customers/')) {
          const match = filePath.match(/uploads\/customers\/(\d+)\/(.*)/);
          if (match) {
            const perfexId = match[1];
            const filename = match[2];
            const alternatePath = `uploads/clients/perfex-${perfexId}/${filename}`;
            fullPath = `${BASE_PATH}/${alternatePath}`;
            console.log(`[FTP-STREAM] Trying Perfex path (customers→clients/perfex-): ${fullPath}`);
            try {
              fileSize = await client.size(fullPath);
              console.log(`[FTP-STREAM] Found at Perfex path! File size: ${fileSize} bytes`);
              foundPath = true;
            } catch (altError: any) {
              console.error(`[FTP-STREAM] Perfex path failed: ${fullPath} - ${altError.message}`);
            }
          }
          
          // Pattern 2: Try without perfex- prefix (fallback for non-prefixed folders)
          if (!foundPath) {
            const alternatePath = filePath.replace('uploads/customers/', 'uploads/clients/');
            fullPath = `${BASE_PATH}/${alternatePath}`;
            console.log(`[FTP-STREAM] Trying simple customers→clients: ${fullPath}`);
            try {
              fileSize = await client.size(fullPath);
              console.log(`[FTP-STREAM] Found at simple path! File size: ${fileSize} bytes`);
              foundPath = true;
            } catch (altError: any) {
              console.error(`[FTP-STREAM] Simple path also failed: ${fullPath} - ${altError.message}`);
            }
          }
        } 
        
        // Pattern 3: If path is uploads/clients/{id}/... (without perfex-), try with perfex- prefix
        if (!foundPath && filePath.includes('uploads/clients/')) {
          const match = filePath.match(/uploads\/clients\/(\d+)\/(.*)/);
          if (match) {
            const perfexId = match[1];
            const filename = match[2];
            const alternatePath = `uploads/clients/perfex-${perfexId}/${filename}`;
            fullPath = `${BASE_PATH}/${alternatePath}`;
            console.log(`[FTP-STREAM] Trying to add perfex- prefix: ${fullPath}`);
            try {
              fileSize = await client.size(fullPath);
              console.log(`[FTP-STREAM] Found with perfex- prefix! File size: ${fileSize} bytes`);
              foundPath = true;
            } catch (altError: any) {
              console.error(`[FTP-STREAM] Perfex prefix also failed: ${fullPath} - ${altError.message}`);
            }
          }
        }
        
        if (!foundPath) {
          console.error(`[FTP-STREAM] All alternate paths failed for: ${filePath}`);
          client.close();
          return false;
        }
      }
      
      // Determine content type from filename
      const ext = documentName.toLowerCase().split('.').pop() || '';
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'txt': 'text/plain',
      };
      
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      // Set response headers before streaming
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileSize);
      
      // Inline viewing for PDFs and images
      if (['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(documentName)}"`);
      } else {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(documentName)}"`);
      }
      
      // Stream directly from FTP to HTTP response using PassThrough
      const { PassThrough } = require('stream');
      const passThrough = new PassThrough();
      
      // Pipe the PassThrough stream to the response
      passThrough.pipe(res);
      
      // Download directly to the PassThrough stream (which pipes to res)
      await client.downloadTo(passThrough, fullPath);
      
      console.log(`[FTP] Streaming complete for: ${fullPath}`);
      return true;
    } catch (error) {
      console.error(`[FTP] Stream failed:`, error);
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

  // List files in a directory on FTP server (for debugging)
  async listDirectory(dirPath: string): Promise<{ name: string; type: string; size: number }[]> {
    const client = await this.getClient();
    
    try {
      const fullPath = `${BASE_PATH}/${dirPath}`;
      console.log(`[FTP] Listing directory: ${fullPath}`);
      
      const list = await client.list(fullPath);
      return list.map(item => ({
        name: item.name,
        type: item.isDirectory ? 'directory' : 'file',
        size: item.size
      }));
    } catch (error) {
      console.error(`[FTP] Error listing directory:`, error);
      throw error;
    } finally {
      client.close();
    }
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
