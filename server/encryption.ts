import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Track if we've already warned about missing salt (to avoid repeated warnings)
let hasWarnedAboutSalt = false;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.SESSION_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!secret) {
    throw new Error('ENCRYPTION_SECRET or SESSION_SECRET must be set');
  }

  // SECURITY: In production, require ENCRYPTION_SALT to be explicitly set
  let salt = process.env.ENCRYPTION_SALT;
  if (!salt) {
    if (isProduction) {
      throw new Error('[SECURITY] ENCRYPTION_SALT environment variable must be set in production');
    }
    // In development, use a derived salt from the secret (still deterministic but not hardcoded)
    salt = crypto.createHash('sha256').update(secret + '-dev-salt').digest('hex').slice(0, 32);
    if (!hasWarnedAboutSalt) {
      console.warn('[SECURITY WARNING] ENCRYPTION_SALT not set - using derived salt for development. Set ENCRYPTION_SALT in production!');
      hasWarnedAboutSalt = true;
    }
  }

  return crypto.scryptSync(secret, salt, KEY_LENGTH);
}

export function encrypt(text: string): string {
  if (!text) return '';
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      return '';
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

export function maskSSN(ssn: string): string {
  if (!ssn || ssn.length < 4) return '***-**-****';
  return `***-**-${ssn.slice(-4)}`;
}

export function maskBankAccount(account: string): string {
  if (!account || account.length < 4) return '****';
  return `****${account.slice(-4)}`;
}
