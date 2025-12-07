import * as ftp from 'basic-ftp';
import { Readable } from 'stream';

const FTP_HOST = process.env.FTP_HOST || '';
const FTP_USER = process.env.FTP_USER || '';
const FTP_PASSWORD = process.env.FTP_PASSWORD || '';
const FTP_PORT = parseInt(process.env.FTP_PORT || '21');

const BASE_PATH = '/home/i28qwzd7d2dt/public_html/ststaxrepair.org';
const UPLOADS_DIR = 'uploads/clients';

export class FTPStorageService {
  private async getClient(): Promise<ftp.Client> {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    
    if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
      throw new Error('FTP credentials not configured. Set FTP_HOST, FTP_USER, and FTP_PASSWORD environment variables.');
    }
    
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      port: FTP_PORT,
      secure: false,
    });
    
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
      
      const remoteDirPath = `${BASE_PATH}/${UPLOADS_DIR}/${clientId}`;
      const remoteFilePath = `${remoteDirPath}/${uniqueFileName}`;
      
      await this.ensureDirectory(client, remoteDirPath);
      
      const stream = Readable.from(fileBuffer);
      await client.uploadFrom(stream, remoteFilePath);
      
      console.log(`[FTP] Uploaded file to: ${remoteFilePath}`);
      
      const relativeFilePath = `${UPLOADS_DIR}/${clientId}/${uniqueFileName}`;
      const fileUrl = `/ftp/${relativeFilePath}`;
      
      return {
        filePath: relativeFilePath,
        fileUrl,
      };
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
    const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
    return `https://ststaxrepair.org/download/preview_image?path=${encodeURIComponent(filePath)}`;
  }

  getDirectUrl(filePath: string): string {
    return `https://ststaxrepair.org/${filePath}`;
  }
}

export const ftpStorageService = new FTPStorageService();
