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
  role: "admin" | "client";
  firstName: string;
  lastName: string;
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
           is_active = 1,
           email_verified_at = NOW(),
           updated_at = NOW()
       WHERE email = ?`,
      [passwordHash, opts.role, opts.firstName, opts.lastName, opts.email],
    );
    return existingRow.id as string;
  }

  const id = randomUUID();
  await connection.execute(
    `INSERT INTO users
      (id, email, password_hash, first_name, last_name, role, is_active, email_verified_at, created_at, updated_at)
     VALUES
      (?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW())`,
    [id, opts.email, passwordHash, opts.firstName, opts.lastName, opts.role],
  );
  return id;
}

async function tryInsertTicket(connection: mysql.Connection, clientId: string, clientName: string) {
  // Best-effort: tickets schema varies across deployments; use minimal columns.
  try {
    const id = randomUUID();
    await connection.execute(
      `INSERT INTO tickets
        (id, client_id, client_name, subject, description, category, priority, status, created_at, updated_at)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        clientId,
        clientName,
        "Demo ticket: App Review",
        "This is a seeded demo ticket for App Review verification.",
        "general",
        "medium",
        "open",
      ],
    );
  } catch (e: any) {
    console.warn("[DEMO] Skipping ticket seed (table/columns may differ):", e?.message || e);
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

    const adminId = await upsertUser(connection, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
      firstName: "Demo",
      lastName: "Admin",
    });

    const clientId = await upsertUser(connection, {
      email: CLIENT_EMAIL,
      password: CLIENT_PASSWORD,
      role: "client",
      firstName: "Demo",
      lastName: "Client",
    });

    await tryInsertTicket(connection, clientId, "Demo Client");

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


