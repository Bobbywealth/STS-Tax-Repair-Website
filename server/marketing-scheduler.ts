import twilio from "twilio";
import nodemailer from "nodemailer";
import { mysqlPool } from "./mysql-db";
import { storage, isDemoStorage } from "./storage";

type DueCampaignRow = {
  id: string;
  name: string;
  type: "email" | "sms";
  status: string | null;
  subject: string | null;
  content: string;
  recipient_count: number | null;
  recipient_emails: any;
  recipient_user_ids: any;
  scheduled_for: Date | string | null;
};

function parseJsonArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      return [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeToE164(raw: string) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return null;
}

async function claimCampaign(id: string): Promise<boolean> {
  const [result]: any = await mysqlPool.execute(
    `UPDATE marketing_campaigns SET status = 'processing', started_at = NOW() WHERE id = ? AND status = 'scheduled'`,
    [id],
  );
  return typeof result?.affectedRows === "number" ? result.affectedRows === 1 : false;
}

async function completeCampaign(args: {
  id: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  errorCount: number;
}) {
  await mysqlPool.execute(
    `UPDATE marketing_campaigns
     SET status = ?, recipient_count = ?, sent_count = ?, error_count = ?, completed_at = NOW()
     WHERE id = ?`,
    [args.status, args.recipientCount, args.sentCount, args.errorCount, args.id],
  );
}

async function sendScheduledEmail(row: DueCampaignRow) {
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error("Gmail credentials are not configured (GMAIL_USER, GMAIL_APP_PASSWORD)");
  }

  const to = parseJsonArray(row.recipient_emails);
  if (to.length === 0) throw new Error("Scheduled email has no recipients");
  const subject = row.subject || row.name || "Email Campaign";
  const message = row.content || "";

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  let sent = 0;
  for (const recipient of to) {
    try {
      await transporter.sendMail({
        from: `"STS Marketing" <${GMAIL_USER}>`,
        to: recipient,
        subject,
        html: message,
        text: message.replace(/<[^>]*>/g, ""),
      });
      sent += 1;
    } catch (err: any) {
      console.error(`[MARKETING][SCHED][EMAIL] Failed for ${recipient}:`, err?.message || err);
    }
  }

  const failed = to.length - sent;
  await completeCampaign({
    id: row.id,
    status: failed === 0 ? "completed" : sent > 0 ? "partial" : "failed",
    recipientCount: to.length,
    sentCount: sent,
    errorCount: failed,
  });
}

async function sendScheduledSms(row: DueCampaignRow) {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_FROM;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
    throw new Error("Twilio is not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM)");
  }

  const toUserIds = parseJsonArray(row.recipient_user_ids);
  if (toUserIds.length === 0) throw new Error("Scheduled SMS has no recipients");

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const message = (row.content || "").trim();

  // Load recipients and enforce express consent at send time
  const users = await Promise.all(toUserIds.map((id) => storage.getUser(String(id))));
  const allowedNumbers: string[] = [];
  for (const u of users) {
    if (!u) continue;
    const hasConsent = !!(u as any).smsConsentAt && !(u as any).smsOptedOutAt;
    if (!hasConsent) continue;
    const e164 = normalizeToE164((u as any).phone);
    if (!e164) continue;
    allowedNumbers.push(e164);
  }

  // Add STOP/HELP footer if not already present
  const footerParts: string[] = [];
  if (!/(\bstop\b)/i.test(message)) footerParts.push("STOP to opt out");
  if (!/(\bhelp\b)/i.test(message)) footerParts.push("HELP for help");
  const body = message + (footerParts.length ? ` Reply ${footerParts.join(", ")}.` : "");

  let sent = 0;
  for (const recipient of allowedNumbers) {
    try {
      await client.messages.create({ from: TWILIO_FROM, to: recipient, body });
      sent += 1;
    } catch (err: any) {
      console.error(`[MARKETING][SCHED][SMS] Failed for ${recipient}:`, err?.message || err);
    }
  }

  const failed = allowedNumbers.length - sent;
  await completeCampaign({
    id: row.id,
    status: failed === 0 ? "completed" : sent > 0 ? "partial" : "failed",
    recipientCount: allowedNumbers.length,
    sentCount: sent,
    errorCount: failed,
  });
}

async function runOnce() {
  const [rows] = await mysqlPool.execute(
    `SELECT id, name, type, status, subject, content, recipient_count, recipient_emails, recipient_user_ids, scheduled_for
     FROM marketing_campaigns
     WHERE status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= NOW()
     ORDER BY scheduled_for ASC
     LIMIT 10`,
  );

  const due = (rows as any[]).map((r) => r as DueCampaignRow);
  for (const row of due) {
    try {
      const claimed = await claimCampaign(row.id);
      if (!claimed) continue;

      if (row.type === "email") {
        await sendScheduledEmail(row);
      } else if (row.type === "sms") {
        await sendScheduledSms(row);
      } else {
        await completeCampaign({
          id: row.id,
          status: "failed",
          recipientCount: row.recipient_count || 0,
          sentCount: 0,
          errorCount: row.recipient_count || 0,
        });
      }
    } catch (err: any) {
      console.error("[MARKETING][SCHED] Error processing campaign:", row.id, err?.message || err);
      try {
        await completeCampaign({
          id: row.id,
          status: "failed",
          recipientCount: row.recipient_count || 0,
          sentCount: 0,
          errorCount: row.recipient_count || 0,
        });
      } catch (e) {
        console.error("[MARKETING][SCHED] Failed to mark campaign failed:", row.id, e);
      }
    }
  }
}

export function startMarketingScheduler() {
  if (isDemoStorage) return;
  const enabled = String(process.env.MARKETING_SCHEDULER_ENABLED || "true").toLowerCase() !== "false";
  if (!enabled) return;

  // Poll every 30 seconds; short and safe.
  setInterval(() => {
    runOnce().catch((e) => console.error("[MARKETING][SCHED] Tick failed:", e));
  }, 30_000);

  // Kick once at startup
  runOnce().catch((e) => console.error("[MARKETING][SCHED] Initial run failed:", e));
}

