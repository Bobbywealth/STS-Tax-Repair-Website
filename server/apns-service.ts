import apn from 'apn';
import type { PushDeviceToken } from '@shared/mysql-schema';

interface APNsConfig {
  keyId: string;
  teamId: string;
  bundleId: string;
  production: boolean;
  keyPath?: string;
  key?: string; // Base64 encoded key or PEM string
}

let apnProvider: apn.Provider | null = null;

/**
 * Initialize APNs provider with configuration from environment variables
 */
export function initializeAPNs(): apn.Provider | null {
  // Check if APNs is configured
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const bundleId = process.env.APNS_BUNDLE_ID;
  const keyPath = process.env.APNS_KEY_PATH;
  const key = process.env.APNS_KEY; // Base64 encoded or PEM string
  const production = process.env.APNS_PRODUCTION === 'true';

  if (!keyId || !teamId || !bundleId) {
    console.warn('[APNs] APNs not configured. Missing required environment variables: APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID');
    return null;
  }

  if (!keyPath && !key) {
    console.warn('[APNs] APNs not configured. Missing APNS_KEY_PATH or APNS_KEY');
    return null;
  }

  try {
    const options: apn.ProviderOptions = {
      token: {
        key: keyPath || (key ? Buffer.from(key, 'base64').toString('utf-8') : undefined),
        keyId,
        teamId,
      },
      production,
    };

    if (keyPath) {
      options.token!.key = require('fs').readFileSync(keyPath);
    }

    apnProvider = new apn.Provider(options);
    console.log(`[APNs] Initialized for ${production ? 'Production' : 'Development'} (Bundle: ${bundleId})`);
    return apnProvider;
  } catch (error: any) {
    console.error('[APNs] Failed to initialize:', error.message);
    return null;
  }
}

/**
 * Get or initialize APNs provider
 */
function getProvider(): apn.Provider | null {
  if (!apnProvider) {
    apnProvider = initializeAPNs();
  }
  return apnProvider;
}

/**
 * Send push notification to a single device
 */
export async function sendPushNotification(
  deviceToken: string,
  notification: {
    title: string;
    body: string;
    badge?: number;
    sound?: string;
    data?: Record<string, any>;
    link?: string;
  }
): Promise<boolean> {
  const provider = getProvider();
  if (!provider) {
    console.warn('[APNs] Provider not initialized, skipping push notification');
    return false;
  }

  try {
    const note = new apn.Notification();
    note.alert = {
      title: notification.title,
      body: notification.body,
    };
    note.badge = notification.badge;
    note.sound = notification.sound || 'default';
    note.topic = process.env.APNS_BUNDLE_ID || '';
    note.payload = {
      ...notification.data,
      link: notification.link,
    };
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry
    note.priority = 10; // High priority

    const result = await provider.send(note, deviceToken);
    
    if (result.failed && result.failed.length > 0) {
      const failure = result.failed[0];
      console.error(`[APNs] Failed to send notification:`, failure.response?.reason || failure.error);
      
      // Handle invalid token
      if (failure.response?.reason === 'BadDeviceToken' || failure.response?.reason === 'Unregistered') {
        return false; // Token should be removed
      }
      return false;
    }

    if (result.sent && result.sent.length > 0) {
      console.log(`[APNs] Notification sent successfully to ${deviceToken.substring(0, 20)}...`);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('[APNs] Error sending notification:', error.message);
    return false;
  }
}

/**
 * Send push notifications to multiple devices
 */
export async function sendPushNotifications(
  deviceTokens: PushDeviceToken[],
  notification: {
    title: string;
    body: string;
    badge?: number;
    sound?: string;
    data?: Record<string, any>;
    link?: string;
  }
): Promise<{ sent: number; failed: number; invalidTokens: string[] }> {
  const provider = getProvider();
  if (!provider) {
    console.warn('[APNs] Provider not initialized, skipping push notifications');
    return { sent: 0, failed: deviceTokens.length, invalidTokens: [] };
  }

  if (deviceTokens.length === 0) {
    return { sent: 0, failed: 0, invalidTokens: [] };
  }

  const results = {
    sent: 0,
    failed: 0,
    invalidTokens: [] as string[],
  };

  // Send in batches of 100 (APNs limit)
  const batchSize = 100;
  for (let i = 0; i < deviceTokens.length; i += batchSize) {
    const batch = deviceTokens.slice(i, i + batchSize);
    const tokens = batch.map(dt => dt.deviceToken);

    try {
      const note = new apn.Notification();
      note.alert = {
        title: notification.title,
        body: notification.body,
      };
      note.badge = notification.badge;
      note.sound = notification.sound || 'default';
      note.topic = process.env.APNS_BUNDLE_ID || '';
      note.payload = {
        ...notification.data,
        link: notification.link,
      };
      note.expiry = Math.floor(Date.now() / 1000) + 3600;
      note.priority = 10;

      const result = await provider.send(note, tokens);

      if (result.sent) {
        results.sent += result.sent.length;
      }

      if (result.failed) {
        results.failed += result.failed.length;
        result.failed.forEach((failure) => {
          if (failure.response?.reason === 'BadDeviceToken' || failure.response?.reason === 'Unregistered') {
            const token = failure.device;
            results.invalidTokens.push(token);
          }
        });
      }
    } catch (error: any) {
      console.error(`[APNs] Error sending batch ${i}-${i + batchSize}:`, error.message);
      results.failed += batch.length;
    }
  }

  return results;
}

/**
 * Check if APNs is configured
 */
export function isAPNsConfigured(): boolean {
  return !!(
    process.env.APNS_KEY_ID &&
    process.env.APNS_TEAM_ID &&
    process.env.APNS_BUNDLE_ID &&
    (process.env.APNS_KEY_PATH || process.env.APNS_KEY)
  );
}

