import * as ftp from 'basic-ftp';
import { Readable, PassThrough } from 'stream';

const FTP_HOST = process.env.FTP_HOST || '';
const FTP_USER = process.env.FTP_USER || '';
const FTP_PASSWORD = process.env.FTP_PASSWORD || '';
const FTP_PORT = parseInt(process.env.FTP_PORT || '21');

// Overall timeout for FTP operations (60 seconds)
const FTP_OPERATION_TIMEOUT = 60000;

// Debug: Log FTP config at startup
console.log(`[FTP-CONFIG] FTP_HOST="${FTP_HOST}", FTP_USER="${FTP_USER}", FTP_PORT=${FTP_PORT}`);

// Helper function to wrap any async operation with a timeout (properly cleans up timer)
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`[FTP] ${operationName} timed out after ${timeoutMs / 1000} seconds`));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

// The FTP user lands in /home/i28qwzd7d2dt/ so paths are relative to that
// ststaxrepair.org is a folder directly in home, NOT inside public_html
const BASE_PATH = 'ststaxrepair.org';
const UPLOADS_DIR = 'uploads/clients';

export class FTPStorageService {
  private async getClient(): Promise<ftp.Client> {
    const client = new ftp.Client(30000); // 30 second timeout for operations
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
    // Wrap entire upload operation with a timeout
    return withTimeout(
      this._uploadFileInternal(clientId, fileName, fileBuffer, mimeType),
      FTP_OPERATION_TIMEOUT,
      'File upload'
    );
  }

  private async _uploadFileInternal(
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
      const lastSlash = fullPath.lastIndexOf('/');
      const dirPath = fullPath.substring(0, lastSlash);
      const fileName = fullPath.substring(lastSlash + 1);
      
      const files = await client.list(dirPath);
      return files.some(f => f.name === fileName && !f.isDirectory);
    } catch {
      return false;
    } finally {
      client.close();
    }
  }

  async streamFileToResponse(filePath: string, res: any, documentName: string): Promise<boolean> {
    const client = await this.getClient();
    
    try {
      console.log(`[FTP-STREAM] Requested path: ${filePath}`);
      
      // Helper to list directory and find a file
      const findFileInDir = async (dirPath: string, targetFileName?: string): Promise<{ name: string; size: number } | null> => {
        try {
          const files = await client.list(dirPath);
          const fileList = files.filter(f => !f.isDirectory);
          console.log(`[FTP-STREAM] Listed ${fileList.length} files in ${dirPath}`);
          
          // Try exact match first
          if (targetFileName) {
            const exactMatch = fileList.find(f => f.name === targetFileName);
            if (exactMatch) {
              console.log(`[FTP-STREAM] Found exact match: ${targetFileName}`);
              return { name: exactMatch.name, size: exactMatch.size };
            }
            console.log(`[FTP-STREAM] No exact match for: ${targetFileName}`);
          }
          
          // Fall back to first image file
          const imageFiles = fileList.filter(f => /\.(jpg|jpeg|png|gif|pdf)$/i.test(f.name));
          if (imageFiles.length > 0) {
            console.log(`[FTP-STREAM] Using first available image: ${imageFiles[0].name}`);
            return { name: imageFiles[0].name, size: imageFiles[0].size };
          }
          
          // Fall back to any file
          if (fileList.length > 0) {
            console.log(`[FTP-STREAM] Using first available file: ${fileList[0].name}`);
            return { name: fileList[0].name, size: fileList[0].size };
          }
          
          console.error(`[FTP-STREAM] Directory is empty: ${dirPath}`);
          return null;
        } catch (error: any) {
          console.error(`[FTP-STREAM] Failed to list directory ${dirPath}: ${error.message}`);
          return null;
        }
      };
      
      let fullPath = `${BASE_PATH}/${filePath}`;
      let foundFile: { name: string; size: number } | null = null;
      let dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
      let fileName = fullPath.substring(fullPath.lastIndexOf('/') + 1);
      
      // Pattern 1: Try exact file path as given
      console.log(`[FTP-STREAM] Trying exact path: ${dirPath}/${fileName}`);
      foundFile = await findFileInDir(dirPath, fileName);
      
      // Pattern 2: If not found and path contains uploads/customers, convert to uploads/clients
      // This handles legacy Perfex paths being converted to new structure
      if (!foundFile && filePath.includes('uploads/customers/')) {
        const match = filePath.match(/uploads\/customers\/(\d+)\/(.*)/);
        if (match) {
          const clientId = match[1];
          const filename = match[2];
          const clientPath = `uploads/clients/${clientId}/${filename}`;
          const clientFullPath = `${BASE_PATH}/${clientPath}`;
          const clientDir = clientFullPath.substring(0, clientFullPath.lastIndexOf('/'));
          console.log(`[FTP-STREAM] Trying converted clients path: ${clientDir}`);
          foundFile = await findFileInDir(clientDir, filename);
          if (foundFile) {
            fullPath = `${clientDir}/${foundFile.name}`;
          }
        }
      }
      
      if (!foundFile) {
        console.error(`[FTP-STREAM] File not found: ${filePath}`);
        client.close();
        return false;
      }
      
      // Use the found file path
      if (foundFile.name !== fileName) {
        fullPath = `${dirPath}/${foundFile.name}`;
      }
      
      console.log(`[FTP-STREAM] File found: ${fullPath} (size: ${foundFile.size} bytes). Now streaming...`);
      
      try {
        // Determine content type from documentName (not the actual filename on FTP)
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
        
        // Set response headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', foundFile.size);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(documentName)}"`);
        
        // Stream directly from FTP to HTTP response
        const passThrough = new PassThrough();
        passThrough.pipe(res);
        
        // Download directly to the PassThrough stream
        await client.downloadTo(passThrough, fullPath);
        
        console.log(`[FTP-STREAM] Streaming complete for: ${fullPath}`);
        return true;
      } catch (streamError) {
        console.error(`[FTP-STREAM] Error during file streaming: ${streamError}`);
        // Headers already sent, cannot send error response
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        } else {
          res.end();
        }
        return false;
      }
    } catch (error) {
      console.error(`[FTP-STREAM] Stream failed:`, error);
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
