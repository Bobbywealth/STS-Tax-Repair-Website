import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const MYSQL_HOST = process.env.MYSQL_HOST;
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_DATABASE = process.env.MYSQL_DATABASE;
const MYSQL_PORT = Number(process.env.MYSQL_PORT) || 3306;

const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || "admin@ststaxrepair.org";
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || "AdminTest123!";

const CLIENT_EMAIL = process.env.DEMO_CLIENT_EMAIL || "client.demo@ststaxrepair.org";
const CLIENT_PASSWORD = process.env.DEMO_CLIENT_PASSWORD || "ClientTest123!";

async function upsertUser(connection: mysql.Connection, opts: {
  email: string;
  password: string;
  role: "admin" | "client" | "super_admin";
  firstName: string;
  lastName: string;
  officeId?: string;
}) {
  const passwordHash = await bcrypt.hash(opts.password, 10);
  const [existing] = await connection.execute(
    `SELECT id, email, role FROM users WHERE email = ? LIMIT 1`,
    [opts.email],
  );
  const existingRow = Array.isArray(existing) && existing.length > 0 ? (existing[0] as any) : null;

  if (existingRow) {
    await connection.execute(
      `UPDATE users
       SET password_hash = ?,
           role = ?,
           first_name = ?,
           last_name = ?,
           office_id = ?,
           is_active = 1,
           email_verified_at = NOW(),
           updated_at = NOW()
       WHERE email = ?`,
      [passwordHash, opts.role, opts.firstName, opts.lastName, opts.officeId || null, opts.email],
    );
    return existingRow.id as string;
  }

  const id = randomUUID();
  await connection.execute(
    `INSERT INTO users
      (id, email, password_hash, first_name, last_name, role, office_id, is_active, email_verified_at, created_at, updated_at)
     VALUES
      (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW())`,
    [id, opts.email, passwordHash, opts.firstName, opts.lastName, opts.role, opts.officeId || null],
  );
  return id;
}

async function upsertOffice(connection: mysql.Connection, name: string, slug: string) {
  const [existing] = await connection.execute(
    `SELECT id FROM offices WHERE slug = ? LIMIT 1`,
    [slug],
  );
  const existingRow = Array.isArray(existing) && existing.length > 0 ? (existing[0] as any) : null;

  if (existingRow) {
    await connection.execute(
      `UPDATE offices SET name = ?, is_active = 1, updated_at = NOW() WHERE id = ?`,
      [name, existingRow.id],
    );
    return existingRow.id as string;
  }

  const id = randomUUID();
  await connection.execute(
    `INSERT INTO offices (id, name, slug, is_active, created_at, updated_at)
     VALUES (?, ?, ?, 1, NOW(), NOW())`,
    [id, name, slug],
  );
  return id;
}

async function upsertOfficeBranding(connection: mysql.Connection, officeId: string, companyName: string) {
  const [existing] = await connection.execute(
    `SELECT id FROM office_branding WHERE office_id = ? LIMIT 1`,
    [officeId],
  );
  const existingRow = Array.isArray(existing) && existing.length > 0 ? (existing[0] as any) : null;

  if (existingRow) {
    await connection.execute(
      `UPDATE office_branding SET company_name = ?, updated_at = NOW() WHERE office_id = ?`,
      [companyName, officeId],
    );
    return;
  }

  await connection.execute(
    `INSERT INTO office_branding (id, office_id, company_name, primary_color, secondary_color, accent_color, created_at, updated_at)
     VALUES (?, ?, ?, '#1a4d2e', '#4CAF50', '#22c55e', NOW(), NOW())`,
    [randomUUID(), officeId, companyName],
  );
}

async function tryInsertFiling(connection: mysql.Connection, clientId: string, year: number, status: string, estimatedRefund: string) {
  try {
    const id = randomUUID();
    await connection.execute(
      `INSERT INTO tax_filings (id, client_id, tax_year, status, estimated_refund, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, clientId, year, status, estimatedRefund],
    );
  } catch (e: any) {
    console.warn(`[DEMO] Skipping filing ${year} seed:`, e?.message || e);
  }
}

async function tryInsertDocument(connection: mysql.Connection, clientId: string, name: string, type: string) {
  try {
    const id = randomUUID();
    await connection.execute(
      `INSERT INTO document_versions (id, client_id, document_name, document_type, file_url, version, uploaded_by, uploaded_at)
       VALUES (?, ?, ?, ?, ?, 1, 'client', NOW())`,
      [id, clientId, name, type, "https://ststaxrepair.org/demo-placeholder.pdf"],
    );
  } catch (e: any) {
    console.warn(`[DEMO] Skipping document ${name} seed:`, e?.message || e);
  }
}

async function tryInsertTicket(connection: mysql.Connection, clientId: string, clientName: string, subject: string, description: string) {
  try {
    const id = randomUUID();
    await connection.execute(
      `INSERT INTO tickets (id, client_id, client_name, subject, description, category, priority, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, clientId, clientName, subject, description, "general", "medium", "open"],
    );
    return id;
  } catch (e: any) {
    console.warn("[DEMO] Skipping ticket seed:", e?.message || e);
    return null;
  }
}

async function tryInsertTicketMessage(connection: mysql.Connection, ticketId: string, authorId: string, authorName: string, message: string) {
  try {
    await connection.execute(
      `INSERT INTO ticket_messages (id, ticket_id, author_id, author_name, message, is_internal, created_at)
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [randomUUID(), ticketId, authorId, authorName, message],
    );
  } catch (e: any) {
    console.warn("[DEMO] Skipping ticket message seed:", e?.message || e);
  }
}

async function tryInsertAppointment(connection: mysql.Connection, clientId: string, clientName: string, title: string, date: Date, status: string) {
  try {
    await connection.execute(
      `INSERT INTO appointments (id, client_id, client_name, title, appointment_date, duration, status, created_at)
       VALUES (?, ?, ?, ?, ?, 60, ?, NOW())`,
      [randomUUID(), clientId, clientName, title, date, status],
    );
  } catch (e: any) {
    console.warn("[DEMO] Skipping appointment seed:", e?.message || e);
  }
}

async function tryInsertTask(connection: mysql.Connection, clientId: string, clientName: string, title: string, status: string) {
  try {
    await connection.execute(
      `INSERT INTO tasks (id, title, client_id, client_name, assigned_to, priority, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'Demo Admin', 'medium', ?, NOW(), NOW())`,
      [randomUUID(), title, clientId, clientName, status],
    );
  } catch (e: any) {
    console.warn("[DEMO] Skipping task seed:", e?.message || e);
  }
}

async function tryInsertNotification(connection: mysql.Connection, userId: string, title: string, message: string) {
  try {
    await connection.execute(
      `INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
       VALUES (?, ?, 'general', ?, ?, 0, NOW())`,
      [randomUUID(), userId, title, message],
    );
  } catch (e: any) {
    console.warn("[DEMO] Skipping notification seed:", e?.message || e);
  }
}

async function main() {
  let connection: mysql.Connection | undefined;
  try {
    console.log("[DEMO] Connecting to MySQL…");
    connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      port: MYSQL_PORT,
      enableKeepAlive: true,
    });

    console.log("[DEMO] Creating Demo Office and Branding...");
    const officeId = await upsertOffice(connection, "STS Demo HQ", "demo-hq");
    await upsertOfficeBranding(connection, officeId, "STS TaxRepair Demo");

    console.log("[DEMO] Upserting Demo Accounts...");
    const adminId = await upsertUser(connection, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
      firstName: "Demo",
      lastName: "Admin",
      officeId,
    });

    const clientId = await upsertUser(connection, {
      email: CLIENT_EMAIL,
      password: CLIENT_PASSWORD,
      role: "client",
      firstName: "Demo",
      lastName: "Client",
      officeId,
    });

    console.log("[DEMO] Seeding Tax Filings...");
    await tryInsertFiling(connection, clientId, 2023, "accepted", "3500.00");
    await tryInsertFiling(connection, clientId, 2024, "review", "4250.00");

    console.log("[DEMO] Seeding Documents...");
    await tryInsertDocument(connection, clientId, "2024_W2_Company_A.pdf", "W-2");
    await tryInsertDocument(connection, clientId, "2024_1099_Freelance.pdf", "1099");
    await tryInsertDocument(connection, clientId, "State_ID_Front.jpg", "ID");

    console.log("[DEMO] Seeding Support Tickets...");
    const ticketId = await tryInsertTicket(connection, clientId, "Demo Client", "Question about my 2024 refund", "I noticed my refund is still in review status. Can you provide an update?");
    if (ticketId) {
      await tryInsertTicketMessage(connection, ticketId, adminId, "Demo Admin", "Hello! We are currently reviewing your documents to ensure maximum deductions. We expect to file by tomorrow.");
    }

    console.log("[DEMO] Seeding Appointments...");
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    await tryInsertAppointment(connection, clientId, "Demo Client", "Initial Consultation", yesterday, "completed");
    await tryInsertAppointment(connection, clientId, "Demo Client", "Final Review Session", nextWeek, "scheduled");

    console.log("[DEMO] Seeding Tasks...");
    await tryInsertTask(connection, clientId, "Demo Client", "Upload 2024 W-2 Forms", "done");
    await tryInsertTask(connection, clientId, "Demo Client", "Review and Sign Form 8879", "todo");

    console.log("[DEMO] Seeding Notifications...");
    await tryInsertNotification(connection, clientId, "Refund Update", "Your 2024 refund estimation has been updated to $4,250.00.");
    await tryInsertNotification(connection, clientId, "Document Received", "We have successfully received your W-2 document.");

    console.log("\n========================================");
    console.log("DEMO ACCOUNTS READY (App Review)");
    console.log("========================================");
    console.log(`ADMIN EMAIL:    ${ADMIN_EMAIL}`);
    console.log(`ADMIN PASSWORD: ${ADMIN_PASSWORD}`);
    console.log(`CLIENT EMAIL:   ${CLIENT_EMAIL}`);
    console.log(`CLIENT PASSWORD:${CLIENT_PASSWORD}`);
    console.log("========================================\n");
    console.log("Use Admin login at: /admin-login");
    console.log("Use Client login at: /client-login");
  } catch (e: any) {
    console.error("[DEMO] Failed:", e?.message || e);
    process.exitCode = 1;
  } finally {
    try {
      await connection?.end();
    } catch {
      // ignore
    }
  }
}

void main();
