import { Readable } from "stream";
import SftpClient from "ssh2-sftp-client";

const FTP_HOST = process.env.FTP_HOST || "";
const FTP_USER = process.env.FTP_USER || "";
const FTP_PASSWORD = process.env.FTP_PASSWORD || "";
// Default to SFTP port 22 (supported by GoDaddy). Override with FTP_PORT if needed.
const FTP_PORT = Number.isFinite(parseInt(process.env.FTP_PORT || "22"))
  ? parseInt(process.env.FTP_PORT || "22")
  : 22;

// Overall timeout for transfer operations (4 minutes for uploads)
const FTP_OPERATION_TIMEOUT = 60000;

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
// Some environments may use a different site root folder name; allow override.
const BASE_PATH = process.env.FTP_BASE_PATH || "ststaxrepair.org";
const UPLOADS_DIR = "uploads/clients";

export class FTPStorageService {
  private client: SftpClient | null = null;
  private connectingPromise: Promise<SftpClient> | null = null;

  private async tryExists(client: SftpClient, fullPath: string): Promise<boolean> {
    try {
      const exists = await client.exists(fullPath);
      return !!exists;
    } catch {
      return false;
    }
  }

  private async resolveFullPath(client: SftpClient, filePath: string): Promise<string | null> {
    const clean = filePath.replace(/^\/+/, "");
    const primary = `${BASE_PATH}/${clean}`;
    const secondary = clean; // some hosts are already chrooted to the site root

    // Prefer primary if it exists
    if (BASE_PATH && (await this.tryExists(client, primary))) return primary;
    if (await this.tryExists(client, secondary)) return secondary;

    // Last chance: if BASE_PATH doesn't exist, try without it (already done), otherwise give up
    return null;
  }

  private async getClient(): Promise<SftpClient> {
    if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
      throw new Error(
        "FTP credentials not configured. Set FTP_HOST, FTP_USER, and FTP_PASSWORD environment variables."
      );
    }

    // This service uses SFTP (SSH). Port 21 is plain FTP and will fail with cryptic errors like "Unexpected end".
    if (FTP_PORT === 21) {
      throw new Error(
        "FTP_PORT is set to 21, but this app uses SFTP (SSH). Set FTP_PORT=22 (or your SFTP port)."
      );
    }

    // Return existing client if connected
    if (this.client) {
      try {
        // Simple test to see if still alive
        await this.client.cwd();
        return this.client;
      } catch (err) {
        console.warn("[FTP] Existing client stale, reconnecting...");
        this.client = null;
      }
    }

    // Prevent parallel connection attempts
    if (this.connectingPromise) {
      return this.connectingPromise;
    }

    this.connectingPromise = (async () => {
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
          readyTimeout: 15000,
          keepaliveInterval: 10000,
          keepaliveCountMax: 3,
        });

        console.log(`[FTP] Connected successfully at ${new Date().toISOString()}`);

        // Set up event handlers to clear the singleton on error/end
        client.on('error', (err) => {
          console.error('[FTP] Connection error event:', err);
          this.client = null;
        });
        client.on('end', () => {
          console.log('[FTP] Connection ended event');
          this.client = null;
        });
        client.on('close', () => {
          console.log('[FTP] Connection closed event');
          this.client = null;
        });

        this.client = client;
        return client;
      } catch (connectError) {
        console.error(
          `[FTP] Connection failed at ${new Date().toISOString()}:`,
          connectError
        );
        throw connectError;
      } finally {
        this.connectingPromise = null;
      }
    })();

    return this.connectingPromise;
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
      
      // Use relative path from home directory; some hosts may already be chrooted to site root.
      const remoteDirPathPrimary = `${BASE_PATH}/${normalizedBaseDir}/${clientId}`;
      const remoteDirPathSecondary = `${normalizedBaseDir}/${clientId}`;
      
      console.log(`[FTP] Preparing upload: client=${clientId}, file=${fileName}, sanitized=${uniqueFileName}, dir=${remoteDirPathPrimary}, size=${fileBuffer.length}`);
      
      const t0 = Date.now();
      console.log(`[FTP] ensureDirectory start`);
      try {
        await this.ensureDirectory(client, remoteDirPathPrimary);
      } catch (e) {
        console.warn(`[FTP] ensureDirectory primary failed, trying secondary path`, e);
        await this.ensureDirectory(client, remoteDirPathSecondary);
      }
      console.log(`[FTP] ensureDirectory done in ${Date.now() - t0}ms`);

      let remotePath = `${remoteDirPathPrimary}/${uniqueFileName}`;
      // If primary dir doesn't exist (chroot), write to secondary
      if (!(await this.tryExists(client, remoteDirPathPrimary))) {
        remotePath = `${remoteDirPathSecondary}/${uniqueFileName}`;
      }
      console.log(`[FTP] put start -> ${remotePath}`);
      await client.put(fileBuffer, remotePath);
      console.log(`[FTP] put done in ${Date.now() - t0}ms`);

      // Verify file exists after upload
      try {
        console.log(`[FTP] stat start -> ${remotePath}`);
        const stat = await client.stat(remotePath);
        console.log(`[FTP] stat done size=${stat.size} in ${Date.now() - t0}ms`);
      } catch (verifyError) {
        console.error(`[FTP] WARNING: Could not verify file after upload:`, verifyError);
      }
      
      const remoteDirUsed = remotePath.split("/").slice(0, -1).join("/");
      const filePath = remoteDirUsed.replace(/^\/+/, "");
      const fileUrl = `/ftp/${filePath}`;
      
      return { filePath, fileUrl };
    } catch (uploadError) {
      console.error(`[FTP] Upload failed:`, uploadError);
      throw uploadError;
    }
    // No client.end() here, we reuse the singleton
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
    }
  }

  async streamFileToResponse(filePath: string, res: any, documentName: string): Promise<boolean> {
    // Retry once on connection failure
    let retryCount = 0;
    while (retryCount < 2) {
      try {
        const client = await this.getClient();
        const fullPath = await this.resolveFullPath(client, filePath);
        if (!fullPath) {
          console.error(`[FTP] File not found (tried base/no-base): ${filePath}`);
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
      } catch (error: any) {
        console.error(`[FTP] Failed to stream file ${filePath} (attempt ${retryCount + 1}):`, error);
        
        // If it was a connection error, clear the client and retry
        if (error.message.includes('end') || error.message.includes('close') || error.message.includes('Connection')) {
          this.client = null;
          retryCount++;
          if (retryCount < 2) {
            await new Promise(resolve => setTimeout(resolve, 500)); // wait 0.5s before retry
            continue;
          }
        }
        return false;
      }
    }
    return false;
  }

  private async ensureDirectory(client: SftpClient, dirPath: string): Promise<void> {
    // IMPORTANT:
    // - GoDaddy SFTP users are typically chrooted to their home directory.
    // - Using absolute paths like "/ststaxrepair.org" tries to create dirs at filesystem root
    //   and will fail with "Permission denied".
    // Therefore we always work with paths relative to the user's home.
    const parts = dirPath.split("/").filter(Boolean);
    let currentPath = "";

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part; // no leading slash
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

  private getMimeType(fileExt: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
    };
    return mimeTypes[fileExt] || 'application/octet-stream';
  }

  // List files in a directory on FTP server (for debugging)
  async listDirectory(dirPath: string): Promise<{ name: string; type: string; size: number }[]> {
    const client = await this.getClient();
    
    try {
      const fullPath = `${BASE_PATH}/${dirPath}`;
      console.log(`[FTP] Listing directory: ${fullPath}`);
      
      const list = await client.list(fullPath);
      return list.map((item: any) => ({
        name: item.name,
        type: item.type === 'd' ? 'directory' : 'file',
        size: item.size
      }));
    } catch (error) {
      console.error(`[FTP] Error listing directory:`, error);
      throw error;
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
