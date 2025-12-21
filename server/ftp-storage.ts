import { Readable } from "stream";
import SftpClient from "ssh2-sftp-client";

const FTP_HOST = process.env.FTP_HOST || "";
const FTP_USER = process.env.FTP_USER || "";
const FTP_PASSWORD = process.env.FTP_PASSWORD || "";
// Default to SFTP port 22 (supported by GoDaddy). Override with FTP_PORT if needed.
const FTP_PORT = parseInt(process.env.FTP_PORT || "22");

// Overall timeout for transfer operations (4 minutes for uploads)
const FTP_OPERATION_TIMEOUT = 240000;

// Debug: Log FTP config at startup
console.log(
  `[FTP-CONFIG] FTP_HOST="${FTP_HOST}", FTP_USER="${FTP_USER}", FTP_PORT=${FTP_PORT}`
);

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

// The SFTP user lands in /home/i28qwzd7d2dt/ so paths are relative to that
// ststaxrepair.org is a folder directly in home, NOT inside public_html
const BASE_PATH = "ststaxrepair.org";
const UPLOADS_DIR = "uploads/clients";

export class FTPStorageService {
  private async getClient(): Promise<SftpClient> {
    if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
      throw new Error(
        "FTP credentials not configured. Set FTP_HOST, FTP_USER, and FTP_PASSWORD environment variables."
      );
    }

    const client = new SftpClient();
    console.log(
      `[FTP] Connecting via SFTP to ${FTP_HOST}:${FTP_PORT} as ${FTP_USER} at ${new Date().toISOString()}...`
    );

    try {
      await client.connect({
        host: FTP_HOST,
        port: FTP_PORT,
        username: FTP_USER,
        password: FTP_PASSWORD,
        readyTimeout: 30000,
      });

      console.log(`[FTP] Connected successfully at ${new Date().toISOString()}`);

      // Log the current working directory after login
      const pwd = await client.cwd();
      console.log(`[FTP] Current directory: ${pwd}`);
    } catch (connectError) {
      console.error(
        `[FTP] Connection failed at ${new Date().toISOString()}:`,
        connectError
      );
      throw connectError;
    }

    return client;
  }

  async uploadFile(
    clientId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType?: string,
    baseDir: string = UPLOADS_DIR
  ): Promise<{ filePath: string; fileUrl: string }> {
    // Wrap entire upload operation with a timeout
    return withTimeout(
      this._uploadFileInternal(clientId, fileName, fileBuffer, mimeType, baseDir),
      FTP_OPERATION_TIMEOUT,
      "File upload"
    );
  }

  private async _uploadFileInternal(
    clientId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType?: string,
    baseDir: string = UPLOADS_DIR
  ): Promise<{ filePath: string; fileUrl: string }> {
    console.log(`[FTP] _uploadFileInternal start @ ${new Date().toISOString()}`);
    console.log(`[FTP] Getting SFTP client...`);
    const client = await this.getClient();
    console.log(`[FTP] Got SFTP client @ ${new Date().toISOString()}`);
    
    try {
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
      const normalizedBaseDir = baseDir.replace(/^\/+|\/+$/g, '');
      
      // Use relative path from home directory
      const remoteDirPath = `${BASE_PATH}/${normalizedBaseDir}/${clientId}`;
      
      console.log(`[FTP] Preparing upload: client=${clientId}, file=${fileName}, sanitized=${uniqueFileName}, dir=${remoteDirPath}, size=${fileBuffer.length}`);
      
      const t0 = Date.now();
      console.log(`[FTP] ensureDirectory start`);
      await this.ensureDirectory(client, remoteDirPath);
      console.log(`[FTP] ensureDirectory done in ${Date.now() - t0}ms`);

      const remotePath = `${remoteDirPath}/${uniqueFileName}`;
      console.log(`[FTP] put start -> ${remotePath}`);
      await client.put(Readable.from(fileBuffer), remotePath);
      console.log(`[FTP] put done in ${Date.now() - t0}ms`);

      // Verify file exists after upload
      try {
        console.log(`[FTP] stat start -> ${remotePath}`);
        const stat = await client.stat(remotePath);
        console.log(`[FTP] stat done size=${stat.size} in ${Date.now() - t0}ms`);
      } catch (verifyError) {
        console.error(`[FTP] WARNING: Could not verify file after upload:`, verifyError);
      }
      
      const filePath = `${normalizedBaseDir}/${clientId}/${uniqueFileName}`;
      const fileUrl = `/ftp/${filePath}`;
      
      return { filePath, fileUrl };
    } catch (uploadError) {
      console.error(`[FTP] Upload failed:`, uploadError);
      throw uploadError;
    } finally {
      console.log(`[FTP] Closing SFTP client`);
      client.end();
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    const client = await this.getClient();
    
    try {
      const fullPath = `${BASE_PATH}/${filePath}`;
      await client.delete(fullPath);
      console.log(`[FTP] Deleted file: ${fullPath}`);
      return true;
    } catch (error) {
      console.error(`[FTP] Failed to delete file:`, error);
      return false;
    } finally {
      client.end();
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    const client = await this.getClient();
    
    try {
      const fullPath = `${BASE_PATH}/${filePath}`;
      const exists = await client.exists(fullPath);
      return !!exists;
    } catch {
      return false;
    } finally {
      client.end();
    }
  }

  async streamFileToResponse(filePath: string, res: any, documentName: string): Promise<boolean> {
    const client = await this.getClient();
    
    try {
      const fullPath = `${BASE_PATH}/${filePath}`;
      const exists = await client.exists(fullPath);
      if (!exists) {
        console.error(`[FTP] File not found: ${fullPath}`);
        return false;
      }

      const buffer = (await client.get(fullPath)) as Buffer;

      // Determine content type
      const fileExt = documentName.split('.').pop()?.toLowerCase();
      const mimeType = this.getMimeType(fileExt || '');
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${documentName}"`);
      res.send(buffer);
      
      console.log(`[FTP] Stream completed for ${fullPath}`);
      return true;
    } catch (error) {
      console.error(`[FTP] Failed to stream file ${filePath}:`, error);
      return false;
    } finally {
      client.end();
    }
  }

  private async ensureDirectory(client: SftpClient, dirPath: string): Promise<void> {
    const parts = dirPath.split('/').filter(p => p);
    let currentPath = '';
    
    for (const part of parts) {
      currentPath += (currentPath.endsWith('/') ? '' : '/') + part;
      const exists = await client.exists(currentPath);
      if (!exists) {
        console.log(`[FTP] Creating directory: ${currentPath}`);
        await client.mkdir(currentPath, true);
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
        type: item.type === 'd' ? 'directory' : 'file',
        size: item.size
      }));
    } catch (error) {
      console.error(`[FTP] Error listing directory:`, error);
      throw error;
    } finally {
      client.end();
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
