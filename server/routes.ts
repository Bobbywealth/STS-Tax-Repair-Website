import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  requireRole,
  requireMinRole,
  requireAdmin,
  requireStaff,
  requirePermission,
  loadScopeContext,
  getScopeFilter,
  requireClientScope,
  clearAgentScopeCache,
  type AuthenticatedRequest,
} from "./authorization";
import { mysqlStorage } from "./mysql-storage";
import { setObjectAclPolicy } from "./objectAcl";
import {
  insertTaxDeadlineSchema,
  insertAppointmentSchema,
  insertPaymentSchema,
  insertDocumentVersionSchema,
  insertESignatureSchema,
  insertEmailLogSchema,
  insertDocumentRequestTemplateSchema,
  insertTaxFilingSchema,
  insertUserSchema,
  insertOfficeBrandingSchema,
  type Form8879Data,
  type FilingStatus,
  type OfficeBranding,
  type ThemePreference,
} from "@shared/mysql-schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ftpStorageService } from "./ftp-storage";
import {
  testPerfexConnection,
  getPerfexTables,
  queryPerfex,
  describePerfexTable,
} from "./perfex-db";
import { mysqlPool, runMySQLMigrations } from "./mysql-db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import bcrypt from "bcrypt";
import { encrypt, decrypt } from "./encryption";
import { 
  sendPasswordResetEmail, 
  sendWelcomeEmail, 
  sendEmailVerificationEmail,
  sendStaffInviteEmail,
  sendTaskAssignmentEmail,
  sendDocumentUploadConfirmationEmail,
  sendAppointmentConfirmationEmail,
  sendPaymentReceivedEmail,
  sendTaxFilingStatusEmail,
  sendSignatureRequestEmail,
  sendSignatureCompletedEmail,
  sendSupportTicketCreatedEmail,
  sendSupportTicketResponseEmail,
  sendStaffRequestNotificationEmail,
  generateSecureToken,
  sendEmail
} from "./email";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { randomUUID } from "crypto";
import aiRoutes from "./ai-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Password reset endpoint - works for both Replit and Render
  // This resets the password hash fresh so it works in the current environment
  app.post("/api/setup/reset-password", async (req, res) => {
    try {
      const { email, newPassword, secretKey } = req.body;

      // Simple secret key protection (change this in production)
      if (secretKey !== "sts-admin-reset-2025") {
        return res.status(403).json({ error: "Invalid secret key" });
      }

      if (!email || !newPassword) {
        return res
          .status(400)
          .json({ error: "Email and newPassword required" });
      }

      // Find user by email
      const [rows] = await mysqlPool.query(
        "SELECT id, email, first_name, last_name, role FROM users WHERE email = ?",
        [email],
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = rows[0] as any;

      // Hash the new password fresh in THIS environment
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update the password hash
      await mysqlPool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
        newPasswordHash,
        user.id,
      ]);

      // Log for debugging (remove in production)
      console.log(
        `Password reset for ${email}. Hash starts with: ${newPasswordHash.substring(0, 20)}...`,
      );

      return res.json({
        success: true,
        message: `Password reset for ${email}`,
        environment: process.env.REPL_ID ? "Replit" : "Render/Other",
        hashPrefix: newPasswordHash.substring(0, 7), // $2b$10$ indicates bcrypt
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // One-time setup endpoint to make a user admin or super_admin by email
  app.post("/api/setup/make-admin", async (req, res) => {
    try {
      const { email, role } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const targetRole = role === "super_admin" ? "super_admin" : "admin";

      // Find user by email
      const [rows] = await mysqlPool.query(
        "SELECT id, email, first_name, last_name, role FROM users WHERE email = ?",
        [email],
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = rows[0] as any;

      // Update role to admin/super_admin
      await mysqlPool.query("UPDATE users SET role = ? WHERE id = ?", [
        targetRole,
        user.id,
      ]);

      return res.json({
        success: true,
        message: `User ${email} is now an ${targetRole}`,
        user: { id: user.id, email: user.email, role: targetRole },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // =====================================================
  // PASSWORD RESET ENDPOINTS (Public - No Auth Required)
  // =====================================================

  // Request Password Reset - sends email with reset link
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);

      // If user doesn't exist, inform them to sign up
      if (!user) {
        console.log(`Password reset requested for non-existent email: ${email}`);
        return res.status(404).json({ 
          success: false, 
          error: "No account found with this email address. Please sign up for a new account or contact our office for assistance.",
          needsSignup: true
        });
      }

      // Generate secure token
      const token = generateSecureToken(32);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store the reset token
      await storage.createPasswordResetToken(user.id, token, expiresAt);

      // Send password reset email
      console.log(`[PASSWORD RESET] Attempting to send reset email to ${email} for user ${user.id}`);
      const emailResult = await sendPasswordResetEmail(
        email,
        token,
        user.firstName || undefined
      );

      if (emailResult.success) {
        console.log(`[PASSWORD RESET] SUCCESS - Reset email sent to ${email}, messageId: ${emailResult.messageId}`);
      } else {
        console.error(`[PASSWORD RESET] FAILED - Could not send reset email to ${email}: ${emailResult.error}`);
      }

      // Log the email for tracking
      await storage.createEmailLog({
        clientId: user.id,
        toEmail: email,
        fromEmail: "noreply@ststaxrepair.org",
        subject: "Reset Your Password - STS Tax Repair",
        body: `Password reset requested`,
        emailType: "password_reset",
        status: emailResult.success ? "sent" : "failed",
      });

      return res.json({ 
        success: true, 
        message: "If an account exists with this email, you will receive a password reset link shortly." 
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ error: "An error occurred. Please try again later." });
    }
  });

  // Verify Password Reset Token
  app.get("/api/auth/verify-reset-token", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ valid: false, error: "Token is required" });
      }

      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.json({ valid: false, error: "Invalid or expired reset link" });
      }

      // Check if token has been used
      if (resetToken.usedAt) {
        return res.json({ valid: false, error: "This reset link has already been used" });
      }

      // Check if token has expired
      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.json({ valid: false, error: "This reset link has expired" });
      }

      return res.json({ valid: true });
    } catch (error: any) {
      console.error("Verify reset token error:", error);
      return res.status(500).json({ valid: false, error: "An error occurred" });
    }
  });

  // Complete Password Reset
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }

      // Get the reset token
      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset link" });
      }

      // Check if token has been used
      if (resetToken.usedAt) {
        return res.status(400).json({ error: "This reset link has already been used" });
      }

      // Check if token has expired
      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ error: "This reset link has expired" });
      }

      // Hash the new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      await mysqlPool.query(
        "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
        [newPasswordHash, resetToken.userId]
      );

      // Mark the token as used
      await storage.markPasswordResetTokenUsed(token);

      // Clean up expired tokens
      await storage.deleteExpiredPasswordResetTokens();

      // Get user for logging
      const user = await storage.getUser(resetToken.userId);

      console.log(`Password reset completed for user: ${user?.email || resetToken.userId}`);

      return res.json({ 
        success: true, 
        message: "Your password has been reset successfully. You can now log in with your new password." 
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      return res.status(500).json({ error: "An error occurred. Please try again later." });
    }
  });

  // Debug endpoint to test MySQL connection
  app.get("/api/debug/mysql-test", async (req, res) => {
    try {
      const host = process.env.MYSQL_HOST || "not set";
      const user = process.env.MYSQL_USER || "not set";
      const db = process.env.MYSQL_DATABASE || "not set";
      const hasPassword = process.env.MYSQL_PASSWORD
        ? "YES (length: " + process.env.MYSQL_PASSWORD.length + ")"
        : "NO";

      // Try to connect
      let connectionStatus = "Not tested";
      try {
        const connection = await mysqlPool.getConnection();
        await connection.ping();
        connection.release();
        connectionStatus = "SUCCESS";
      } catch (connError: any) {
        connectionStatus = `FAILED: ${connError.message}`;
      }

      return res.json({
        host,
        user,
        database: db,
        hasPassword,
        connectionStatus,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // COMPREHENSIVE DATABASE DIAGNOSTIC ROUTE
  // Claude AI diagnosis: Render connects but returns 0 results (should be 869 clients)
  app.get("/api/debug/database", async (req, res) => {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.REPL_ID ? "Replit" : "Render/Other",
      results: {},
    };

    try {
      // 1. CONNECTION INFO
      diagnostics.results.connectionInfo = {
        MYSQL_HOST: process.env.MYSQL_HOST || "NOT SET",
        MYSQL_DATABASE: process.env.MYSQL_DATABASE || "NOT SET",
        MYSQL_USER: process.env.MYSQL_USER || "NOT SET",
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD
          ? `SET (${process.env.MYSQL_PASSWORD.length} chars)`
          : "NOT SET",
        MYSQL_PORT: process.env.MYSQL_PORT || "3306 (default)",
      };

      // 2. TEST RAW CONNECTION
      let connection;
      try {
        connection = await mysqlPool.getConnection();
        await connection.ping();
        diagnostics.results.connectionTest = {
          status: "SUCCESS",
          message: "Pool connection acquired and ping successful",
        };
      } catch (connError: any) {
        diagnostics.results.connectionTest = {
          status: "FAILED",
          error: connError.message,
        };
        return res.json(diagnostics);
      }

      // 3. WHAT DATABASE ARE WE CONNECTED TO?
      try {
        const [dbResult] = await connection.query(
          "SELECT DATABASE() as currentDatabase, USER() as currentUser, VERSION() as mysqlVersion",
        );
        diagnostics.results.currentConnection = (dbResult as any[])[0];
      } catch (e: any) {
        diagnostics.results.currentConnection = { error: e.message };
      }

      // 4. LIST ALL TABLES
      try {
        const [tables] = await connection.query("SHOW TABLES");
        diagnostics.results.allTables = {
          count: (tables as any[]).length,
          tables: (tables as any[]).map((t: any) => Object.values(t)[0]),
        };
      } catch (e: any) {
        diagnostics.results.allTables = { error: e.message };
      }

      // 5. RAW COUNT QUERIES (bypasses Drizzle)
      try {
        const [usersCount] = await connection.query(
          "SELECT COUNT(*) as count FROM users",
        );
        const [clientsCount] = await connection.query(
          "SELECT COUNT(*) as count FROM users WHERE role = 'client' OR role IS NULL",
        );
        const [staffCount] = await connection.query(
          "SELECT COUNT(*) as count FROM users WHERE role IN ('admin', 'staff', 'manager', 'agent', 'tax_office')",
        );

        diagnostics.results.rawCounts = {
          totalUsers: (usersCount as any[])[0].count,
          clients: (clientsCount as any[])[0].count,
          staff: (staffCount as any[])[0].count,
        };
      } catch (e: any) {
        diagnostics.results.rawCounts = { error: e.message };
      }

      // 6. DESCRIBE USERS TABLE STRUCTURE
      try {
        const [columns] = await connection.query("DESCRIBE users");
        diagnostics.results.usersTableStructure = {
          columnCount: (columns as any[]).length,
          columns: (columns as any[]).map((c: any) => ({
            field: c.Field,
            type: c.Type,
            null: c.Null,
            key: c.Key,
            default: c.Default,
          })),
        };
      } catch (e: any) {
        diagnostics.results.usersTableStructure = { error: e.message };
      }

      // 7. SAMPLE RAW DATA (first 5 users)
      try {
        const [sampleUsers] = await connection.query(
          "SELECT id, email, first_name, last_name, role, is_active FROM users LIMIT 5",
        );
        diagnostics.results.sampleUsersRaw = {
          count: (sampleUsers as any[]).length,
          data: sampleUsers,
        };
      } catch (e: any) {
        diagnostics.results.sampleUsersRaw = { error: e.message };
      }

      // 8. CHECK FOR PERFEX-IMPORTED CLIENTS
      try {
        const [perfexClients] = await connection.query(
          "SELECT COUNT(*) as count FROM users WHERE id LIKE 'perfex-%'",
        );
        diagnostics.results.perfexImportedClients = (
          perfexClients as any[]
        )[0].count;
      } catch (e: any) {
        diagnostics.results.perfexImportedClients = { error: e.message };
      }

      // 9. DRIZZLE ORM QUERY (compare with raw)
      try {
        const drizzleUsers = await storage.getUsers();
        diagnostics.results.drizzleQuery = {
          status: "SUCCESS",
          count: drizzleUsers.length,
          sampleIds: drizzleUsers
            .slice(0, 5)
            .map((u) => ({ id: u.id, email: u.email, role: u.role })),
        };
      } catch (e: any) {
        diagnostics.results.drizzleQuery = {
          status: "FAILED",
          error: e.message,
        };
      }

      // 10. CHECK TABLE GRANTS/PERMISSIONS
      try {
        const [grants] = await connection.query(
          "SHOW GRANTS FOR CURRENT_USER()",
        );
        diagnostics.results.userPermissions = (grants as any[]).map(
          (g: any) => Object.values(g)[0],
        );
      } catch (e: any) {
        diagnostics.results.userPermissions = { error: e.message };
      }

      // 11. CHECK IF IT'S THE RIGHT DATABASE
      try {
        const dbName = process.env.MYSQL_DATABASE;
        const [tableCheck] = await connection.query(
          `SELECT TABLE_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
          [dbName],
        );
        diagnostics.results.informationSchemaCheck = {
          database: dbName,
          tables: (tableCheck as any[]).map((t) => ({
            name: t.TABLE_NAME,
            estimatedRows: t.TABLE_ROWS,
          })),
        };
      } catch (e: any) {
        diagnostics.results.informationSchemaCheck = { error: e.message };
      }

      connection.release();

      // SUMMARY
      diagnostics.summary = {
        connectionWorks:
          diagnostics.results.connectionTest?.status === "SUCCESS",
        rawUserCount: diagnostics.results.rawCounts?.totalUsers || 0,
        drizzleUserCount: diagnostics.results.drizzleQuery?.count || 0,
        tablesFound: diagnostics.results.allTables?.count || 0,
        mismatch:
          (diagnostics.results.rawCounts?.totalUsers || 0) !==
          (diagnostics.results.drizzleQuery?.count || 0),
      };

      return res.json(diagnostics);
    } catch (error: any) {
      diagnostics.error = error.message;
      diagnostics.stack = error.stack;
      return res.status(500).json(diagnostics);
    }
  });

  // Run MySQL migrations on startup
  await runMySQLMigrations();

  // Setup Authentication
  await setupAuth(app);

  // DEBUG SESSION ROUTE - Check session state (must be AFTER setupAuth)
  app.get("/api/debug/session", (req: any, res) => {
    return res.json({
      sessionID: req.sessionID,
      hasSession: !!req.session,
      sessionData: req.session
        ? {
            userId: req.session.userId || null,
            userRole: req.session.userRole || null,
            isClientLogin: req.session.isClientLogin || false,
            isAdminLogin: req.session.isAdminLogin || false,
            cookie: req.session.cookie,
          }
        : null,
      cookies: req.headers.cookie || "none",
      isAuthenticated: req.isAuthenticated?.() || false,
      user: req.user || null,
    });
  });

  // Redirect Perfex document URLs to the actual Perfex server
  // Perfex stores files at: uploads/clients/perfex-{CLIENT_ID}/filename
  // Accessed via: /download/preview_image?path=uploads/clients/perfex-{CLIENT_ID}/filename
  app.get("/perfex-uploads/uploads/customers/:clientId/*", (req, res) => {
    const perfexBaseUrl = "https://ststaxrepair.org";
    const perfexId = req.params.clientId;
    // Get filename from the path (everything after /customers/clientId/)
    const pathParts = req.path.split(`/customers/${perfexId}/`);
    const filename = pathParts[1] || "";
    // Convert Perfex numeric ID to CRM folder format: perfex-{id}
    const clientFolder = perfexId.startsWith('perfex-') ? perfexId : `perfex-${perfexId}`;
    const filePath = `uploads/clients/${clientFolder}/${filename}`;
    const fullUrl = `${perfexBaseUrl}/download/preview_image?path=${encodeURIComponent(filePath)}`;
    return res.redirect(fullUrl);
  });

  // Serve documents from GoDaddy FTP storage
  // This endpoint handles document preview/download requests
  app.get("/download/preview_image", async (req, res) => {
    try {
      const path = req.query.path as string;

      if (!path) {
        console.error('[DOWNLOAD] No path provided');
        return res.status(400).send('Path parameter is required');
      }

      console.log(`[DOWNLOAD] Fetching file from GoDaddy: ${path}`);

      // Construct the full URL to the file on GoDaddy
      const fileUrl = `https://ststaxrepair.org/${path}`;

      // Fetch the file from GoDaddy
      const response = await fetch(fileUrl);

      if (!response.ok) {
        console.error(`[DOWNLOAD] File not found on GoDaddy: ${fileUrl} (Status: ${response.status})`);
        return res.status(404).send('File not found');
      }

      // Get the content type from the response
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // Set appropriate headers
      res.setHeader('Content-Type', contentType);

      // Stream the file to the client
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));

      console.log(`[DOWNLOAD] Successfully streamed file: ${path}`);
    } catch (error) {
      console.error('[DOWNLOAD] Error fetching file:', error);
      res.status(500).send('Error fetching file');
    }
  });

  // Auth routes - supports both Replit Auth and client/admin session login
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      // Check for session-based login (both client and admin)
      if (
        req.session?.userId &&
        (req.session?.isClientLogin || req.session?.isAdminLogin)
      ) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          return res.json(user);
        }
      }

      // Fall back to Replit Auth
      if (req.user?.claims?.sub) {
        const user = await storage.getUser(req.user.claims.sub);
        return res.json(user);
      }

      // Not authenticated
      return res.json(null);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Client Registration (public endpoint)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        phone,
        password,
        address,
        city,
        zipCode,
        state,
        country,
        fullName,
        phoneSecondary,
        email,
        birthday,
        occupation,
        irsUsername,
        irsPassword,
        ssn,
        referredById,
        directDepositBank,
        bankRoutingNumber,
        bankAccountNumber,
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !password || !fullName) {
        return res
          .status(400)
          .json({
            message:
              "Required fields missing: firstName, lastName, email, password, fullName",
          });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        // Return specific error code to handle on frontend
        const errorCode = existingUser.emailVerifiedAt ? 'ACCOUNT_EXISTS_VERIFIED' : 'ACCOUNT_EXISTS_UNVERIFIED';
        return res.status(400).json({ 
          message: "An account with this email already exists",
          code: errorCode,
          email: email
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Extract last 4 of SSN and encrypt full SSN
      const ssnLast4 = ssn ? ssn.replace(/\D/g, "").slice(-4) : null;
      const ssnEncrypted = ssn ? encrypt(ssn) : null;

      // Encrypt sensitive data
      const irsUsernameEncrypted = irsUsername ? encrypt(irsUsername) : null;
      const irsPasswordEncrypted = irsPassword ? encrypt(irsPassword) : null;
      const bankRoutingEncrypted = bankRoutingNumber
        ? encrypt(bankRoutingNumber)
        : null;
      const bankAccountEncrypted = bankAccountNumber
        ? encrypt(bankAccountNumber)
        : null;

      // If client selected a referrer, get the referrer's office and assign the client
      let clientOfficeId: string | null = null;
      let assignedTo: string | null = null;
      let referralSourceText: string | null = null;
      
      if (referredById && referredById !== 'none') {
        const referrer = await storage.getUser(referredById);
        if (referrer) {
          // Assign client to referrer's office
          clientOfficeId = referrer.officeId || null;
          // Set referrer as the client's assigned agent
          assignedTo = referrer.id;
          // Store referral source text
          referralSourceText = `${referrer.firstName || ''} ${referrer.lastName || ''}`.trim();
        }
      }

      // Create user with basic profile fields (extended fields stored separately if needed)
      const user = await storage.upsertUser({
        id: crypto.randomUUID(),
        email,
        firstName,
        lastName,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        country: country || "United States",
        role: "client",
        isActive: true,
        passwordHash,
        officeId: clientOfficeId,
        assignedTo: assignedTo,
        referralSource: referralSourceText,
      });

      // Create email verification token (expires in 24 hours)
      const verificationToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await storage.createEmailVerificationToken(
        user.id,
        email,
        verificationToken,
        expiresAt
      );

      // Send verification email (non-blocking)
      sendEmailVerificationEmail(email, verificationToken, firstName)
        .then(result => {
          if (result.success) {
            console.log(`Verification email sent to ${email}`);
          } else {
            console.warn(`Failed to send verification email to ${email}:`, result.error);
          }
        })
        .catch(err => {
          console.error(`Error sending verification email to ${email}:`, err);
        });

      // Notify admins about the new client signup (email + in-app), but don't block signup
      try {
        const admins = await mysqlStorage.getUsersByRole('admin');
        const adminPortalUrl =
          (process.env.APP_URL ||
            process.env.RENDER_EXTERNAL_URL ||
            'https://ststaxrepair.org') + '/clients';
        const newClientName = `${firstName} ${lastName}`.trim() || 'New client';

        for (const admin of admins) {
          // In-app notification
          await mysqlStorage.createNotification({
            userId: admin.id,
            type: 'client_signup',
            title: 'New Client Signed Up',
            message: `${newClientName} (${email}) created an account.`,
            link: '/clients',
            resourceType: 'client',
            resourceId: user.id
          });

          // Email notification (best effort)
          if (admin.email && admin.isActive !== false) {
            await sendEmail({
              to: admin.email,
              subject: `New Client Signup: ${newClientName || email}`,
              html: `
                <p>Hello ${admin.firstName || 'Admin'},</p>
                <p>A new client has signed up:</p>
                <ul>
                  <li>Name: ${newClientName}</li>
                  <li>Email: ${email}</li>
                </ul>
                <p>You can review the client in the admin dashboard:</p>
                <p><a href="${adminPortalUrl}" target="_blank">View Clients</a></p>
              `,
            });
          }
        }
      } catch (notifError) {
        console.error('[NOTIFICATION] Failed to send admin signup notifications:', notifError);
      }

      return res.status(201).json({
        message: "Registration successful. Please check your email to verify your account.",
        userId: user.id,
        requiresVerification: true,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      return res
        .status(500)
        .json({ message: error.message || "Registration failed" });
    }
  });

  // Verify Email Endpoint
  app.get("/api/auth/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      // Get the verification token
      const verificationToken = await storage.getEmailVerificationToken(token);
      
      if (!verificationToken) {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      // Check if token has expired
      if (new Date() > verificationToken.expiresAt) {
        return res.status(400).json({ message: "Verification token has expired. Please request a new one." });
      }

      // Check if token has already been used
      if (verificationToken.usedAt) {
        return res.status(400).json({ message: "This verification link has already been used." });
      }

      // Mark token as used
      await storage.markEmailVerificationTokenUsed(token);

      // Mark user's email as verified
      await storage.markUserEmailVerified(verificationToken.userId);

      // Get user details for welcome email
      const user = await storage.getUser(verificationToken.userId);
      
      if (user && user.email) {
        // Send welcome email after verification (non-blocking)
        sendWelcomeEmail(user.email, user.firstName || 'there', user.role || 'client')
          .then(result => {
            if (result.success) {
              console.log(`Welcome email sent to ${user.email} after verification`);
            } else {
              console.warn(`Failed to send welcome email to ${user.email}:`, result.error);
            }
          })
          .catch(err => {
            console.error(`Error sending welcome email to ${user.email}:`, err);
          });
      }

      return res.json({ 
        message: "Email verified successfully! You can now log in to your account.",
        verified: true 
      });
    } catch (error: any) {
      console.error("Email verification error:", error);
      return res.status(500).json({ message: "Email verification failed. Please try again." });
    }
  });

  // Resend Verification Email
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Return success even if user doesn't exist (security: don't reveal if email exists)
        return res.json({ message: "If an account exists with this email, a verification link has been sent." });
      }

      // Check if already verified
      if (user.emailVerifiedAt) {
        return res.status(400).json({ message: "This email is already verified. You can log in." });
      }

      // Check for existing active token
      const existingToken = await storage.getEmailVerificationTokenByUserId(user.id);
      
      if (existingToken) {
        // Check resend rate limit (max 5 resends)
        if ((existingToken.resendCount || 0) >= 5) {
          return res.status(429).json({ 
            message: "Too many verification requests. Please try again later or contact support." 
          });
        }
        
        // Increment resend count and send the same token
        await storage.incrementEmailVerificationResendCount(existingToken.token);
        
        // Resend verification email
        const result = await sendEmailVerificationEmail(email, existingToken.token, user.firstName || undefined);
        
        if (result.success) {
          return res.json({ message: "Verification email has been resent. Please check your inbox." });
        } else {
          return res.status(500).json({ message: "Failed to send verification email. Please try again." });
        }
      }

      // Create new verification token (expires in 24 hours)
      const newToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await storage.createEmailVerificationToken(
        user.id,
        email,
        newToken,
        expiresAt
      );

      // Send verification email
      const result = await sendEmailVerificationEmail(email, newToken, user.firstName || undefined);
      
      if (result.success) {
        return res.json({ message: "Verification email has been sent. Please check your inbox." });
      } else {
        return res.status(500).json({ message: "Failed to send verification email. Please try again." });
      }
    } catch (error: any) {
      console.error("Resend verification error:", error);
      return res.status(500).json({ message: "Failed to resend verification email. Please try again." });
    }
  });

  // Check Verification Status
  app.get("/api/auth/verification-status", async (req: any, res) => {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email as string);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({
        isVerified: !!user.emailVerifiedAt,
        verifiedAt: user.emailVerifiedAt
      });
    } catch (error: any) {
      console.error("Verification status check error:", error);
      return res.status(500).json({ message: "Failed to check verification status" });
    }
  });

  // Admin/Staff Login (email/password) - for non-Replit environments
  app.post("/api/admin/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user has a password hash set
      if (!user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user is admin or staff (not client)
      if (user.role === "client") {
        return res
          .status(403)
          .json({
            message:
              "Access denied. This login is for staff and administrators only.",
          });
      }

      // Check if user is active
      if (!user.isActive) {
        return res
          .status(403)
          .json({ message: "Account is deactivated. Please contact support." });
      }

      // Create session for admin/staff
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.isAdminLogin = true;

      // Explicitly save session to ensure it persists
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        redirectUrl: "/dashboard",
      });
    } catch (error: any) {
      console.error("Admin login error:", error);
      return res
        .status(500)
        .json({ message: "Login failed. Please try again." });
    }
  });

  // Admin Test Email Endpoint - for verifying email configuration
  app.post("/api/admin/test-email", isAuthenticated, requireAdmin(), async (req: any, res) => {
    try {
      const { email } = req.body;
      const userId = req.userId || req.user?.claims?.sub;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email address is required" 
        });
      }

      console.log(`[EMAIL TEST] Admin ${userId} requested test email to: ${email}`);
      
      // Check if SendGrid is configured
      const sendGridConfigured = !!process.env.SENDGRID_API_KEY;
      if (!sendGridConfigured) {
        return res.json({
          success: false,
          message: "SendGrid API key is not configured. Please add SENDGRID_API_KEY to your environment variables.",
          diagnostics: {
            sendGridConfigured: false,
            appUrl: process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'not set',
            nodeEnv: process.env.NODE_ENV || 'not set'
          }
        });
      }
      
      // Send a test email using the password reset template
      const result = await sendPasswordResetEmail(email, 'TEST-TOKEN-DO-NOT-USE', 'Admin');
      
      return res.json({
        success: result.success,
        message: result.success 
          ? `Test email sent successfully to ${email}. Please check your inbox (and spam folder).`
          : `Failed to send test email: ${result.error}`,
        diagnostics: {
          sendGridConfigured: true,
          appUrl: process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'not set',
          nodeEnv: process.env.NODE_ENV || 'not set',
          messageId: result.messageId
        }
      });
    } catch (error: any) {
      console.error("[EMAIL TEST] Error:", error);
      return res.status(500).json({ 
        success: false, 
        message: `Email test failed: ${error.message}` 
      });
    }
  });

  // Email System Diagnostics (public endpoint for quick check)
  app.get("/api/email-status", (req, res) => {
    const sendGridConfigured = !!process.env.SENDGRID_API_KEY;
    res.json({
      sendGridConfigured,
      fromEmail: 'ststaxrepair@gmail.com',
      appUrl: process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || (process.env.NODE_ENV === 'production' ? 'https://ststaxrepair.org' : 'development'),
      nodeEnv: process.env.NODE_ENV || 'not set',
      message: sendGridConfigured 
        ? 'Email system is configured and ready' 
        : 'WARNING: SENDGRID_API_KEY is not set. Emails will NOT be sent!'
    });
  });

  // Temporary diagnostic endpoint to check user account status
  app.get("/api/debug/user-status/:email", async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.json({ 
          found: false, 
          message: "User not found in database",
          email 
        });
      }
      
      res.json({
        found: true,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        hasPasswordHash: !!user.passwordHash,
        passwordHashLength: user.passwordHash?.length || 0,
        emailVerified: !!user.emailVerifiedAt,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Temporary endpoint to manually verify a user's email
  app.post("/api/debug/verify-email/:email", async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update the user's emailVerifiedAt field
      await storage.upsertUser({
        ...user,
        emailVerifiedAt: new Date()
      });
      
      res.json({
        success: true,
        message: `Email verified for ${email}`,
        email: user.email
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Client Login (email/password) - public endpoint
  app.post("/api/client-login", async (req: any, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`[CLIENT-LOGIN] User not found for email: ${email}`);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user has a password hash set
      if (!user.passwordHash) {
        console.log(`[CLIENT-LOGIN] No password hash for email: ${email}`);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        console.log(`[CLIENT-LOGIN] Invalid password for email: ${email}`);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user is NOT a client (staff/admin should use /api/admin/login)
      if (user.role !== "client") {
        return res
          .status(403)
          .json({
            message:
              "Access denied. This login is for clients only. Staff and administrators should use the staff login.",
          });
      }

      // Check if user is active
      if (!user.isActive) {
        return res
          .status(403)
          .json({ message: "Account is deactivated. Please contact support." });
      }

      // SECURITY: Enforce email verification before allowing login
      if (!user.emailVerifiedAt) {
        return res.status(403).json({ 
          message: "Please verify your email address before logging in. Check your inbox for the verification link.",
          needsVerification: true,
          email: user.email
        });
      }

      // Create session for the client
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.isClientLogin = true;
      req.session.isAdminLogin = false;

      // Explicitly save session to ensure it persists
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        redirectUrl: "/client-portal",
      });
    } catch (error: any) {
      console.error("Client login error:", error);
      return res
        .status(500)
        .json({ message: "Login failed. Please try again." });
    }
  });

  // Get referrers list for registration (public endpoint)
  // Returns staff grouped by Tax Office with role information
  app.get("/api/users/referrers", async (req, res) => {
    const diagId = `referrers-${Date.now()}`;
    try {
      // Get all users and offices
      const users = await storage.getUsers();
      // Ensure offices is an array even if storage method is missing
      const offices = typeof storage.getOffices === 'function' ? await storage.getOffices() : [];
      
      // Create office lookup map
      const officeMap = new Map(offices.map((o: any) => [o.id, o.name]));
      
      // Filter to only staff members (not clients)
      const staffMembers = users.filter((u) => {
        const role = (u.role || '').toLowerCase();
        // Check activity status robustly - handle boolean, null, and potential numeric values from MySQL
        const isActive = u.isActive !== false;
        // Include everyone who is not a client and is active
        return role !== "client" && isActive;
      });
      
      console.log(`[${diagId}] Referrers API - Found ${staffMembers.length} staff members out of ${users.length} total users`);
      
      // Map staff with office and role info
      const referrers = staffMembers.map((u) => {
        // Get office name or default to STS TaxRepair
        const officeName = u.officeId ? officeMap.get(u.officeId) || 'STS TaxRepair' : 'STS TaxRepair';
        
        // Format role for display
        const roleLabels: Record<string, string> = {
          'super_admin': 'STS HQ',
          'admin': 'Admin',
          'tax_office': 'Tax Office',
          'agent': 'Tax Preparer',
          'tax_office_admin': 'Office Admin',
          'manager': 'Manager',
          'staff': 'Staff',
          'owner': 'Owner'
        };
        
        const rawRole = (u.role || '').toLowerCase();
        const roleLabel = roleLabels[rawRole] || u.role || 'Staff';
        
        return {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Anonymous Staff',
          role: u.role,
          roleLabel,
          officeId: u.officeId,
          officeName,
        };
      });
      
      // Sort by office name, then by role (admins first), then by name
      referrers.sort((a, b) => {
        // First by office name
        if (a.officeName !== b.officeName) {
          return a.officeName.localeCompare(b.officeName);
        }
        // Then by role priority (HQ first)
        const rolePriority: Record<string, number> = { 
          'super_admin': 1,
          'admin': 2, 
          'owner': 3, 
          'tax_office': 4,
          'tax_office_admin': 5, 
          'manager': 6, 
          'staff': 7, 
          'agent': 8 
        };
        const aPriority = rolePriority[a.role?.toLowerCase() || ''] || 10;
        const bPriority = rolePriority[b.role?.toLowerCase() || ''] || 10;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Then by name
        return (a.fullName || '').localeCompare(b.fullName || '');
      });
      
      console.log(`[${diagId}] Referrers API - Returning ${referrers.length} referrers`);
      res.json(referrers);
    } catch (error: any) {
      console.error(`[${diagId}] Error fetching referrers:`, error);
      // Do not block registration if referrers can't be fetched; return empty list gracefully
      res.setHeader('X-Diag-Id', diagId);
      res.status(200).json([]);
    }
  });

  // Users (for staff to select clients) - requires clients.view permission
  // Role-based filtering: Agents only see assigned clients, Admins see all
  // Staff members are always visible for assignee dropdowns
  app.get(
    "/api/users",
    isAuthenticated,
    requirePermission("clients.view"),
    async (req: any, res) => {
      try {
        const userId = req.userId || req.user?.claims?.sub;
        const currentUser = await storage.getUser(userId);
        const allUsers = await storage.getUsers();
        const userRole = currentUser?.role?.toLowerCase();
        
        // CRITICAL: Admins see ALL users, agents only see assigned clients
        // Admins have full system visibility
        if (userRole === 'admin' || userRole === 'owner') {
          return res.json(allUsers);
        }
        
        // Agents/staff only see clients assigned to them
        // Assignment can be via: 1) users.assigned_to field, 2) tax_filings.preparerId
        // Staff members (non-clients) are always visible for assignee dropdowns
        const taxFilings = await storage.getTaxFilings();
        const filingAssignedClientIds = new Set(
          taxFilings
            .filter(f => f.preparerId === userId)
            .map(f => f.clientId)
        );
        
        const filteredUsers = allUsers.filter(user => {
          const role = user.role?.toLowerCase();
          // Staff members (non-clients) are always visible for assignment dropdowns
          if (role !== 'client') return true;
          // Check if client is assigned to this staff member via assigned_to field
          if ((user as any).assignedTo === userId) return true;
          // Check if client is assigned via tax_filings preparer
          if (filingAssignedClientIds.has(user.id)) return true;
          return false;
        });
        
        res.json(filteredUsers);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Create new client - requires clients.create permission
  // Note: Only allows creating clients (role='client'), not staff/admin
  app.post(
    "/api/users",
    isAuthenticated,
    requirePermission("clients.create"),
    async (req: any, res) => {
      try {
        // Extract only allowed fields - prevent privilege escalation by ignoring id, role, passwordHash
        const { firstName, lastName, email, phone, address, city, state, zipCode, country } = req.body;
        
        // Validate required email
        if (!email || typeof email !== 'string' || email.trim().length === 0) {
          return res.status(400).json({ error: "Email is required" });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return res.status(400).json({ error: "Invalid email format" });
        }

        // Check if email already exists
        const existingUser = await storage.getUserByEmail(email.trim());
        if (existingUser) {
          return res.status(400).json({ error: "A client with this email already exists" });
        }

        // Create the new client - explicitly set role to 'client' to prevent privilege escalation
        const newUser = await storage.upsertUser({
          email: email.trim(),
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          phone: phone?.trim() || null,
          address: address?.trim() || null,
          city: city?.trim() || null,
          state: state?.trim() || null,
          zipCode: zipCode?.trim() || null,
          country: country?.trim() || 'United States',
          role: 'client', // Always force client role
          isActive: true,
        });

        res.status(201).json(newUser);
      } catch (error: any) {
        console.error("Error creating client:", error);
        res.status(500).json({ error: error.message || "Failed to create client" });
      }
    },
  );

  // Get single user by ID - requires clients.view permission
  app.get(
    "/api/users/:id",
    isAuthenticated,
    requirePermission("clients.view"),
    async (req, res) => {
      try {
        const user = await storage.getUser(req.params.id);
        if (!user) {
          return res.status(404).json({ error: "Client not found" });
        }
        res.json(user);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Update user role (admin only)
  app.patch("/api/users/:id/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const adminUser = await storage.getUser(userId);
      if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "super_admin")) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { role, reason } = req.body;
      if (!role || !["client", "agent", "tax_office", "admin", "super_admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      // Only a super admin can grant or revoke super admin access
      if (role === "super_admin" && adminUser.role !== "super_admin") {
        return res.status(403).json({ error: "Super Admin access required to assign this role" });
      }

      const adminName =
        `${adminUser.firstName || ""} ${adminUser.lastName || ""}`.trim() ||
        adminUser.email ||
        "Admin";
      const user = await storage.updateUserRole(
        req.params.id,
        role,
        userId,
        adminName,
        reason,
      );

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user status (admin only)
  app.patch("/api/users/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const adminUser = await storage.getUser(userId);
      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ error: "isActive must be a boolean" });
      }

      const user = await storage.updateUserStatus(req.params.id, isActive);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user profile (admin/staff can update any client)
  app.patch("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.userId || req.user?.claims?.sub;
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }
      
      // Only admin, tax_office, or agent can update client profiles
      // Or users can update their own profile
      const targetUserId = req.params.id;
      const isAdmin = currentUser.role === "admin" || currentUser.role === "super_admin";
      const isStaff = currentUser.role === "tax_office" || currentUser.role === "agent";
      const isSelf = currentUserId === targetUserId;
      
      if (!isAdmin && !isStaff && !isSelf) {
        return res.status(403).json({ error: "Not authorized to update this profile" });
      }
      
      const { firstName, lastName, email, phone, address, city, state, zipCode } = req.body;
      
      const user = await storage.updateUser(targetUserId, {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zipCode
      });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get users by role - admin only
  app.get(
    "/api/users/role/:role",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        const role = req.params.role as any;
        if (!["client", "agent", "tax_office", "admin", "super_admin"].includes(role)) {
          return res.status(400).json({ error: "Invalid role" });
        }
        const users = await storage.getUsersByRole(role);
        res.json(users);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Role Audit Log (admin only)
  app.get("/api/role-audit-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const adminUser = await storage.getUser(userId);
      if (
        !adminUser ||
        (adminUser.role !== "admin" && adminUser.role !== "tax_office")
      ) {
        return res
          .status(403)
          .json({ error: "Admin or Tax Office access required" });
      }
      const logs = await storage.getRoleAuditLogs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update current user's profile
  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      // Get user ID from middleware (works for both auth methods)
      const userId = req.userId || req.session?.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Extract allowed update fields (prevent role/status updates through this endpoint)
      const {
        firstName,
        lastName,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
      } = req.body;

      const updatedUser = await storage.upsertUser({
        id: userId,
        email: existingUser.email,
        firstName: firstName ?? existingUser.firstName,
        lastName: lastName ?? existingUser.lastName,
        profileImageUrl: existingUser.profileImageUrl,
        phone: phone ?? existingUser.phone,
        address: address ?? existingUser.address,
        city: city ?? existingUser.city,
        state: state ?? existingUser.state,
        zipCode: zipCode ?? existingUser.zipCode,
        country: country ?? existingUser.country,
        role: existingUser.role,
        isActive: existingUser.isActive,
      });

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload profile photo
  app.post("/api/profile/photo", isAuthenticated, async (req: any, res) => {
    try {
      // Get user ID from middleware (works for both auth methods)
      const userId = req.userId || req.session?.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const preferFtp = process.env.PROFILE_PHOTO_MODE === "ftp";
      const hasObjectStorage = !preferFtp && !!process.env.PRIVATE_OBJECT_DIR;

      // Prefer object storage when configured and not forced to FTP
      if (hasObjectStorage) {
        try {
          const objectStorage = new ObjectStorageService();
          const fileName = `profile-photo-${Date.now()}.jpg`;
          const { uploadURL, objectPath } =
            await objectStorage.getProfilePhotoUploadURL(userId, fileName);

          return res.json({
            uploadURL,
            objectPath,
            mode: "object-storage",
            message:
              "Use the uploadURL to PUT the file, then call /api/profile/photo/confirm with the objectPath",
          });
        } catch (error) {
          console.warn(
            "[profile-photo] Object storage unavailable, falling back to FTP:",
            error instanceof Error ? error.message : error,
          );
        }
      }

      // FTP fallback for environments without object storage
      const sanitizedFileName = `profile-${Date.now()}.jpg`;
      const objectPath = `/ftp/uploads/profile-photos/${userId}/${sanitizedFileName}`;
      const uploadURL = `/api/profile/photo/upload-ftp?userId=${encodeURIComponent(
        userId
      )}&objectPath=${encodeURIComponent(objectPath)}&fileName=${encodeURIComponent(
        sanitizedFileName
      )}`;

      return res.json({
        uploadURL,
        objectPath,
        mode: "ftp",
        message:
          "PUT the binary file to uploadURL, then call /api/profile/photo/confirm with the objectPath",
      });
    } catch (error: any) {
      console.error("Photo upload URL error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // FTP upload endpoint for profile photos (binary PUT)
  app.put("/api/profile/photo/upload-ftp", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.query.userId as string) || req.userId || req.session?.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const fileName =
        (req.query.fileName as string) ||
        (req.headers["x-file-name"] as string) ||
        `profile-${Date.now()}.jpg`;

      let fileBuffer: Buffer | undefined = req.rawBody as Buffer;
      if (!fileBuffer || fileBuffer.length === 0) {
        // Fallback: collect stream (for image/jpeg, etc.)
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve) => {
          req.on("data", (chunk: Buffer) => chunks.push(chunk));
          req.on("end", () => resolve());
        });
        fileBuffer = Buffer.concat(chunks);
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return res.status(400).json({ error: "No file content provided" });
      }

      const uploadResult = await ftpStorageService.uploadFile(
        userId,
        fileName,
        fileBuffer,
        req.headers["content-type"] as string | undefined,
        "uploads/profile-photos"
      );

      return res.json({
        success: true,
        objectPath: `/ftp/${uploadResult.filePath}`,
        fileUrl: uploadResult.fileUrl,
      });
    } catch (error: any) {
      console.error("FTP profile photo upload error:", error);
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  });

  // Confirm profile photo upload and update user record
  app.post(
    "/api/profile/photo/confirm",
    isAuthenticated,
    async (req: any, res) => {
      try {
        // Get user ID from middleware (works for both auth methods)
        const userId =
          req.userId || req.session?.userId || req.user?.claims?.sub;
        if (!userId) {
          return res.status(401).json({ error: "Not authenticated" });
        }

        const existingUser = await storage.getUser(userId);
        if (!existingUser) {
          return res.status(404).json({ error: "User not found" });
        }

        const { objectPath } = req.body;
        if (!objectPath) {
          return res.status(400).json({ error: "objectPath is required" });
        }

        // Generate the URL to serve this photo
        const profileImageUrl = `/api/profile/photo/${userId}`;

        // Update user with new profile image URL
        const updatedUser = await storage.upsertUser({
          id: userId,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          profileImageUrl: objectPath, // Store object path for retrieval
          phone: existingUser.phone,
          address: existingUser.address,
          city: existingUser.city,
          state: existingUser.state,
          zipCode: existingUser.zipCode,
          country: existingUser.country,
          role: existingUser.role,
          isActive: existingUser.isActive,
        });

        res.json({
          success: true,
          profileImageUrl,
          user: updatedUser,
        });
      } catch (error: any) {
        console.error("Photo confirm error:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Serve profile photo from storage (object storage or FTP)
  app.get("/api/profile/photo/:userId", async (req: any, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user || !user.profileImageUrl) {
        return res.status(404).json({ error: "Photo not found" });
      }

      const imageUrl = user.profileImageUrl;

      // External URL
      if (imageUrl.startsWith("http")) {
        return res.redirect(imageUrl);
      }

      // FTP-backed photo
      if (imageUrl.startsWith("/ftp/")) {
        const relativePath = imageUrl.replace("/ftp/", "");
        const success = await ftpStorageService.streamFileToResponse(
          relativePath,
          res,
          "profile-photo"
        );
        if (success) return;
        return res.status(404).json({ error: "Photo not found on FTP" });
      }

      // Object storage
      const objectStorage = new ObjectStorageService();
      const file = await objectStorage.getPrivateObject(imageUrl);
      if (!file) {
        return res.status(404).json({ error: "Photo not found in storage" });
      }

      await objectStorage.downloadObject(file, res);
    } catch (error: any) {
      console.error("Photo serve error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Staff Invites (admin only)
  app.get("/api/staff-invites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const adminUser = await storage.getUser(userId);
      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const invites = await storage.getStaffInvites();
      res.json(invites);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create staff invite (admin only)
  app.post("/api/staff-invites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const adminUser = await storage.getUser(userId);
      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { email, role } = req.body;
      if (!email || !role || !["agent", "tax_office", "admin"].includes(role)) {
        return res.status(400).json({ error: "Valid email and role required" });
      }

      const crypto = await import("crypto");
      const inviteCode = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const adminName =
        `${adminUser.firstName || ""} ${adminUser.lastName || ""}`.trim() ||
        adminUser.email ||
        "Admin";

      const invite = await storage.createStaffInvite({
        email,
        role,
        inviteCode,
        invitedById: userId,
        invitedByName: adminName,
        expiresAt,
      });

      // Send invitation email (non-blocking)
      sendStaffInviteEmail(email, role, inviteCode, adminName)
        .catch((err) => {
          console.warn(`Failed to send staff invite email to ${email}:`, err);
        });

      res.status(201).json(invite);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Validate staff invite (public - check if invite is valid before showing form)
  app.get("/api/staff-invites/validate/:code", async (req, res) => {
    try {
      const { code } = req.params;
      if (!code) {
        return res.status(400).json({ valid: false, error: "Invite code required" });
      }

      const invite = await storage.getStaffInviteByCode(code);
      if (!invite) {
        return res.status(404).json({ valid: false, error: "Invalid invite code" });
      }

      if (invite.usedAt) {
        return res.status(400).json({ valid: false, error: "This invitation has already been used" });
      }

      if (new Date(invite.expiresAt) < new Date()) {
        return res.status(400).json({ valid: false, error: "This invitation has expired" });
      }

      res.json({ 
        valid: true, 
        email: invite.email,
        role: invite.role,
        invitedBy: invite.invitedByName
      });
    } catch (error: any) {
      res.status(500).json({ valid: false, error: error.message });
    }
  });

  // Redeem staff invite (PUBLIC - allows new staff to create their account)
  app.post("/api/staff-invites/redeem", async (req: any, res) => {
    try {
      const { inviteCode, firstName, lastName, password } = req.body;
      
      if (!inviteCode) {
        return res.status(400).json({ error: "Invite code required" });
      }
      if (!firstName || !lastName) {
        return res.status(400).json({ error: "First name and last name are required" });
      }
      if (!password || password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      // Get and validate the invite
      const invite = await storage.getStaffInviteByCode(inviteCode);
      if (!invite) {
        return res.status(404).json({ error: "Invalid invite code" });
      }

      if (invite.usedAt) {
        return res.status(400).json({ error: "This invitation has already been used" });
      }

      if (new Date(invite.expiresAt) < new Date()) {
        return res.status(400).json({ error: "This invitation has expired" });
      }

      // Check if user already exists with this email
      let user = await storage.getUserByEmail(invite.email);
      const passwordHash = await bcrypt.hash(password, 10);
      
      if (user) {
        // User exists - update their role (upgrade from client to staff)
        // Use updateUserRole for role change with proper audit logging
        await storage.updateUserRole(
          user.id, 
          invite.role, 
          invite.invitedById, 
          invite.invitedByName || 'System',
          `Staff invite redeemed`
        );
        
        // Update name if provided
        await storage.updateUser(user.id, { 
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName
        });
        
        // If they don't have a password set, update via upsertUser
        if (!user.passwordHash) {
          await storage.upsertUser({
            id: user.id,
            email: user.email,
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            passwordHash,
            emailVerifiedAt: new Date()
          });
        }
        
        user = await storage.getUser(user.id);
      } else {
        // Create new user account using upsertUser
        const userId = `staff-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        user = await storage.upsertUser({
          id: userId,
          email: invite.email,
          firstName,
          lastName,
          role: invite.role,
          passwordHash,
          isActive: true,
          // Email NOT auto-verified - staff must verify to ensure proper email delivery
        });
      }

      // Mark invite as used
      await storage.markStaffInviteUsed(inviteCode, user!.id);

      // Create email verification token for staff member
      const verificationToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await storage.createEmailVerificationToken(
        user!.id,
        invite.email,
        verificationToken,
        expiresAt
      );

      // Send verification email to staff member (non-blocking)
      sendEmailVerificationEmail(invite.email, verificationToken, firstName)
        .then(result => {
          if (result.success) {
            console.log(`Staff verification email sent to ${invite.email}`);
          } else {
            console.warn(`Failed to send staff verification email to ${invite.email}:`, result.error);
          }
        })
        .catch(err => {
          console.error(`Error sending staff verification email to ${invite.email}:`, err);
        });

      res.json({ 
        success: true, 
        role: invite.role,
        requiresVerification: true,
        user: {
          id: user!.id,
          email: user!.email,
          firstName: user!.firstName,
          lastName: user!.lastName,
          role: user!.role
        },
        message: "Account created! Please check your email to verify your address before logging in."
      });
    } catch (error: any) {
      console.error("Staff invite redemption error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Delete staff invite (admin only)
  app.delete(
    "/api/staff-invites/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.userId || req.user?.claims?.sub;
        if (!userId) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const adminUser = await storage.getUser(userId);
        if (!adminUser || adminUser.role !== "admin") {
          return res.status(403).json({ error: "Admin access required" });
        }

        const success = await storage.deleteStaffInvite(req.params.id);
        if (!success) {
          return res.status(404).json({ error: "Invite not found" });
        }
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // ============================================
  // PERMISSIONS MANAGEMENT
  // ============================================

  // Get all permissions
  app.get(
    "/api/permissions",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        const permissions = await storage.getPermissions();
        res.json(permissions);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Get permissions grouped by feature
  app.get(
    "/api/permissions/grouped",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        const grouped = await storage.getPermissionsByGroup();
        res.json(grouped);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Get complete permission matrix (all roles x all permissions)
  app.get(
    "/api/permissions/matrix",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        const matrix = await storage.getRolePermissionMatrix();
        res.json(matrix);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Get current user's permissions
  app.get("/api/auth/permissions", async (req: any, res) => {
    try {
      // Check for session-based login (both client and admin) or Replit Auth
      let userId = null;
      if (
        req.session?.userId &&
        (req.session?.isClientLogin || req.session?.isAdminLogin)
      ) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      if (!userId) {
        return res.json({ role: 'guest', permissions: [] });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Admin and Super Admin have all permissions
      if (user.role === "admin" || user.role === "super_admin") {
        const allPermissions = await storage.getPermissions();
        return res.json({
          role: user.role,
          permissions: allPermissions.map((p) => p.slug),
        });
      }

      const permissions = await storage.getRolePermissions(user.role || 'client');
      res.json({
        role: user.role,
        permissions,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get permissions for a specific role
  app.get(
    "/api/roles/:role/permissions",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        const role = req.params.role as any;
        if (!["client", "agent", "tax_office", "admin", "super_admin"].includes(role)) {
          return res.status(400).json({ error: "Invalid role" });
        }
        const permissions = role === "super_admin" 
          ? (await storage.getPermissions()).map((p) => p.slug)
          : await storage.getRolePermissions(role);
        res.json(permissions);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Update permissions for a role
  app.put(
    "/api/roles/:role/permissions",
    isAuthenticated,
    requireAdmin(),
    async (req: any, res) => {
      try {
        const role = req.params.role as any;
        if (!["client", "agent", "tax_office", "admin", "super_admin"].includes(role)) {
          return res.status(400).json({ error: "Invalid role" });
        }

        if (role === "super_admin") {
          return res.status(400).json({ error: "Super Admin permissions are implied and cannot be edited" });
        }

        const { permissions } = req.body;
        if (!permissions || typeof permissions !== "object") {
          return res.status(400).json({ error: "permissions object required" });
        }

        // Update permissions
        await storage.updateRolePermissions(role, permissions);

        // Clear cache for this role
        const { clearPermissionCache } = await import("./authorization");
        clearPermissionCache(role);

        // Log the change
        const userId = req.userId || req.user?.claims?.sub;
        const adminUser = userId ? await storage.getUser(userId) : null;
        const adminName =
          `${adminUser?.firstName || ""} ${adminUser?.lastName || ""}`.trim() ||
          adminUser?.email ||
          "Admin";
        console.log(
          `Permissions updated for ${role} by ${adminName}:`,
          permissions,
        );

        // Return updated permissions
        const updated = await storage.getRolePermissions(role);
        res.json({ role, permissions: updated });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Toggle a single permission for a role
  app.patch(
    "/api/roles/:role/permissions/:slug",
    isAuthenticated,
    requireAdmin(),
    async (req: any, res) => {
      try {
        const { role, slug } = req.params;
        if (!["client", "agent", "tax_office", "admin", "super_admin"].includes(role)) {
          return res.status(400).json({ error: "Invalid role" });
        }

        if (role === "super_admin") {
          return res.status(400).json({ error: "Super Admin permissions are implied and cannot be edited" });
        }

        const { granted } = req.body;
        if (typeof granted !== "boolean") {
          return res.status(400).json({ error: "granted boolean required" });
        }

        await storage.setRolePermission(role, slug, granted);

        // Clear cache for this role
        const { clearPermissionCache } = await import("./authorization");
        clearPermissionCache(role);

        res.json({ role, permission: slug, granted });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Tax Deadlines - requires deadlines permission
  app.get(
    "/api/deadlines",
    isAuthenticated,
    requirePermission("deadlines.view"),
    async (req, res) => {
      const deadlines = await storage.getTaxDeadlines();
      res.json(deadlines);
    },
  );

  app.get(
    "/api/deadlines/year/:year",
    isAuthenticated,
    requirePermission("deadlines.view"),
    async (req, res) => {
      const year = parseInt(req.params.year);
      const deadlines = await storage.getTaxDeadlinesByYear(year);
      res.json(deadlines);
    },
  );

  app.post(
    "/api/deadlines",
    isAuthenticated,
    requirePermission("deadlines.create"),
    async (req, res) => {
      try {
        const result = insertTaxDeadlineSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ error: result.error.message });
        }
        const deadline = await storage.createTaxDeadline(result.data);
        res.status(201).json(deadline);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.patch(
    "/api/deadlines/:id",
    isAuthenticated,
    requirePermission("deadlines.edit"),
    async (req, res) => {
      try {
        const deadline = await storage.updateTaxDeadline(
          req.params.id,
          req.body,
        );
        if (!deadline) {
          return res.status(404).json({ error: "Deadline not found" });
        }
        res.json(deadline);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete(
    "/api/deadlines/:id",
    isAuthenticated,
    requirePermission("deadlines.edit"),
    async (req, res) => {
      const success = await storage.deleteTaxDeadline(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Deadline not found" });
      }
      res.status(204).send();
    },
  );

  // Public appointment booking - no authentication required
  app.post("/api/appointments/public", async (req, res) => {
    try {
      const {
        clientName,
        email,
        phone,
        title,
        description,
        appointmentDate,
        duration,
        status,
      } = req.body;

      if (!clientName || !email || !title || !appointmentDate) {
        return res
          .status(400)
          .json({
            error:
              "Missing required fields: clientName, email, title, appointmentDate",
          });
      }

      // Create a temporary client ID for public bookings
      const tempClientId = `public-${Date.now()}`;

      const appointment = await storage.createAppointment({
        clientId: tempClientId,
        clientName,
        title,
        description:
          description || `Email: ${email}, Phone: ${phone || "Not provided"}`,
        appointmentDate: new Date(appointmentDate),
        duration: duration || 60,
        status: status || "pending",
        location: null,
        staffId: null,
        staffName: null,
        notes: `Public booking - Email: ${email}, Phone: ${phone || "Not provided"}`,
      });

      res.status(201).json(appointment);
    } catch (error: any) {
      console.error("Public appointment booking error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Appointments - requires appointments.view/modify permission
  app.get(
    "/api/appointments",
    isAuthenticated,
    requirePermission("appointments.view"),
    async (req, res) => {
      const { clientId, start, end } = req.query;

      if (clientId) {
        const appointments = await storage.getAppointmentsByClient(
          clientId as string,
        );
        return res.json(appointments);
      }

      if (start && end) {
        const startDate = new Date(start as string);
        const endDate = new Date(end as string);
        const appointments = await storage.getAppointmentsByDateRange(
          startDate,
          endDate,
        );
        return res.json(appointments);
      }

      const appointments = await storage.getAppointments();
      res.json(appointments);
    },
  );

  app.post(
    "/api/appointments",
    isAuthenticated,
    requirePermission("appointments.create"),
    async (req, res) => {
      try {
        const result = insertAppointmentSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ error: result.error.message });
        }
        const appointment = await storage.createAppointment(result.data);
        
        // Send email notification to client
        if (result.data.clientId) {
          try {
            const client = await storage.getUser(result.data.clientId);
            if (client?.email) {
              const appointmentDate = new Date(result.data.appointmentDate);
              await sendAppointmentConfirmationEmail(
                client.email,
                client.firstName || 'Client',
                appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                result.data.location || undefined,
                undefined,
                result.data.notes || undefined
              );
              console.log(`[EMAIL] Appointment confirmation sent to ${client.email}`);
            }
          } catch (emailError) {
            console.error('[EMAIL] Failed to send appointment confirmation:', emailError);
          }
        }
        
        res.status(201).json(appointment);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.patch(
    "/api/appointments/:id",
    isAuthenticated,
    requirePermission("appointments.edit"),
    async (req, res) => {
      try {
        const appointment = await storage.updateAppointment(
          req.params.id,
          req.body,
        );
        if (!appointment) {
          return res.status(404).json({ error: "Appointment not found" });
        }
        res.json(appointment);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete(
    "/api/appointments/:id",
    isAuthenticated,
    requirePermission("appointments.delete"),
    async (req, res) => {
      const success = await storage.deleteAppointment(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.status(204).send();
    },
  );

  // Payments - requires payments.view permission (financial data)
  app.get(
    "/api/payments",
    isAuthenticated,
    requirePermission("payments.view"),
    async (req, res) => {
      const { clientId } = req.query;

      if (clientId) {
        const payments = await storage.getPaymentsByClient(clientId as string);
        return res.json(payments);
      }

      const payments = await storage.getPayments();
      res.json(payments);
    },
  );

  app.post(
    "/api/payments",
    isAuthenticated,
    requirePermission("payments.create"),
    async (req, res) => {
      try {
        const result = insertPaymentSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ error: result.error.message });
        }
        const payment = await storage.createPayment(result.data);
        
        // Send email notification to client when payment is received
        if (result.data.clientId && result.data.paymentStatus === 'completed') {
          try {
            const client = await storage.getUser(result.data.clientId);
            if (client?.email) {
              await sendPaymentReceivedEmail(
                client.email,
                client.firstName || 'Client',
                result.data.amountPaid?.toString() || '0',
                new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                result.data.paymentMethod || undefined,
                payment.id
              );
              console.log(`[EMAIL] Payment received notification sent to ${client.email}`);
            }
          } catch (emailError) {
            console.error('[EMAIL] Failed to send payment notification:', emailError);
          }
        }

        // Send in-app notification to all admins about payment received
        if (result.data.clientId && result.data.paymentStatus === 'completed') {
          try {
            const client = await storage.getUser(result.data.clientId);
            const admins = await storage.getUsersByRole('admin');
            for (const admin of admins) {
              await storage.createNotification({
                userId: admin.id,
                type: 'payment_received',
                title: 'Payment Received',
                message: `${client?.firstName || 'Client'} paid $${result.data.amountPaid || 0}`,
                link: '/payments',
                resourceType: 'payment',
                resourceId: payment.id
              });
            }
          } catch (notifError) {
            console.error('[NOTIFICATION] Failed to send payment notifications to admins:', notifError);
          }
        }
        
        res.status(201).json(payment);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.patch(
    "/api/payments/:id",
    isAuthenticated,
    requirePermission("payments.edit"),
    async (req, res) => {
      try {
        const payment = await storage.updatePayment(req.params.id, req.body);
        if (!payment) {
          return res.status(404).json({ error: "Payment not found" });
        }
        res.json(payment);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete(
    "/api/payments/:id",
    isAuthenticated,
    requirePermission("payments.delete"),
    async (req, res) => {
      const success = await storage.deletePayment(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.status(204).send();
    },
  );

  // Tax Filings - tracks each client's tax filing per year
  app.get(
    "/api/tax-filings",
    isAuthenticated,
    requirePermission("clients.view"),
    async (req, res) => {
      try {
        const { year, status, clientId } = req.query;

        if (clientId) {
          const filings = await storage.getTaxFilingsByClient(
            clientId as string,
          );
          return res.json(filings);
        }

        if (year && status) {
          const filings = await storage.getTaxFilingsByYearAndStatus(
            parseInt(year as string),
            status as FilingStatus,
          );
          return res.json(filings);
        }

        if (year) {
          const filings = await storage.getTaxFilingsByYear(
            parseInt(year as string),
          );
          return res.json(filings);
        }

        if (status) {
          const filings = await storage.getTaxFilingsByStatus(
            status as FilingStatus,
          );
          return res.json(filings);
        }

        const filings = await storage.getTaxFilings();
        res.json(filings);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.get(
    "/api/tax-filings/metrics/:year",
    isAuthenticated,
    requirePermission("clients.view"),
    async (req, res) => {
      try {
        const year = parseInt(req.params.year);
        const metrics = await storage.getTaxFilingMetrics(year);
        res.json(metrics);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.get(
    "/api/tax-filings/client/:clientId",
    isAuthenticated,
    requirePermission("clients.view"),
    async (req, res) => {
      try {
        const filings = await storage.getTaxFilingsByClient(
          req.params.clientId,
        );
        res.json(filings);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.get(
    "/api/tax-filings/client/:clientId/year/:year",
    isAuthenticated,
    requirePermission("clients.view"),
    async (req, res) => {
      try {
        const filing = await storage.getTaxFilingByClientYear(
          req.params.clientId,
          parseInt(req.params.year),
        );
        if (!filing) {
          return res
            .status(404)
            .json({ error: "Tax filing not found for this client and year" });
        }
        res.json(filing);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.post(
    "/api/tax-filings",
    isAuthenticated,
    requirePermission("clients.edit"),
    async (req, res) => {
      try {
        const result = insertTaxFilingSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ error: result.error.message });
        }

        // Check if filing already exists for this client+year
        const existing = await storage.getTaxFilingByClientYear(
          result.data.clientId,
          result.data.taxYear,
        );
        if (existing) {
          return res.status(400).json({
            error: "A tax filing already exists for this client and year",
            existingFiling: existing,
          });
        }

        const filing = await storage.createTaxFiling(result.data);
        res.status(201).json(filing);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.patch(
    "/api/tax-filings/:id",
    isAuthenticated,
    requirePermission("clients.edit"),
    async (req, res) => {
      try {
        const filing = await storage.updateTaxFiling(req.params.id, req.body);
        if (!filing) {
          return res.status(404).json({ error: "Tax filing not found" });
        }
        res.json(filing);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.patch(
    "/api/tax-filings/:id/status",
    isAuthenticated,
    requirePermission("clients.edit"),
    async (req, res) => {
      try {
        const { status, note } = req.body;
        if (!status) {
          return res.status(400).json({ error: "Status is required" });
        }

        const validStatuses: FilingStatus[] = [
          "new",
          "documents_pending",
          "review",
          "filed",
          "accepted",
          "approved",
          "paid",
        ];
        if (!validStatuses.includes(status)) {
          return res
            .status(400)
            .json({
              error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
            });
        }

        const filing = await storage.updateTaxFilingStatus(
          req.params.id,
          status,
          note,
        );
        if (!filing) {
          return res.status(404).json({ error: "Tax filing not found" });
        }
        
        // Send email notification to client about status change
        if (filing.clientId) {
          try {
            const client = await storage.getUser(filing.clientId);
            if (client?.email) {
              const statusMessages: Record<string, string> = {
                'new': 'Your tax filing has been started.',
                'documents_pending': 'We need additional documents to proceed with your tax filing.',
                'review': 'Your tax return is now under review by our team.',
                'filed': 'Great news! Your tax return has been filed with the IRS.',
                'accepted': 'Your tax return has been accepted by the IRS!',
                'approved': 'Your refund has been approved!',
                'paid': 'Your refund has been paid! Please check your bank account.',
              };
              
              await sendTaxFilingStatusEmail(
                client.email,
                client.firstName || 'Client',
                filing.taxYear?.toString() || new Date().getFullYear().toString(),
                status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
                statusMessages[status] || note || undefined,
                filing.estimatedRefund?.toString() || filing.actualRefund?.toString() || undefined
              );
              console.log(`[EMAIL] Tax filing status notification sent to ${client.email}`);
            }
          } catch (emailError) {
            console.error('[EMAIL] Failed to send tax filing status notification:', emailError);
          }
        }
        
        res.json(filing);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete(
    "/api/tax-filings/:id",
    isAuthenticated,
    requirePermission("clients.delete"),
    async (req, res) => {
      const success = await storage.deleteTaxFiling(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Tax filing not found" });
      }
      res.status(204).send();
    },
  );

  // Bulk assign clients to an agent/preparer
  app.post(
    "/api/clients/bulk-assign",
    isAuthenticated,
    requirePermission("clients.edit"),
    async (req: any, res) => {
      try {
        const { clientIds, preparerId, preparerName, taxYear } = req.body;
        
        if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
          return res.status(400).json({ error: "Client IDs array is required" });
        }
        
        if (!preparerId) {
          return res.status(400).json({ error: "Preparer ID is required" });
        }
        
        const year = taxYear || new Date().getFullYear();
        const results = [];
        const errors = [];
        
        for (const clientId of clientIds) {
          try {
            // Check if tax filing exists for this client/year
            const existingFiling = await storage.getTaxFilingByClientYear(clientId, year);
            
            if (existingFiling) {
              // Update existing filing
              const updated = await storage.updateTaxFiling(existingFiling.id, {
                preparerId,
                preparerName: preparerName || null,
              });
              results.push({ clientId, status: 'updated', filing: updated });
            } else {
              // Create new filing with assignment
              const newFiling = await storage.createTaxFiling({
                clientId,
                taxYear: year,
                status: 'new',
                preparerId,
                preparerName: preparerName || null,
              });
              results.push({ clientId, status: 'created', filing: newFiling });
            }
          } catch (err: any) {
            errors.push({ clientId, error: err.message });
          }
        }
        
        res.json({
          success: true,
          assigned: results.length,
          failed: errors.length,
          results,
          errors,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Single client assignment (quick assign from table)
  app.post(
    "/api/clients/:clientId/assign",
    isAuthenticated,
    requirePermission("clients.edit"),
    async (req: any, res) => {
      try {
        const { clientId } = req.params;
        const { preparerId, preparerName, taxYear } = req.body;
        
        if (!preparerId) {
          return res.status(400).json({ error: "Preparer ID is required" });
        }
        
        const year = taxYear || new Date().getFullYear();
        
        // Check if tax filing exists for this client/year
        const existingFiling = await storage.getTaxFilingByClientYear(clientId, year);
        
        if (existingFiling) {
          // Update existing filing
          const updated = await storage.updateTaxFiling(existingFiling.id, {
            preparerId,
            preparerName: preparerName || null,
          });
          return res.json({ status: 'updated', filing: updated });
        } else {
          // Create new filing with assignment
          const newFiling = await storage.createTaxFiling({
            clientId,
            taxYear: year,
            status: 'new',
            preparerId,
            preparerName: preparerName || null,
          });
          return res.json({ status: 'created', filing: newFiling });
        }
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Tasks - Local task management with full CRUD
  // ALL users (including admins) only see:
  // 1. Tasks they created themselves (created_by_id = current user)
  // 2. Tasks assigned to them (assigned_to_id = current user)
  app.get(
    "/api/tasks",
    isAuthenticated,
    requirePermission("tasks.view"),
    async (req: any, res) => {
      try {
        const userId = req.userId || req.user?.claims?.sub;
        const allTasks = await storage.getTasks();
        
        // ALL users (including admins) only see their own tasks or tasks assigned to them
        const filteredTasks = allTasks.filter(task => 
          task.createdById === userId || // Tasks they created
          task.assignedToId === userId   // Tasks assigned to them
        );
        return res.json(filteredTasks);
      } catch (error: any) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Create new task
  app.post(
    "/api/tasks",
    isAuthenticated,
    requirePermission("tasks.create"),
    async (req: any, res) => {
      try {
        const { title, description, clientId, clientName, assignedToId, assignedTo, dueDate, priority, status, category } = req.body;

        if (!title) {
          return res.status(400).json({ error: "Task title is required" });
        }

        if (!assignedTo) {
          return res.status(400).json({ error: "Task must be assigned to someone" });
        }

        // Get the creator's info to track who created this task
        const creatorId = req.userId || req.user?.claims?.sub;
        const creator = creatorId ? await storage.getUser(creatorId) : null;
        const creatorName = creator ? `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || creator.email : null;

        const task = await storage.createTask({
          title,
          description: description || null,
          clientId: clientId || null,
          clientName: clientName || null,
          assignedToId: assignedToId || null,
          assignedTo,
          createdById: creatorId || null,
          createdByName: creatorName || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          priority: priority || "medium",
          status: status || "todo",
          category: category || null,
        });

        // Send email notification to assigned user
        if (assignedToId) {
          try {
            const assignedUser = await storage.getUser(assignedToId);
            const creatorId = req.userId || req.user?.claims?.sub;
            const creator = creatorId ? await storage.getUser(creatorId) : null;
            
            if (assignedUser?.email) {
              await sendTaskAssignmentEmail(
                assignedUser.email,
                assignedUser.firstName || assignedTo,
                title,
                description || '',
                dueDate ? new Date(dueDate).toLocaleDateString() : undefined,
                priority || 'medium',
                clientName || undefined,
                creator ? `${creator.firstName} ${creator.lastName}` : undefined
              );
              console.log(`[EMAIL] Task assignment notification sent to ${assignedUser.email}`);
            }
          } catch (emailError) {
            console.error('[EMAIL] Failed to send task assignment notification:', emailError);
          }
        }

        // Send in-app notification to all admins about task creation
        try {
          const admins = await storage.getUsersByRole('admin');
          for (const admin of admins) {
            await storage.createNotification({
              userId: admin.id,
              type: 'task_assigned',
              title: 'Task Created',
              message: `New task: ${title} assigned to ${assignedTo}`,
              link: '/tasks',
              resourceType: 'task',
              resourceId: task.id
            });
          }
        } catch (notifError) {
          console.error('[NOTIFICATION] Failed to send task notifications to admins:', notifError);
        }

        res.status(201).json(task);
      } catch (error: any) {
        console.error("Error creating task:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Update task
  app.patch(
    "/api/tasks/:id",
    isAuthenticated,
    requirePermission("tasks.edit"),
    async (req: any, res) => {
      try {
        const { title, description, clientId, clientName, assignedToId, assignedTo, dueDate, priority, status, category } = req.body;

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (clientId !== undefined) updateData.clientId = clientId;
        if (clientName !== undefined) updateData.clientName = clientName;
        if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
        if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (priority !== undefined) updateData.priority = priority;
        if (status !== undefined) updateData.status = status;
        if (category !== undefined) updateData.category = category;

        const task = await storage.updateTask(req.params.id, updateData);
        if (!task) {
          return res.status(404).json({ error: "Task not found" });
        }

        res.json(task);
      } catch (error: any) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Delete task
  app.delete(
    "/api/tasks/:id",
    isAuthenticated,
    requirePermission("tasks.edit"),
    async (req: any, res) => {
      try {
        const success = await storage.deleteTask(req.params.id);
        if (!success) {
          return res.status(404).json({ error: "Task not found" });
        }
        res.status(204).send();
      } catch (error: any) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Leads CRUD - CRM Native Leads Management
  app.get(
    "/api/leads",
    isAuthenticated,
    requirePermission("leads.view"),
    async (req, res) => {
      try {
        const { status, assignedToId } = req.query;
        let leads;
        if (status) {
          leads = await storage.getLeadsByStatus(status as any);
        } else if (assignedToId) {
          leads = await storage.getLeadsByAssignee(assignedToId as string);
        } else {
          leads = await storage.getLeads();
        }
        res.json(leads);
      } catch (error: any) {
        console.error("Error fetching leads:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.get(
    "/api/leads/:id",
    isAuthenticated,
    requirePermission("leads.view"),
    async (req, res) => {
      try {
        const lead = await storage.getLead(req.params.id);
        if (!lead) {
          return res.status(404).json({ error: "Lead not found" });
        }
        res.json(lead);
      } catch (error: any) {
        console.error("Error fetching lead:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.post(
    "/api/leads",
    isAuthenticated,
    requirePermission("leads.create"),
    async (req: any, res) => {
      try {
        const { name, email, phone, company, address, city, state, zipCode, source, status, notes, assignedToId, assignedToName, estimatedValue } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          return res.status(400).json({ error: "Name is required" });
        }
        const leadData = {
          name: name.trim(),
          email: email && email.trim() ? email.trim() : null,
          phone: phone && phone.trim() ? phone.trim() : null,
          company: company && company.trim() ? company.trim() : null,
          address: address && address.trim() ? address.trim() : null,
          city: city && city.trim() ? city.trim() : null,
          state: state && state.trim() ? state.trim() : null,
          zipCode: zipCode && zipCode.trim() ? zipCode.trim() : null,
          source: source && source.trim() ? source.trim() : null,
          status: status || "new",
          notes: notes && notes.trim() ? notes.trim() : null,
          assignedToId: assignedToId || null,
          assignedToName: assignedToName || null,
          estimatedValue: estimatedValue ? parseFloat(String(estimatedValue)) : null,
        };
        const lead = await storage.createLead(leadData as any);
        res.status(201).json(lead);
      } catch (error: any) {
        console.error("Error creating lead:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.put(
    "/api/leads/:id",
    isAuthenticated,
    requirePermission("leads.edit"),
    async (req: any, res) => {
      try {
        const { name, email, phone, company, address, city, state, zipCode, source, status, notes, assignedToId, assignedToName, estimatedValue } = req.body;
        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (email !== undefined) updateData.email = email && email.trim() ? email.trim() : null;
        if (phone !== undefined) updateData.phone = phone && phone.trim() ? phone.trim() : null;
        if (company !== undefined) updateData.company = company && company.trim() ? company.trim() : null;
        if (address !== undefined) updateData.address = address && address.trim() ? address.trim() : null;
        if (city !== undefined) updateData.city = city && city.trim() ? city.trim() : null;
        if (state !== undefined) updateData.state = state && state.trim() ? state.trim() : null;
        if (zipCode !== undefined) updateData.zipCode = zipCode && zipCode.trim() ? zipCode.trim() : null;
        if (source !== undefined) updateData.source = source && source.trim() ? source.trim() : null;
        if (status !== undefined) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes && notes.trim() ? notes.trim() : null;
        if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
        if (assignedToName !== undefined) updateData.assignedToName = assignedToName || null;
        if (estimatedValue !== undefined) updateData.estimatedValue = estimatedValue ? parseFloat(String(estimatedValue)) : null;
        const lead = await storage.updateLead(req.params.id, updateData);
        if (!lead) {
          return res.status(404).json({ error: "Lead not found" });
        }
        res.json(lead);
      } catch (error: any) {
        console.error("Error updating lead:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete(
    "/api/leads/:id",
    isAuthenticated,
    requirePermission("leads.edit"),
    async (req: any, res) => {
      try {
        const success = await storage.deleteLead(req.params.id);
        if (!success) {
          return res.status(404).json({ error: "Lead not found" });
        }
        res.status(204).send();
      } catch (error: any) {
        console.error("Error deleting lead:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.post(
    "/api/leads/:id/convert",
    isAuthenticated,
    requirePermission("leads.convert"),
    async (req: any, res) => {
      try {
        const { clientId } = req.body;
        if (!clientId) {
          return res.status(400).json({ error: "clientId is required" });
        }
        const lead = await storage.convertLeadToClient(req.params.id, clientId);
        if (!lead) {
          return res.status(404).json({ error: "Lead not found" });
        }
        res.json(lead);
      } catch (error: any) {
        console.error("Error converting lead:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Staff Members - Pull from Perfex CRM tblstaff table - requires settings permission
  app.get(
    "/api/staff",
    isAuthenticated,
    requirePermission("settings.view"),
    async (req, res) => {
      try {
        const staff = await queryPerfex(`
        SELECT 
          s.staffid as id,
          CONCAT(s.firstname, ' ', s.lastname) as name,
          s.email,
          COALESCE(r.name, 'Staff') as role,
          s.active as isActive,
          s.datecreated as createdAt
        FROM tblstaff s
        LEFT JOIN tblroles r ON s.role = r.roleid
        WHERE s.active = 1
        ORDER BY s.firstname, s.lastname
      `);
        res.json(staff);
      } catch (error: any) {
        console.error("Error fetching Perfex staff:", error);
        res.json([]);
      }
    },
  );

  app.get(
    "/api/staff/:id",
    isAuthenticated,
    requirePermission("settings.view"),
    async (req, res) => {
      try {
        const [member] = await queryPerfex(
          `
        SELECT 
          s.staffid as id,
          CONCAT(s.firstname, ' ', s.lastname) as name,
          s.email,
          COALESCE(r.name, 'Staff') as role,
          s.active as isActive,
          s.datecreated as createdAt
        FROM tblstaff s
        LEFT JOIN tblroles r ON s.role = r.roleid
        WHERE s.staffid = ?
      `,
          [req.params.id],
        );

        if (!member) {
          return res.status(404).json({ error: "Staff member not found" });
        }
        res.json(member);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.post(
    "/api/staff",
    isAuthenticated,
    requirePermission("settings.edit"),
    async (req, res) => {
      try {
        const member = await storage.createStaffMember(req.body);
        res.status(201).json(member);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.patch(
    "/api/staff/:id",
    isAuthenticated,
    requirePermission("settings.edit"),
    async (req, res) => {
      try {
        const member = await storage.updateStaffMember(req.params.id, req.body);
        if (!member) {
          return res.status(404).json({ error: "Staff member not found" });
        }
        res.json(member);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete(
    "/api/staff/:id",
    isAuthenticated,
    requirePermission("settings.edit"),
    async (req, res) => {
      const success = await storage.deleteStaffMember(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      res.status(204).send();
    },
  );

  // Document Versions - requires documents permission
  // Note: /all route must come before /:clientId to avoid matching "all" as a clientId
  app.get(
    "/api/documents/all",
    isAuthenticated,
    requirePermission("documents.view"),
    async (req, res) => {
      try {
        const documents = await storage.getAllDocuments();
        res.json(documents);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.get(
    "/api/documents/:clientId",
    isAuthenticated,
    requirePermission("documents.view"),
    async (req, res) => {
      const { documentType } = req.query;

      if (documentType) {
        const documents = await storage.getDocumentVersionsByType(
          req.params.clientId,
          documentType as string,
        );
        return res.json(documents);
      }

      const documents = await storage.getDocumentVersions(req.params.clientId);
      res.json(documents);
    },
  );

  app.post(
    "/api/documents",
    isAuthenticated,
    requirePermission("documents.upload"),
    async (req, res) => {
      try {
        const result = insertDocumentVersionSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ error: result.error.message });
        }
        const document = await storage.createDocumentVersion(result.data);
        
        // Send email confirmation to client about document upload
        if (result.data.clientId) {
          try {
            const client = await storage.getUser(result.data.clientId);
            if (client?.email) {
              await sendDocumentUploadConfirmationEmail(
                client.email,
                client.firstName || 'Client',
                result.data.documentName || 'Document',
                result.data.documentType || 'General'
              );
              console.log(`[EMAIL] Document upload confirmation sent to ${client.email}`);
            }
          } catch (emailError) {
            console.error('[EMAIL] Failed to send document upload confirmation:', emailError);
          }

          // Send in-app notification to all admins about document upload
          try {
            const client = await storage.getUser(result.data.clientId);
            const admins = await storage.getUsersByRole('admin');
            for (const admin of admins) {
              await storage.createNotification({
                userId: admin.id,
                type: 'document_uploaded',
                title: 'Document Uploaded',
                message: `${client?.firstName || 'Client'} uploaded ${result.data.documentName || 'document'}`,
                link: '/documents',
                resourceType: 'document',
                resourceId: document.id
              });
            }
          } catch (notifError) {
            console.error('[NOTIFICATION] Failed to send document notifications to admins:', notifError);
          }
        }
        
        res.status(201).json(document);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete(
    "/api/documents/:id",
    isAuthenticated,
    requirePermission("documents.delete"),
    async (req, res) => {
      const success = await storage.deleteDocumentVersion(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.status(204).send();
    },
  );

  // E-Signatures - requires signatures permission
  app.get(
    "/api/signatures",
    isAuthenticated,
    requirePermission("signatures.view"),
    async (req, res) => {
      const { clientId } = req.query;

      if (clientId) {
        const signatures = await storage.getESignaturesByClient(
          clientId as string,
        );
        return res.json(signatures);
      }

      const signatures = await storage.getESignatures();
      res.json(signatures);
    },
  );

  app.get("/api/signatures/:id", isAuthenticated, async (req, res) => {
    const signature = await storage.getESignature(req.params.id);
    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }
    res.json(signature);
  });

  app.post(
    "/api/signatures",
    isAuthenticated,
    requirePermission("signatures.create"),
    async (req, res) => {
      try {
        const result = insertESignatureSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ error: result.error.message });
        }
        const signature = await storage.createESignature(result.data);
        
        // Send email notification to client for signature request
        if (result.data.clientId) {
          try {
            const client = await storage.getUser(result.data.clientId);
            if (client?.email) {
              const formData = result.data.formData as { taxYear?: string } | undefined;
              const taxYear = formData?.taxYear || new Date().getFullYear().toString();
              await sendSignatureRequestEmail(
                client.email,
                client.firstName || 'Client',
                taxYear
              );
              console.log(`[EMAIL] E-signature request notification sent to ${client.email}`);
            }
          } catch (emailError) {
            console.error('[EMAIL] Failed to send e-signature request notification:', emailError);
          }
        }
        
        res.status(201).json(signature);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.patch("/api/signatures/:id", isAuthenticated, async (req, res) => {
    try {
      // Capture real client IP address from request
      const ipAddress =
        req.ip ||
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "unknown";

      // Merge IP address with request body for audit trail
      const updateData = {
        ...req.body,
        ipAddress,
      };

      const signature = await storage.updateESignature(
        req.params.id,
        updateData,
      );
      if (!signature) {
        return res.status(404).json({ error: "Signature not found" });
      }
      
      // Send email notification when signature is completed
      if (req.body.status === 'signed' && signature.clientId) {
        try {
          const client = await storage.getUser(signature.clientId);
          if (client?.email) {
            const taxYear = signature.formData?.taxYear || new Date().getFullYear().toString();
            await sendSignatureCompletedEmail(
              client.email,
              client.firstName || 'Client',
              new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
              taxYear
            );
            console.log(`[EMAIL] E-signature completed notification sent to ${client.email}`);
          }
        } catch (emailError) {
          console.error('[EMAIL] Failed to send e-signature completed notification:', emailError);
        }
      }
      
      res.json(signature);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete(
    "/api/signatures/:id",
    isAuthenticated,
    requirePermission("signatures.create"),
    async (req, res) => {
      const success = await storage.deleteESignature(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Signature not found" });
      }
      res.status(204).send();
    },
  );

  // Generate filled IRS Form 8879 PDF - requires signatures.download_pdf permission
  app.get(
    "/api/signatures/:id/pdf",
    isAuthenticated,
    requirePermission("signatures.download_pdf"),
    async (req, res) => {
      try {
        const signature = await storage.getESignature(req.params.id);
        if (!signature) {
          return res.status(404).json({ error: "Signature not found" });
        }

        if (signature.status !== "signed") {
          return res
            .status(400)
            .json({ error: "Document has not been signed yet" });
        }

        // Parse formData
        const formData: Form8879Data =
          typeof signature.formData === "string"
            ? JSON.parse(signature.formData)
            : (signature.formData as Form8879Data);

        if (!formData) {
          return res.status(400).json({ error: "No form data available" });
        }

        // Fetch the official IRS Form 8879 PDF
        const irsFormUrl = "https://www.irs.gov/pub/irs-pdf/f8879.pdf";
        const irsFormResponse = await fetch(irsFormUrl);
        if (!irsFormResponse.ok) {
          throw new Error("Failed to fetch IRS Form 8879");
        }
        const irsFormBytes = await irsFormResponse.arrayBuffer();

        // Load the PDF with form fields
        const pdfDoc = await PDFDocument.load(irsFormBytes, {
          ignoreEncryption: true,
        });
        const form = pdfDoc.getForm();
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Page dimensions for coordinate-based drawing
        const { height } = firstPage.getSize();

        // Try to fill using form fields first, then fall back to coordinates
        // The IRS form field names follow patterns like f1_01, f1_02, etc.

        // Get all form fields to understand the structure
        const fields = form.getFields();
        const fieldNames = fields.map((f) => f.getName());
        console.log("Available form fields:", fieldNames);

        // Helper to safely set text field value
        const setTextField = (
          fieldName: string,
          value: string | undefined | null,
        ) => {
          if (!value) return false;
          try {
            const field = form.getTextField(fieldName);
            field.setText(value);
            return true;
          } catch (e) {
            return false;
          }
        };

        // Helper to safely check a checkbox
        const setCheckbox = (fieldName: string, checked: boolean) => {
          if (!checked) return false;
          try {
            const field = form.getCheckBox(fieldName);
            field.check();
            return true;
          } catch (e) {
            return false;
          }
        };

        // Based on IRS Form 8879 field structure, try common field names
        // Tax Year field (usually at top)
        setTextField("f1_01", formData.taxYear);
        setTextField("topmostSubform[0].Page1[0].f1_01[0]", formData.taxYear);

        // Taxpayer name field
        setTextField("f1_02", formData.taxpayerName);
        setTextField(
          "topmostSubform[0].Page1[0].f1_02[0]",
          formData.taxpayerName,
        );

        // Taxpayer SSN
        setTextField("f1_03", formData.taxpayerSSN);
        setTextField(
          "topmostSubform[0].Page1[0].f1_03[0]",
          formData.taxpayerSSN,
        );

        // Spouse name
        if (formData.spouseName) {
          setTextField("f1_04", formData.spouseName);
          setTextField(
            "topmostSubform[0].Page1[0].f1_04[0]",
            formData.spouseName,
          );
        }

        // Spouse SSN
        if (formData.spouseSSN) {
          setTextField("f1_05", formData.spouseSSN);
          setTextField(
            "topmostSubform[0].Page1[0].f1_05[0]",
            formData.spouseSSN,
          );
        }

        // Part I - Tax Return Information (Lines 1-5)
        // Line 1: AGI
        if (formData.agi) {
          const agiValue = Number(formData.agi).toLocaleString();
          setTextField("f1_06", agiValue) || setTextField("f1_07", agiValue);
        }

        // Line 2: Total Tax
        if (formData.totalTax) {
          const taxValue = Number(formData.totalTax).toLocaleString();
          setTextField("f1_08", taxValue) || setTextField("f1_09", taxValue);
        }

        // Line 3: Federal withheld
        if (formData.federalWithheld) {
          const withheldValue = Number(
            formData.federalWithheld,
          ).toLocaleString();
          setTextField("f1_10", withheldValue);
        }

        // Line 4: Refund amount
        if (formData.federalRefund) {
          const refundValue = Number(formData.federalRefund).toLocaleString();
          setTextField("f1_11", refundValue) ||
            setTextField("f1_12", refundValue);
        }

        // Line 5: Amount owed
        if (formData.amountOwed) {
          const owedValue = Number(formData.amountOwed).toLocaleString();
          setTextField("f1_13", owedValue);
        }

        // Part II - ERO firm name and PIN authorization
        if (formData.eroFirmName) {
          setTextField("f1_14", formData.eroFirmName);
          setTextField("f1_15", formData.eroFirmName);
        }

        // Taxpayer PIN
        if (formData.taxpayerPin) {
          setTextField("f1_16", formData.taxpayerPin);
          setTextField("f1_17", formData.taxpayerPin);
        }

        // Spouse PIN
        if (formData.spousePin) {
          setTextField("f1_18", formData.spousePin);
          setTextField("f1_19", formData.spousePin);
        }

        // Part III - ERO EFIN/PIN
        if (formData.eroPin) {
          setTextField("f1_20", formData.eroPin);
          setTextField("f1_21", formData.eroPin);
        }

        // If no form fields matched, use precise coordinate-based placement
        // IRS Form 8879 (Rev. January 2021) layout - coordinates in points from bottom-left
        // Page is 612 x 792 points (8.5" x 11")
        const fontSize = 10;
        const smallFontSize = 8;

        // Track if form fields worked
        let fieldsWorked = fieldNames.length > 0;

        // If form fields didn't work (empty or AcroForm issues), use coordinates
        if (!fieldsWorked || fieldNames.length === 0) {
          console.log("Using coordinate-based filling for Form 8879");

          // Tax year - in the header box area (approximately y=722 from bottom)
          if (formData.taxYear) {
            firstPage.drawText(formData.taxYear, {
              x: 298,
              y: 722,
              size: smallFontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }

          // Taxpayer name - left side of name/SSN row (y~665)
          if (formData.taxpayerName) {
            firstPage.drawText(formData.taxpayerName, {
              x: 120,
              y: 665,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }

          // Taxpayer SSN - right side (x~485)
          if (formData.taxpayerSSN) {
            firstPage.drawText(formData.taxpayerSSN, {
              x: 485,
              y: 665,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }

          // Spouse name (y~647)
          if (formData.spouseName) {
            firstPage.drawText(formData.spouseName, {
              x: 120,
              y: 647,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }

          // Spouse SSN
          if (formData.spouseSSN) {
            firstPage.drawText(formData.spouseSSN, {
              x: 485,
              y: 647,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }

          // Part I - Tax Return Information - dollar amounts right-aligned around x=555
          // Line 1: AGI (y~562)
          if (formData.agi) {
            firstPage.drawText(Number(formData.agi).toLocaleString(), {
              x: 540,
              y: 562,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }

          // Line 2: Total Tax (y~544)
          if (formData.totalTax) {
            firstPage.drawText(Number(formData.totalTax).toLocaleString(), {
              x: 540,
              y: 544,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }

          // Line 3: Federal withheld (y~526)
          if (formData.federalWithheld) {
            firstPage.drawText(
              Number(formData.federalWithheld).toLocaleString(),
              { x: 540, y: 526, size: fontSize, font, color: rgb(0, 0, 0) },
            );
          }

          // Line 4: Refund amount (y~508)
          if (formData.federalRefund) {
            firstPage.drawText(
              Number(formData.federalRefund).toLocaleString(),
              { x: 540, y: 508, size: fontSize, font, color: rgb(0, 0, 0) },
            );
          }

          // Line 5: Amount owed (y~490)
          if (formData.amountOwed) {
            firstPage.drawText(Number(formData.amountOwed).toLocaleString(), {
              x: 540,
              y: 490,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }

          // Part II - ERO firm name in authorization line (y~390)
          if (formData.eroFirmName) {
            firstPage.drawText(formData.eroFirmName, {
              x: 140,
              y: 390,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }

          // Taxpayer PIN - 5 digits in PIN box (y~390, x~465)
          if (formData.taxpayerPin) {
            firstPage.drawText(formData.taxpayerPin, {
              x: 465,
              y: 390,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }

          // Spouse authorization with ERO firm name (y~310)
          if (formData.spouseName && formData.eroFirmName) {
            firstPage.drawText(formData.eroFirmName, {
              x: 140,
              y: 310,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }

          // Spouse PIN (y~310, x~465)
          if (formData.spousePin) {
            firstPage.drawText(formData.spousePin, {
              x: 465,
              y: 310,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }

          // Part III - ERO EFIN/PIN (y~195)
          if (formData.eroPin) {
            firstPage.drawText(formData.eroPin, {
              x: 400,
              y: 195,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          }
        } else {
          // Flatten form fields so they appear as regular text
          form.flatten();
        }

        // Add taxpayer signature image
        if (signature.signatureData) {
          try {
            const base64Data = signature.signatureData.replace(
              /^data:image\/\w+;base64,/,
              "",
            );
            const signatureImageBytes = Buffer.from(base64Data, "base64");
            const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

            const maxWidth = 150;
            const maxHeight = 30;
            const scaleFactor = Math.min(
              maxWidth / signatureImage.width,
              maxHeight / signatureImage.height,
            );
            const signatureWidth = signatureImage.width * scaleFactor;
            const signatureHeight = signatureImage.height * scaleFactor;

            // Taxpayer signature line is approximately at y=348 from bottom
            firstPage.drawImage(signatureImage, {
              x: 82,
              y: 348,
              width: signatureWidth,
              height: signatureHeight,
            });
          } catch (imgError) {
            console.error("Failed to embed signature image:", imgError);
          }
        }

        // Taxpayer signature date (next to signature, y~350, x~475)
        if (signature.signedAt) {
          const signedDate = new Date(signature.signedAt);
          const dateStr = signedDate.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          });
          firstPage.drawText(dateStr, {
            x: 475,
            y: 350,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        }

        // Spouse signature date (if joint return, y~268)
        if (formData.spouseName && signature.signedAt) {
          const signedDate = new Date(signature.signedAt);
          const dateStr = signedDate.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          });
          firstPage.drawText(dateStr, {
            x: 475,
            y: 268,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        }

        // Audit trail at very bottom of page (y=15)
        const auditY = 15;
        const auditFontSize = 6;

        const auditParts: string[] = [];
        if (signature.ipAddress) {
          auditParts.push(`IP: ${signature.ipAddress}`);
        }
        if (signature.signedAt) {
          auditParts.push(
            `Signed: ${new Date(signature.signedAt).toISOString()}`,
          );
        }
        auditParts.push(`ID: ${signature.id}`);

        firstPage.drawText(auditParts.join(" | "), {
          x: 72,
          y: auditY,
          size: auditFontSize,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });

        // Serialize the PDF
        const pdfBytes = await pdfDoc.save();

        // Send the PDF
        const clientName =
          formData.taxpayerName?.replace(/[^a-zA-Z0-9]/g, "_") || "client";
        const filename = `Form_8879_${clientName}_${formData.taxYear || "signed"}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`,
        );
        res.send(Buffer.from(pdfBytes));
      } catch (error: any) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Email Logs
  app.get("/api/emails", async (req, res) => {
    const { clientId } = req.query;

    if (clientId) {
      const emails = await storage.getEmailLogsByClient(clientId as string);
      return res.json(emails);
    }

    const emails = await storage.getEmailLogs();
    res.json(emails);
  });

  app.post("/api/emails", async (req, res) => {
    try {
      const result = insertEmailLogSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      const email = await storage.createEmailLog(result.data);
      res.status(201).json(email);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Document Request Templates
  app.get("/api/templates", async (req, res) => {
    const templates = await storage.getDocumentRequestTemplates();
    res.json(templates);
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const result = insertDocumentRequestTemplateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      const template = await storage.createDocumentRequestTemplate(result.data);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.updateDocumentRequestTemplate(
        req.params.id,
        req.body,
      );
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    const success = await storage.deleteDocumentRequestTemplate(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.status(204).send();
  });

  // Check if Replit Object Storage is available
  const isReplitEnvironment = (): boolean => {
    // Check for REPL_ID and REPLIT_DOMAINS (indicator of Replit)
    return !!(process.env.REPL_ID && process.env.REPLIT_DOMAINS);
  };

  // Object Storage - File Upload (returns presigned URL for Replit, or indicates FTP mode)
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const { clientId, fileName, fileType, fileSize } = req.body;

      if (!clientId || !fileName) {
        return res
          .status(400)
          .json({ error: "clientId and fileName are required" });
      }

      // Check if we're on Replit with Object Storage available
      if (isReplitEnvironment()) {
        const objectStorageService = new ObjectStorageService();
        const { uploadURL, objectPath } =
          await objectStorageService.getObjectEntityUploadURL(clientId, fileName);
        res.json({ uploadURL, objectPath, mode: 'object-storage' });
      } else {
        // On Render/other environments, tell frontend to use FTP upload endpoint
        res.json({ 
          uploadURL: '/api/documents/upload-ftp',
          objectPath: null,
          mode: 'ftp'
        });
      }
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // FTP-based file upload for non-Replit environments (Render deployment)
  app.post("/api/documents/upload-ftp", isAuthenticated, async (req, res) => {
    let requestTimeout: NodeJS.Timeout | null = null;
    let isResponseSent = false;

    try {
      const contentType = req.headers['content-type'] || '';
      console.log(`[FTP] Upload request started: contentType=${contentType}, contentLength=${req.headers['content-length']}`);
      
      // Check content type to determine how to handle the upload
      if (!contentType.includes('multipart/form-data') && !contentType.includes('application/octet-stream')) {
        return res.status(400).json({ 
          error: "Invalid content type. Use multipart/form-data or application/octet-stream" 
        });
      }

      // Set a request-level timeout (120 seconds total for entire request)
      // This ensures the upload doesn't hang indefinitely
      requestTimeout = setTimeout(() => {
        if (!isResponseSent && !res.headersSent) {
          isResponseSent = true;
          console.error('[FTP] Request timeout: Upload request exceeded 120 seconds');
          res.status(408).json({ error: "Upload request timed out. Please try again with a smaller file." });
        }
      }, 120000); // 120 seconds

      // For raw binary uploads
      const chunks: Buffer[] = [];
      let totalSize = 0;
      
      req.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        chunks.push(chunk);
        console.log(`[FTP] Received chunk: ${chunk.length} bytes (total: ${totalSize})`);
      });

      req.on('end', async () => {
        try {
          if (isResponseSent) {
            console.log('[FTP] Response already sent, ignoring end event');
            return;
          }

          const fileBuffer = Buffer.concat(chunks);
          const clientId = req.headers['x-client-id'] as string;
          const rawFileName = req.headers['x-file-name'] as string;
          const fileName = rawFileName ? decodeURIComponent(rawFileName) : '';
          const fileType = req.headers['x-file-type'] as string || 'application/octet-stream';
          const category = req.headers['x-category'] as string;

          console.log(`[FTP] Received complete file: ${fileName} (${fileBuffer.length} bytes) for client ${clientId}`);

          if (!clientId || !fileName) {
            isResponseSent = true;
            return res.status(400).json({ error: "x-client-id and x-file-name headers are required" });
          }

          console.log(`[FTP] Uploading file for client ${clientId}: ${fileName} (${fileBuffer.length} bytes)`);

          // Upload to GoDaddy via FTP (FTP service already has 60-second timeout)
          const ftpUpload = ftpStorageService.uploadFile(
            clientId,
            fileName,
            fileBuffer,
            fileType
          );

          // Allow 70 seconds for FTP operation (FTP service has 60s timeout + network buffer)
          const timeoutMs = 70000;
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`FTP upload timed out after ${timeoutMs}ms`)), timeoutMs)
          );

          const { filePath, fileUrl } = await Promise.race([ftpUpload, timeoutPromise]);
          console.log(`[FTP] Upload success: ${fileUrl}`);

          // Determine document type
          let documentType = category || "Other";
          if (!category) {
            const lowerName = fileName.toLowerCase();
            if (lowerName.includes("w2") || lowerName.includes("w-2")) {
              documentType = "W-2";
            } else if (lowerName.includes("1099")) {
              documentType = "1099";
            } else if (
              lowerName.includes("id") ||
              lowerName.includes("license") ||
              lowerName.includes("passport")
            ) {
              documentType = "ID";
            }
          }

          // Get latest version number
          const existingDocs = await storage.getDocumentVersionsByType(clientId, documentType);
          const newVersion = existingDocs.length + 1;

          // Save document metadata to database
          const document = await storage.createDocumentVersion({
            clientId,
            documentName: fileName,
            documentType,
            fileUrl: fileUrl, // Store the /ftp/... path
            version: newVersion,
            uploadedBy: "staff",
            fileSize: fileBuffer.length,
            mimeType: fileType,
            notes: null,
          });

          console.log(`[FTP] Upload complete. Document ID: ${document.id}, Path: ${filePath}`);

          isResponseSent = true;
          if (requestTimeout) clearTimeout(requestTimeout);
          res.status(201).json(document);
        } catch (uploadError: any) {
          console.error("[FTP] Upload error:", uploadError);
          isResponseSent = true;
          if (requestTimeout) clearTimeout(requestTimeout);
          res.status(500).json({ error: uploadError.message });
        }
      });

      req.on('error', (error: any) => {
        console.error("[FTP] Request error:", error);
        isResponseSent = true;
        if (requestTimeout) clearTimeout(requestTimeout);
        if (!res.headersSent) {
          res.status(500).json({ error: error.message });
        }
      });

    } catch (error: any) {
      console.error("Error in FTP upload:", error);
      isResponseSent = true;
      if (requestTimeout) clearTimeout(requestTimeout);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Save document metadata after upload
  app.post("/api/objects/confirm", isAuthenticated, async (req, res) => {
    try {
      const { clientId, objectPath, fileName, fileType, fileSize, category } =
        req.body;

      if (!clientId || !objectPath || !fileName) {
        return res
          .status(400)
          .json({ error: "clientId, objectPath, and fileName are required" });
      }

      // Determine document type from category or file extension
      let documentType = category || "Other";
      if (!category) {
        const lowerName = fileName.toLowerCase();
        if (lowerName.includes("w2") || lowerName.includes("w-2")) {
          documentType = "W-2";
        } else if (lowerName.includes("1099")) {
          documentType = "1099";
        } else if (
          lowerName.includes("id") ||
          lowerName.includes("license") ||
          lowerName.includes("passport")
        ) {
          documentType = "ID";
        }
      }

      // Get latest version number for this client/document type
      const existingDocs = await storage.getDocumentVersionsByType(
        clientId,
        documentType,
      );
      const newVersion = existingDocs.length + 1;

      // Set ACL policy for the uploaded file to allow admin access
      try {
        const objectStorageService = new ObjectStorageService();
        const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
        // Set as private file so only authenticated users can access
        await setObjectAclPolicy(objectFile, {
          owner: clientId,
          visibility: "private",
        });
        console.log(`[OBJECTS] ACL policy set for ${objectPath}`);
      } catch (aclError) {
        console.warn(`[OBJECTS] Could not set ACL policy for ${objectPath}:`, aclError);
        // Don't fail the upload if ACL setting fails, but log it
      }

      // Save document metadata to database
      const document = await storage.createDocumentVersion({
        clientId,
        documentName: fileName,
        documentType,
        fileUrl: objectPath,
        version: newVersion,
        uploadedBy: "staff",
        fileSize: fileSize ? parseInt(String(fileSize)) : null,
        mimeType: fileType || null,
        notes: null,
      });

      res.status(201).json(document);
    } catch (error: any) {
      console.error("Error confirming upload:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Download/view a document - uses FTP to fetch from GoDaddy
  app.get("/api/documents/:id/download", isAuthenticated, async (req, res) => {
    try {
      const documentId = req.params.id;
      const document = await storage.getDocumentVersion(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const fileUrl = document.fileUrl;
      if (!fileUrl) {
        return res.status(404).json({ error: "Document has no file URL" });
      }

      const documentName = document.documentName || 'document';

      // Normalize fileUrl - ensure leading slash for consistent matching
      const normalizedUrl = fileUrl.startsWith('/') ? fileUrl : '/' + fileUrl;
      console.log(`[DOWNLOAD] Document ${documentId}, original URL: ${fileUrl}, normalized: ${normalizedUrl}`);

      // For Perfex CRM legacy documents, download via FTP from GoDaddy
      if (normalizedUrl.startsWith('/perfex-uploads/')) {
        // fileUrl is like: /perfex-uploads/uploads/customers/{clientId}/{filename}
        // Files are stored at: uploads/clients/perfex-{clientId}/{filename} on FTP server
        // The database stores Perfex numeric IDs but files are in perfex-{id} folders
        console.log(`[DOWNLOAD-PERFEX] Processing URL: ${normalizedUrl}`);
        const pathMatch = normalizedUrl.match(/\/perfex-uploads\/uploads\/customers\/([^/]+)\/(.+)/);
        if (pathMatch) {
          const perfexId = pathMatch[1];
          const filename = pathMatch[2];
          console.log(`[DOWNLOAD-PERFEX] Extracted - ID: ${perfexId}, Filename: ${filename}`);
          
          // Convert Perfex numeric ID to CRM folder format: perfex-{id}
          // If it's already prefixed with "perfex-", use as-is; otherwise add the prefix
          const clientFolder = perfexId.startsWith('perfex-') ? perfexId : `perfex-${perfexId}`;
          const filePath = `uploads/clients/${clientFolder}/${filename}`;
          console.log(`[DOWNLOAD-PERFEX] Primary path: ${filePath}`);
          
          const success = await ftpStorageService.streamFileToResponse(filePath, res, documentName);
          if (success) return;
          
          // Fallback: try without perfex- prefix in case some files use numeric IDs
          const fallbackPath = `uploads/clients/${perfexId}/${filename}`;
          console.log(`[DOWNLOAD-PERFEX] Fallback path: ${fallbackPath}`);
          const fallbackSuccess = await ftpStorageService.streamFileToResponse(fallbackPath, res, documentName);
          if (fallbackSuccess) return;
          
          console.error(`[DOWNLOAD-PERFEX] Both paths failed. Document: ${documentId}`);
          return res.status(404).json({ error: "File not found on FTP server" });
        }
        // Fallback: try the raw path without /perfex-uploads/ prefix
        console.log(`[DOWNLOAD-PERFEX] URL pattern did not match. Trying raw fallback.`);
        const fallbackPath = normalizedUrl.replace('/perfex-uploads/', '');
        console.log(`[DOWNLOAD-PERFEX] Raw fallback path: ${fallbackPath}`);
        const success = await ftpStorageService.streamFileToResponse(fallbackPath, res, documentName);
        if (success) return;
        return res.status(404).json({ error: "File not found on FTP server" });
      }

      // For FTP-uploaded files, download via FTP from GoDaddy
      if (normalizedUrl.startsWith('/ftp/')) {
        // Remove /ftp/ prefix to get the actual path
        const relativePath = normalizedUrl.replace('/ftp/', '');
        console.log(`[FTP] Downloading via FTP: ${relativePath} for document ${documentId}`);
        const success = await ftpStorageService.streamFileToResponse(relativePath, res, documentName);
        if (success) return;
        return res.status(404).json({ error: "File not found on FTP server" });
      }

      // For object storage files, get the file and stream it
      if (normalizedUrl.startsWith('/objects/')) {
        const objectStorageService = new ObjectStorageService();
        const objectFile = await objectStorageService.getObjectEntityFile(normalizedUrl);
        console.log(`[OBJECTS] Serving file: ${normalizedUrl} for document ${documentId}`);
        return objectStorageService.downloadObject(objectFile, res);
      }

      // For other URLs (like external https links), redirect to them
      if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
        return res.redirect(normalizedUrl);
      }

      // Unknown URL format - log for debugging
      console.log(`[DOWNLOAD] Unknown URL format: ${normalizedUrl}`);
      return res.status(404).json({ error: `Unknown file URL format: ${normalizedUrl}` });
    } catch (error) {
      console.error("Error serving document:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found in storage" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve uploaded files (keep for backward compatibility)
  app.get("/objects/*", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      console.log(`[OBJECTS] Serving file: ${req.path} for user ${(req as any).userId}`);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        console.error(`[OBJECTS] File not found: ${req.path}`);
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ FTP DIAGNOSTIC ROUTES ============
  
  // List FTP directory contents (for debugging)
  app.get("/api/admin/ftp/list", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const path = (req.query.path as string) || 'uploads';
      console.log(`[FTP DEBUG] Listing directory: ${path}`);
      const contents = await ftpStorageService.listDirectory(path);
      res.json({ path, contents });
    } catch (error: any) {
      console.error("[FTP DEBUG] Error listing directory:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ PERFEX CRM MIGRATION ROUTES ============
  // All admin routes require admin role

  // Test Perfex CRM database connection
  app.get(
    "/api/admin/perfex/test",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        const connected = await testPerfexConnection();
        if (connected) {
          const tables = await getPerfexTables();
          res.json({
            success: true,
            message: "Perfex CRM database connected!",
            tables,
          });
        } else {
          res
            .status(500)
            .json({
              success: false,
              message: "Failed to connect to Perfex CRM database",
            });
        }
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    },
  );

  // Describe a Perfex CRM table schema
  app.get(
    "/api/admin/perfex/describe/:table",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        const schema = await describePerfexTable(req.params.table);
        res.json(schema);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Get Perfex clients count
  app.get(
    "/api/admin/perfex/clients/count",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        const result = await queryPerfex(
          "SELECT COUNT(*) as count FROM tblclients",
        );
        res.json({ count: result[0]?.count || 0 });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Preview Perfex clients (first 20)
  app.get(
    "/api/admin/perfex/clients/preview",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        const clients = await queryPerfex(`
        SELECT userid, company, vat, phonenumber, city, state, zip, country, 
               address, website, datecreated, active, leadid, billing_street,
               billing_city, billing_state, billing_zip, billing_country
        FROM tblclients 
        ORDER BY datecreated DESC 
        LIMIT 20
      `);
        res.json(clients);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Get Perfex contacts for a client
  app.get(
    "/api/admin/perfex/contacts",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        const contacts = await queryPerfex(`
        SELECT id, userid, is_primary, firstname, lastname, email, phonenumber,
               title, datecreated, active
        FROM tblcontacts 
        ORDER BY datecreated DESC 
        LIMIT 50
      `);
        res.json(contacts);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Get Perfex files count
  app.get(
    "/api/admin/perfex/files/count",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        const result = await queryPerfex(
          "SELECT COUNT(*) as count FROM tblfiles WHERE rel_type = 'customer'",
        );
        res.json({ count: result[0]?.count || 0 });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Delete all WordPress signups from users table
  app.delete(
    "/api/admin/clear-wordpress-clients",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        const [result] = await mysqlPool.query(
          "DELETE FROM users WHERE original_submission_id IS NOT NULL",
        );
        const affected = (result as any).affectedRows || 0;
        res.json({
          success: true,
          message: `Deleted ${affected} WordPress signup clients`,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Migrate Perfex clients to CRM
  app.post(
    "/api/admin/migrate-perfex-clients",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        // Get all Perfex clients with their primary contact
        const clients = await queryPerfex(`
        SELECT 
          c.userid, c.company, c.phonenumber as company_phone, c.city, c.state, c.zip, c.country,
          c.address, c.datecreated, c.active,
          ct.id as contact_id, ct.firstname, ct.lastname, ct.email, ct.phonenumber as contact_phone
        FROM tblclients c
        LEFT JOIN tblcontacts ct ON c.userid = ct.userid AND ct.is_primary = 1
        ORDER BY c.datecreated DESC
      `);

        let migrated = 0;
        let errors: string[] = [];

        for (const client of clients) {
          try {
            const id = `perfex-${client.userid}`;
            const firstName =
              client.firstname || client.company?.split(" ")[0] || "Unknown";
            const lastName =
              client.lastname ||
              client.company?.split(" ").slice(1).join(" ") ||
              "";
            const email = client.email || null;
            const phone = client.contact_phone || client.company_phone || null;

            await mysqlPool.query(
              `
            INSERT INTO users (id, email, first_name, last_name, phone, address, city, state, zip_code, country, client_type, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              email = VALUES(email),
              first_name = VALUES(first_name),
              last_name = VALUES(last_name),
              phone = VALUES(phone),
              address = VALUES(address),
              city = VALUES(city),
              state = VALUES(state),
              zip_code = VALUES(zip_code),
              country = VALUES(country),
              updated_at = NOW()
          `,
              [
                id,
                email,
                firstName,
                lastName,
                phone,
                client.address,
                client.city,
                client.state,
                client.zip,
                client.country,
                client.active === 1 ? "Active Client" : "Inactive",
                `Company: ${client.company || "N/A"} | Perfex ID: ${client.userid}`,
                client.datecreated || new Date(),
              ],
            );

            migrated++;
          } catch (err: any) {
            errors.push(`Client ${client.userid}: ${err.message}`);
          }
        }

        res.json({
          success: true,
          message: `Migrated ${migrated} clients from Perfex CRM`,
          totalFound: clients.length,
          migrated,
          errors: errors.slice(0, 10),
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Migrate Perfex files/documents
  app.post(
    "/api/admin/migrate-perfex-documents",
    isAuthenticated,
    requireAdmin(),
    async (req, res) => {
      try {
        // Get all customer-related files from Perfex
        const files = await queryPerfex(`
        SELECT id, rel_id, rel_type, file_name, filetype, dateadded, 
               staffid, contact_id, visible_to_customer
        FROM tblfiles 
        WHERE rel_type = 'customer'
        ORDER BY dateadded DESC
      `);

        let migrated = 0;
        let errors: string[] = [];

        for (const file of files) {
          try {
            const clientId = `perfex-${file.rel_id}`;

            // Determine document type from filename
            let documentType = "Other";
            const lowerName = (file.file_name || "").toLowerCase();
            if (lowerName.includes("w2") || lowerName.includes("w-2")) {
              documentType = "W-2";
            } else if (lowerName.includes("1099")) {
              documentType = "1099";
            } else if (
              lowerName.includes("id") ||
              lowerName.includes("license") ||
              lowerName.includes("passport")
            ) {
              documentType = "ID";
            } else if (
              lowerName.includes("tax") ||
              lowerName.includes("return")
            ) {
              documentType = "Tax Return";
            }

            // File URL points to Perfex uploads folder structure
            const fileUrl = `/perfex-uploads/uploads/customers/${file.rel_id}/${file.file_name}`;

            await mysqlPool.query(
              `
            INSERT INTO document_versions (id, client_id, document_name, document_type, file_url, version, uploaded_by, notes, uploaded_at)
            VALUES (UUID(), ?, ?, ?, ?, 1, 'perfex-import', ?, ?)
          `,
              [
                clientId,
                file.file_name,
                documentType,
                fileUrl,
                "Imported from Perfex CRM",
                file.dateadded || new Date(),
              ],
            );

            migrated++;
          } catch (err: any) {
            errors.push(`File ${file.id}: ${err.message}`);
          }
        }

        res.json({
          success: true,
          message: `Imported ${migrated} document records from Perfex CRM`,
          totalFound: files.length,
          migrated,
          errors: errors.slice(0, 10),
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Notification preferences endpoints
  app.get(
    "/api/notifications/preferences",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.userId || req.user?.claims?.sub;
        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const prefs = await storage.getNotificationPreferences(userId);
        const defaults = {
          emailNotifications: true,
          documentAlerts: true,
          statusNotifications: true,
          messageAlerts: true,
          smsNotifications: false,
        };

        res.json(prefs ? prefs : { userId, ...defaults });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.patch(
    "/api/notifications/preferences",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const {
          emailNotifications,
          documentAlerts,
          statusNotifications,
          messageAlerts,
          smsNotifications,
        } = req.body;
        const userId = req.userId || req.user?.claims?.sub;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const updated = await storage.upsertNotificationPreferences({
          userId,
          emailNotifications,
          documentAlerts,
          statusNotifications,
          messageAlerts,
          smsNotifications,
        });

        res.json({
          success: true,
          message: "Notification preferences updated successfully",
          preferences: updated,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // ===========================================
  // DASHBOARD ENDPOINTS
  // ===========================================
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      const userRole = currentUser?.role?.toLowerCase() || 'client';
      const isStaffOrAdmin = userRole === 'admin' || userRole === 'tax_office' || userRole === 'staff' || userRole === 'manager';
      
      // Clients can only see limited dashboard stats - return early BEFORE any DB queries
      if (!isStaffOrAdmin) {
        return res.json({
          totalClients: 0,
          totalLeads: 0,
          pendingTasks: 0,
          upcomingAppointments: 0,
          activeFilings: 0,
          openTickets: 0,
        });
      }

      // Staff/Admin dashboard only - get counts from various tables
      let clientCount = 0;
      try {
        const [clientRows] = await mysqlPool.query(`SELECT COUNT(*) as count FROM users WHERE role = 'client'`);
        clientCount = (clientRows as any)[0]?.count || 0;
      } catch (e) {
        console.error('Dashboard: Error counting clients', e);
      }
      
      // Leads come from Perfex CRM, try to count or default to 0
      let leadCount = 0;
      try {
        const leads = await queryPerfex(`SELECT COUNT(*) as count FROM tblleads`);
        leadCount = leads[0]?.count || 0;
      } catch (e) {
        // Perfex might not be available - silently fail
        console.error('Dashboard: Perfex leads query failed, defaulting to 0');
        leadCount = 0;
      }
      
      let taskCount = 0;
      try {
        const [taskRows] = await mysqlPool.query(
          userRole === 'admin' || userRole === 'tax_office'
            ? `SELECT COUNT(*) as count FROM tasks`
            : `SELECT COUNT(*) as count FROM tasks WHERE assigned_to_id = ?`,
          userRole === 'admin' || userRole === 'tax_office' ? [] : [userId]
        );
        taskCount = (taskRows as any)[0]?.count || 0;
      } catch (e) {
        console.error('Dashboard: Error counting tasks', e);
      }
      
      let appointmentCount = 0;
      try {
        const [appointmentRows] = await mysqlPool.query(`SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= NOW()`);
        appointmentCount = (appointmentRows as any)[0]?.count || 0;
      } catch (e) {
        console.error('Dashboard: Error counting appointments', e);
      }
      
      let filingCount = 0;
      try {
        const [filingRows] = await mysqlPool.query(`SELECT COUNT(*) as count FROM tax_filings WHERE tax_year = ?`, [new Date().getFullYear()]);
        filingCount = (filingRows as any)[0]?.count || 0;
      } catch (e) {
        console.error('Dashboard: Error counting filings', e);
      }
      
      let ticketCount = 0;
      try {
        const [ticketRows] = await mysqlPool.query(`SELECT COUNT(*) as count FROM tickets WHERE status = 'open'`);
        ticketCount = (ticketRows as any)[0]?.count || 0;
      } catch (e) {
        console.error('Dashboard: Error counting tickets', e);
      }

      res.json({
        totalClients: clientCount,
        totalLeads: leadCount,
        pendingTasks: taskCount,
        upcomingAppointments: appointmentCount,
        activeFilings: filingCount,
        openTickets: ticketCount,
      });
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // CLIENTS ENDPOINTS - WITH SCOPE ENFORCEMENT
  // ===========================================
  app.get("/api/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      const userRole = currentUser?.role?.toLowerCase() || 'client';
      
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string || '';

      let query = `SELECT id, email, first_name as firstName, last_name as lastName, phone, 
                   address, city, state, zip_code as zipCode, country, role, is_active as isActive,
                   created_at as createdAt, office_id as officeId
                   FROM users WHERE role = 'client'`;
      const params: any[] = [];

      if (search) {
        query += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // SCOPE ENFORCEMENT: Filter based on user role
      if (userRole === 'admin') {
        // Admin has global access - no filtering needed
      } else if (userRole === 'tax_office') {
        // Tax Office: only clients in their office
        if (currentUser?.officeId) {
          query += ` AND office_id = ?`;
          params.push(currentUser.officeId);
        } else {
          return res.json([]); // No office assigned, return empty
        }
      } else if (userRole === 'agent') {
        // Agent: ONLY clients explicitly assigned to them
        const assignedClientIds = await mysqlStorage.getAgentAssignedClientIds(userId);
        if (assignedClientIds.length === 0) {
          return res.json([]); // No assigned clients, return empty
        }
        query += ` AND id IN (${assignedClientIds.map(() => '?').join(',')})`;
        params.push(...assignedClientIds);
      } else {
        // Client can only see themselves
        query += ` AND id = ?`;
        params.push(userId);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [rows] = await mysqlPool.query(query, params);
      res.json(rows);
    } catch (error: any) {
      console.error('Clients fetch error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const [rows] = await mysqlPool.query(
        `SELECT id, email, first_name as firstName, last_name as lastName, phone, 
         address, city, state, zip_code as zipCode, country, role, is_active as isActive,
         created_at as createdAt FROM users WHERE id = ?`,
        [id]
      );
      const client = (rows as any[])[0];
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // TASKS ENDPOINTS
  // Note: Primary tasks endpoints are defined earlier with proper permission checks
  // This is a fallback endpoint that uses the same filtering logic
  // ===========================================
  // Removed duplicate - tasks endpoints are defined earlier with proper permission checks

  // Document endpoints are defined earlier with proper permission checks
  // (lines 3132-3213) - removed duplicate uncontrolled routes here

  // ===========================================
  // TICKETS ENDPOINTS
  // ===========================================
  app.get("/api/tickets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      const userRole = currentUser?.role?.toLowerCase() || 'client';

      let tickets;
      if (userRole === 'client') {
        tickets = await storage.getTicketsByClient(userId);
      } else if (userRole === 'admin' || userRole === 'tax_office') {
        tickets = await storage.getTickets();
      } else {
        tickets = await storage.getTicketsByAssignee(userId);
      }
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tickets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const ticket = await storage.getTicket(id);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tickets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      
      const ticketData = {
        ...req.body,
        clientId: req.body.clientId || userId,
        clientName: req.body.clientName || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim(),
      };
      
      const ticket = await storage.createTicket(ticketData);
      
      // Send email notification to client about ticket creation
      const clientId = ticketData.clientId;
      if (clientId) {
        try {
          const client = await storage.getUser(clientId);
          if (client?.email) {
            await sendSupportTicketCreatedEmail(
              client.email,
              client.firstName || 'Client',
              ticket.id,
              ticketData.subject || 'Support Request',
              ticketData.priority || 'normal'
            );
            console.log(`[EMAIL] Support ticket created notification sent to ${client.email}`);
          }

          // Send in-app notification to all admins about new ticket
          try {
            const client = await storage.getUser(clientId);
            const admins = await storage.getUsersByRole('admin');
            for (const admin of admins) {
              await storage.createNotification({
                userId: admin.id,
                type: 'new_ticket',
                title: 'New Support Ticket',
                message: `${client?.firstName || 'Client'}: ${ticketData.subject || 'Support Request'}`,
                link: '/support',
                resourceType: 'ticket',
                resourceId: ticket.id
              });
            }
          } catch (notifError) {
            console.error('[NOTIFICATION] Failed to send ticket notifications to admins:', notifError);
          }
        } catch (emailError) {
          console.error('[EMAIL] Failed to send support ticket notification:', emailError);
        }
      }
      
      res.status(201).json(ticket);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/tickets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const ticket = await storage.updateTicket(id, req.body);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      // Send email notification when there's a new response
      if (req.body.response && ticket.clientId) {
        try {
          const client = await storage.getUser(ticket.clientId);
          const responderId = req.userId || req.user?.claims?.sub;
          const responder = responderId ? await storage.getUser(responderId) : null;
          
          if (client?.email) {
            await sendSupportTicketResponseEmail(
              client.email,
              client.firstName || 'Client',
              ticket.id,
              ticket.subject || 'Support Request',
              req.body.response,
              responder ? `${responder.firstName} ${responder.lastName}` : 'Support Team'
            );
            console.log(`[EMAIL] Support ticket response notification sent to ${client.email}`);
          }
        } catch (emailError) {
          console.error('[EMAIL] Failed to send support ticket response notification:', emailError);
        }
      }
      
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/tickets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTicket(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // KNOWLEDGE BASE ENDPOINTS
  // ===========================================
  app.get("/api/knowledge-base", async (req: any, res) => {
    try {
      const category = req.query.category as string;
      let articles;
      if (category) {
        articles = await storage.getKnowledgeBaseByCategory(category);
      } else {
        articles = await storage.getKnowledgeBaseArticles();
      }
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/knowledge-base/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const article = await storage.getKnowledgeBaseArticle(id);
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      res.json(article);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/knowledge-base", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      
      const articleData = {
        ...req.body,
        authorId: userId,
        authorName: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim(),
      };
      
      const article = await storage.createKnowledgeBaseArticle(articleData);
      res.status(201).json(article);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/knowledge-base/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const article = await storage.updateKnowledgeBaseArticle(id, req.body);
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      res.json(article);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/knowledge-base/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteKnowledgeBaseArticle(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // E-SIGNATURES ENDPOINTS
  // ===========================================
  app.get("/api/e-signatures", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      const userRole = currentUser?.role?.toLowerCase() || 'client';

      let signatures;
      if (userRole === 'client') {
        signatures = await storage.getESignaturesByClient(userId);
      } else {
        signatures = await storage.getESignatures();
      }
      res.json(signatures);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // TAX DEADLINES ENDPOINTS
  // ===========================================
  app.get("/api/tax-deadlines", isAuthenticated, async (req: any, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const deadlines = await storage.getTaxDeadlinesByYear(year);
      res.json(deadlines);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tax-deadlines", isAuthenticated, async (req: any, res) => {
    try {
      const deadline = await storage.createTaxDeadline(req.body);
      res.status(201).json(deadline);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/tax-deadlines/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deadline = await storage.updateTaxDeadline(id, req.body);
      if (!deadline) {
        return res.status(404).json({ error: 'Deadline not found' });
      }
      res.json(deadline);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/tax-deadlines/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTaxDeadline(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // EMAIL LOGS ENDPOINTS
  // ===========================================
  app.get("/api/email-logs", isAuthenticated, async (req: any, res) => {
    try {
      const clientId = req.query.clientId as string;
      let logs;
      if (clientId) {
        logs = await storage.getEmailLogsByClient(clientId);
      } else {
        logs = await storage.getEmailLogs();
      }
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // STAFF MEMBERS ENDPOINTS  
  // ===========================================
  app.get("/api/staff-members", isAuthenticated, async (req: any, res) => {
    try {
      const staff = await storage.getStaffMembers();
      res.json(staff);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // ANALYTICS ENDPOINTS
  // ===========================================
  app.get("/api/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      // Get filing metrics
      const filingMetrics = await storage.getTaxFilingMetrics(year);
      
      // Get monthly data
      const [monthlyFilings] = await mysqlPool.query(
        `SELECT MONTH(created_at) as month, COUNT(*) as count 
         FROM tax_filings WHERE tax_year = ? 
         GROUP BY MONTH(created_at) ORDER BY month`,
        [year]
      );

      const [monthlyClients] = await mysqlPool.query(
        `SELECT MONTH(created_at) as month, COUNT(*) as count 
         FROM users WHERE role = 'client' AND YEAR(created_at) = ?
         GROUP BY MONTH(created_at) ORDER BY month`,
        [year]
      );

      res.json({
        filingMetrics,
        monthlyFilings,
        monthlyClients,
        year,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // OFFICE BRANDING ENDPOINTS (White-labeling)
  // ===========================================

  // Default STS branding for fallback
  const DEFAULT_BRANDING: Partial<OfficeBranding> = {
    companyName: 'STS TaxRepair',
    logoUrl: null,
    primaryColor: '#1a4d2e',
    secondaryColor: '#4CAF50',
    accentColor: '#22c55e',
    defaultTheme: 'light',
    replyToEmail: 'support@ststaxrepair.org',
    replyToName: 'STS TaxRepair Support'
  };

  // Public endpoint - Get branding for current subdomain or officeId
  // This is used on login pages before authentication
  app.get("/api/branding", async (req: any, res) => {
    try {
      const officeId = req.query.officeId as string;
      const slug = req.query.slug as string;
      
      let branding: OfficeBranding | undefined;
      
      if (officeId) {
        branding = await storage.getOfficeBranding(officeId);
      } else if (slug) {
        const office = await storage.getOfficeBySlug(slug);
        if (office) {
          branding = await storage.getOfficeBranding(office.id);
        }
      }
      
      // Return office branding merged with defaults
      const responseBranding = {
        ...DEFAULT_BRANDING,
        ...(branding || {}),
        isCustom: !!branding
      };

      // Transform logoUrl to a proxy endpoint if it's an internal path
      if (responseBranding.logoUrl && responseBranding.logoUrl.startsWith('/objects/') && responseBranding.officeId) {
        responseBranding.logoUrl = `/api/offices/${responseBranding.officeId}/logo`;
      }

      res.json(responseBranding);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get branding for specific office (authenticated)
  app.get("/api/offices/:id/branding", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Check authorization - must be admin or belong to office
      const userId = req.userId || req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.officeId !== id)) {
        return res.status(403).json({ error: 'Unauthorized - cannot access this office branding' });
      }
      
      const branding = await storage.getOfficeBranding(id);
      const office = await storage.getOffice(id);
      
      const responseBranding = {
        ...DEFAULT_BRANDING,
        ...(branding || {}),
        officeName: office?.name,
        officeSlug: office?.slug,
        isCustom: !!branding
      };

      // Transform logoUrl to a proxy endpoint if it's an internal path
      if (responseBranding.logoUrl && responseBranding.logoUrl.startsWith('/objects/')) {
        responseBranding.logoUrl = `/api/offices/${id}/logo`;
      }
      
      res.json(responseBranding);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update office branding (requires branding.manage permission)
  app.put("/api/offices/:id/branding", isAuthenticated, requirePermission('branding.manage'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId || req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      // Only admin or users in this office can update
      if (!user || (user.role !== 'admin' && user.officeId !== id)) {
        return res.status(403).json({ error: 'Unauthorized - cannot update this office branding' });
      }
      
      // Validate input (allow partial updates)
      const {
        companyName,
        logoUrl,
        logoObjectKey,
        primaryColor,
        secondaryColor,
        accentColor,
        defaultTheme,
        replyToEmail,
        replyToName,
        slug
      } = req.body;
      
      // Validate slug uniqueness if provided
      if (slug !== undefined) {
        if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
          return res.status(400).json({ error: 'Slug must contain only lowercase letters, numbers, or hyphens' });
        }
        
        const existing = await storage.getOfficeBySlug(slug);
        if (existing && existing.id !== id) {
          return res.status(400).json({ error: 'Slug already in use' });
        }
      }
      
      // Check for existing branding
      let branding = await storage.getOfficeBranding(id);
      
      const brandingData = {
        companyName: companyName !== undefined ? companyName : branding?.companyName,
        logoUrl: logoUrl !== undefined ? logoUrl : branding?.logoUrl,
        logoObjectKey: logoObjectKey !== undefined ? logoObjectKey : branding?.logoObjectKey,
        primaryColor: primaryColor !== undefined ? primaryColor : branding?.primaryColor,
        secondaryColor: secondaryColor !== undefined ? secondaryColor : branding?.secondaryColor,
        accentColor: accentColor !== undefined ? accentColor : branding?.accentColor,
        defaultTheme: defaultTheme !== undefined ? defaultTheme : branding?.defaultTheme,
        replyToEmail: replyToEmail !== undefined ? replyToEmail : branding?.replyToEmail,
        replyToName: replyToName !== undefined ? replyToName : branding?.replyToName,
        updatedByUserId: userId
      };
      
      if (!branding) {
        // Create new branding
        branding = await storage.createOfficeBranding({
          officeId: id,
          ...brandingData
        });
      } else {
        // Update existing branding
        branding = await storage.updateOfficeBranding(id, brandingData);
      }
      
      // Update office slug if provided
      if (slug !== undefined) {
        await storage.updateOffice(id, { slug });
      }
      
      // Log branding change
      await mysqlStorage.createAuditLog({
        userId,
        action: 'branding.update',
        resourceType: 'office_branding',
        resourceId: id,
        details: brandingData,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      res.json({
        ...DEFAULT_BRANDING,
        ...branding,
        isCustom: true
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload office logo - returns presigned URL
  app.post("/api/offices/:id/logo-upload", isAuthenticated, requirePermission('branding.manage'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { fileName } = req.body;
      const userId = req.userId || req.user?.claims?.sub;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'admin' && user.officeId !== id)) {
        return res.status(403).json({ error: 'Unauthorized - cannot upload logo for this office' });
      }

      if (!fileName) {
        return res.status(400).json({ error: 'fileName is required' });
      }

      const objectStorage = new ObjectStorageService();
      const { uploadURL, objectPath } = await objectStorage.getOfficeLogoUploadURL(id, fileName);
      res.json({ uploadURL, objectPath });
    } catch (error: any) {
      console.error('Office logo upload URL error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Confirm office logo upload and persist branding
  app.post("/api/offices/:id/logo-confirm", isAuthenticated, requirePermission('branding.manage'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { objectPath } = req.body;
      const userId = req.userId || req.user?.claims?.sub;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'admin' && user.officeId !== id)) {
        return res.status(403).json({ error: 'Unauthorized - cannot update logo for this office' });
      }

      if (!objectPath) {
        return res.status(400).json({ error: 'objectPath is required' });
      }

      const office = await storage.getOffice(id);
      if (!office) {
        return res.status(404).json({ error: 'Office not found' });
      }

      let branding = await storage.getOfficeBranding(id);
      if (branding) {
        branding = await storage.updateOfficeBranding(id, {
          logoUrl: objectPath,
          logoObjectKey: objectPath,
          updatedByUserId: userId,
        });
      } else {
        branding = await storage.createOfficeBranding({
          officeId: id,
          companyName: office.name,
          logoUrl: objectPath,
          logoObjectKey: objectPath,
          updatedByUserId: userId,
        } as any);
      }

      res.json({
        success: true,
        branding,
      });
    } catch (error: any) {
      console.error('Office logo confirm error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve office logo
  app.get("/api/offices/:id/logo", async (req: any, res) => {
    try {
      const { id } = req.params;
      const branding = await storage.getOfficeBranding(id);

      if (!branding?.logoUrl) {
        return res.status(404).json({ error: 'Logo not found' });
      }

      // External URL
      if (branding.logoUrl.startsWith('http')) {
        return res.redirect(branding.logoUrl);
      }

      const objectStorage = new ObjectStorageService();
      const file = await objectStorage.getObjectEntityFile(branding.logoUrl);
      await objectStorage.downloadObject(file, res, 3600);
    } catch (error: any) {
      console.error('Office logo fetch error:', error);
      if (!res.headersSent) {
        res.status(404).json({ error: 'Logo not found' });
      }
    }
  });

  // Delete/Reset office branding to defaults (requires branding.manage permission)
  app.delete("/api/offices/:id/branding", isAuthenticated, requirePermission('branding.manage'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId || req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      // Only admin or users in this office can reset
      if (!user || (user.role !== 'admin' && user.officeId !== id)) {
        return res.status(403).json({ error: 'Unauthorized - cannot reset this office branding' });
      }
      
      // Delete the branding record (will fall back to defaults)
      const deleted = await storage.deleteOfficeBranding(id);
      
      // Log branding reset
      await mysqlStorage.createAuditLog({
        userId,
        action: 'branding.update',
        resourceType: 'office_branding',
        resourceId: id,
        details: { action: 'reset_to_defaults' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      res.json({
        ...DEFAULT_BRANDING,
        isCustom: false,
        reset: deleted
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user theme preference
  app.patch("/api/users/:id/theme", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { theme } = req.body;
      const userId = req.userId || req.user?.claims?.sub;
      
      // Can only update own theme
      if (userId !== id) {
        return res.status(403).json({ error: 'Can only update your own theme preference' });
      }
      
      // Validate theme value
      const validThemes: ThemePreference[] = ['system', 'light', 'dark'];
      if (!validThemes.includes(theme)) {
        return res.status(400).json({ error: 'Invalid theme. Must be system, light, or dark' });
      }
      
      const updatedUser = await storage.updateUserThemePreference(id, theme);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ theme: updatedUser.themePreference });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // OFFICES ENDPOINTS
  // ===========================================

  // Get all offices (admin only)
  app.get("/api/offices", isAuthenticated, requireAdmin(), async (req: any, res) => {
    try {
      const offices = await storage.getOffices();
      res.json(offices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get office by id (admin or office members)
  app.get("/api/offices/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId || req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.officeId !== id)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const office = await storage.getOffice(id);
      if (!office) {
        return res.status(404).json({ error: 'Office not found' });
      }
      
      res.json(office);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create office (admin only)
  app.post("/api/offices", isAuthenticated, requireAdmin(), async (req: any, res) => {
    try {
      const { name, slug, address, city, state, zipCode, phone, email, defaultTaxYear } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Office name is required' });
      }
      
      // Check slug uniqueness
      if (slug) {
        const existing = await storage.getOfficeBySlug(slug);
        if (existing) {
          return res.status(400).json({ error: 'Slug already in use' });
        }
      }
      
      const office = await storage.createOffice({ name, slug, address, city, state, zipCode, phone, email, defaultTaxYear });
      res.status(201).json(office);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update office (admin or tax_office of that office)
  app.patch("/api/offices/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId || req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && (user.role !== 'tax_office' || user.officeId !== id))) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const { name, slug, address, city, state, zipCode, phone, email, defaultTaxYear, isActive } = req.body;
      
      // Check slug uniqueness if changing
      if (slug) {
        const existing = await storage.getOfficeBySlug(slug);
        if (existing && existing.id !== id) {
          return res.status(400).json({ error: 'Slug already in use' });
        }
      }
      
      const office = await storage.updateOffice(id, { 
        name, 
        slug, 
        address, 
        city,
        state,
        zipCode,
        phone, 
        email,
        defaultTaxYear,
        isActive 
      });
      
      if (!office) {
        return res.status(404).json({ error: 'Office not found' });
      }
      
      res.json(office);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // STAFF REQUESTS ENDPOINTS
  // ===========================================

  // Public: Submit staff sign-up request (no auth required)
  app.post("/api/staff-requests", async (req, res) => {
    try {
      const { firstName, lastName, email, phone, roleRequested, officeId, reason, experience } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !email || !roleRequested) {
        return res.status(400).json({ 
          error: 'First name, last name, email, and role are required' 
        });
      }
      
      // Validate role
      const validRoles = ['agent', 'tax_office', 'admin'];
      if (!validRoles.includes(roleRequested)) {
        return res.status(400).json({ error: 'Invalid role requested' });
      }
      
      // Check if email already exists as user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        // If they are already staff or admin, block them
        if (existingUser.role !== 'client') {
          return res.status(400).json({ 
            error: `An account with this email already exists with role: ${existingUser.role}. Please log in instead.`,
            code: 'ACCOUNT_EXISTS',
            email: email
          });
        }
        
        // If they are a client, we allow them to submit a staff request
        // but we'll check if they are verified first to give a better message
        if (!existingUser.emailVerifiedAt) {
          // Fall through to allow them to submit, but the frontend will show 
          // they need verification if we returned an error.
          // For now, let's allow them to submit the request even if unverified,
          // as they can verify later. Or we can block and ask for verification.
          // The current frontend expects an error to show the verification box.
          
          return res.status(400).json({ 
            error: 'An account with this email already exists but is not verified. Please check your email for the verification link, or go to the login page and request a new verification email.',
            code: 'ACCOUNT_EXISTS_UNVERIFIED',
            email: email
          });
        }
        
        // If they are a verified client, they can still submit a staff request.
        // We'll proceed to check for pending requests.
      }
      
      // Check for pending request with same email
      const existingRequest = await mysqlStorage.getStaffRequestByEmail(email);
      if (existingRequest && existingRequest.status === 'pending') {
        return res.status(400).json({ 
          error: 'A pending request with this email already exists' 
        });
      }
      
      // Create the request
      const staffRequest = await mysqlStorage.createStaffRequest({
        firstName,
        lastName,
        email,
        phone: phone || null,
        roleRequested,
        officeId: officeId || null,
        reason: reason || null,
        experience: experience || null
      });
      
      // Log the request submission
      await mysqlStorage.createAuditLog({
        action: 'staff_request.submit',
        userId: 'system',
        userName: `${firstName} ${lastName}`,
        userRole: 'client',
        officeId: officeId || null,
        resourceType: 'staff_request',
        resourceId: staffRequest.id,
        details: { email, roleRequested },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Send notification emails and in-app notifications to all admins
      try {
        const admins = await mysqlStorage.getUsersByRole('admin');
        const superAdmins = await mysqlStorage.getUsersByRole('super_admin');
        const recipients = Array.from(
          new Map(
            [...admins, ...superAdmins]
              .filter((user) => user.email && user.isActive !== false)
              .map((user) => [user.id ?? user.email, user])
          ).values()
        );

        for (const admin of recipients) {
          // Send email notification
          await sendStaffRequestNotificationEmail(
            admin.email as string,
            `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Admin',
            firstName,
            lastName,
            email,
            roleRequested,
            reason || 'No reason provided'
          );
          
          // Create in-app notification
          await mysqlStorage.createNotification({
            userId: admin.id,
            type: 'staff_request',
            title: 'New Staff Request',
            message: `${firstName} ${lastName} has requested to join as ${roleRequested}`,
            link: '/manager?tab=requests',
            resourceType: 'staff_request',
            resourceId: staffRequest.id
          });
        }
        console.log(`[EMAIL] Staff request notifications sent to ${recipients.length} admin(s)`);
      } catch (emailError) {
        console.error('[EMAIL] Failed to send staff request notifications:', emailError);
      }
      
      res.status(201).json({ 
        success: true,
        message: 'Your request has been submitted. We will review it and contact you soon.',
        id: staffRequest.id 
      });
    } catch (error: any) {
      console.error('Error creating staff request:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all staff requests (admin, tax office, agent)
  app.get("/api/staff-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      const userRole = currentUser?.role?.toLowerCase() || 'client';
      
      // Only admin, tax_office, and agent can view staff requests
      if (!['admin', 'tax_office', 'agent'].includes(userRole)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { status, officeId, limit, offset } = req.query;
      
      const requests = await mysqlStorage.getStaffRequests({
        status: status as any,
        officeId: officeId as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });
      
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get staff request count (admin, tax office, agent)
  app.get("/api/staff-requests/count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      const userRole = currentUser?.role?.toLowerCase() || 'client';
      
      if (!['admin', 'tax_office', 'agent'].includes(userRole)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { status } = req.query;
      const count = await mysqlStorage.getStaffRequestsCount(status as any);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single staff request (admin, tax office, agent)
  app.get("/api/staff-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      const userRole = currentUser?.role?.toLowerCase() || 'client';
      
      if (!['admin', 'tax_office', 'agent'].includes(userRole)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { id } = req.params;
      const request = await mysqlStorage.getStaffRequest(id);
      
      if (!request) {
        return res.status(404).json({ error: 'Staff request not found' });
      }
      
      res.json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Approve or reject staff request (admin, tax office)
  app.patch("/api/staff-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      const userRole = currentUser?.role?.toLowerCase() || 'client';
      
      if (!['admin', 'tax_office'].includes(userRole)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const { id } = req.params;
      const { status, reviewNotes } = req.body;
      const adminId = req.userId || req.user?.claims?.sub;
      
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be approved or rejected' });
      }
      
      const request = await mysqlStorage.getStaffRequest(id);
      if (!request) {
        return res.status(404).json({ error: 'Staff request not found' });
      }
      
      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'This request has already been processed' });
      }
      
      // Update the request status
      const updatedRequest = await mysqlStorage.updateStaffRequestStatus(
        id, 
        status, 
        adminId, 
        reviewNotes
      );
      
      // If approved, create user account or update existing one
      if (status === 'approved') {
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(request.email);
        
        // Generate a random password if it's a new user (user will need to reset)
        const tempPassword = randomUUID().substring(0, 12);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        // Create or update the user
        await storage.upsertUser({
          id: existingUser?.id, // If they exist, update them. If not, upsert will generate new ID.
          email: request.email,
          firstName: request.firstName,
          lastName: request.lastName,
          phone: request.phone || undefined,
          role: request.roleRequested,
          officeId: request.officeId || undefined,
          passwordHash: existingUser?.passwordHash || hashedPassword,
          isActive: true
        });
        
        // Send welcome email with password reset link
        try {
          const resetToken = randomUUID();
          const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
          await storage.createPasswordResetToken(request.email, resetToken, expiresAt);
          
          const baseUrl = req.headers.origin || 'https://ststaxrepair.org';
          const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
          
          // Use the welcome email helper if available, or basic notification
          const emailHtml = `
            <h2>Welcome to STS TaxRepair!</h2>
            <p>Hi ${request.firstName},</p>
            <p>Your staff account request has been approved! You now have ${request.roleRequested} access to the system.</p>
            <p>Please set your password by clicking the link below:</p>
            <p><a href="${resetLink}" style="background-color:#1a4d2e;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;">Set Password</a></p>
            <p>This link expires in 48 hours.</p>
            <p>Best regards,<br>STS TaxRepair Team</p>
          `;
          
          await sendEmail({
            to: request.email,
            subject: 'Your STS TaxRepair Staff Account Has Been Approved',
            html: emailHtml
          });
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
        }
      } else {
        // Send rejection email
        try {
          const emailHtml = `
            <h2>STS TaxRepair Staff Request Update</h2>
            <p>Hi ${request.firstName},</p>
            <p>Thank you for your interest in joining our team.</p>
            <p>After reviewing your application, we regret to inform you that we are unable to approve your staff account request at this time.</p>
            ${reviewNotes ? `<p>Reviewer notes: ${reviewNotes}</p>` : ''}
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>STS TaxRepair Team</p>
          `;
          
          await sendEmail({
            to: request.email,
            subject: 'STS TaxRepair Staff Request Update',
            html: emailHtml
          });
        } catch (emailError) {
          console.error('Error sending rejection email:', emailError);
        }
      }
      
      // Log the decision
      await mysqlStorage.createAuditLog({
        action: status === 'approved' ? 'staff_request.approve' : 'staff_request.reject',
        userId: adminId,
        userName: null,
        userRole: 'admin',
        officeId: request.officeId,
        resourceType: 'staff_request',
        resourceId: id,
        details: { 
          email: request.email, 
          roleRequested: request.roleRequested,
          reviewNotes 
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      res.json(updatedRequest);
    } catch (error: any) {
      console.error('Error processing staff request:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // AUDIT LOGS / ACTIVITY ENDPOINTS
  // ===========================================

  // Get audit logs (for activity feed)
  app.get("/api/audit-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const { action, resourceType, clientId, limit, offset } = req.query;
      
      // Scope query based on user role
      let options: any = {
        action: action as string,
        resourceType: resourceType as string,
        clientId: clientId as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      };
      
      // Tax Office users can only see their office's logs
      if (user.role === 'tax_office') {
        options.officeId = user.officeId;
      }
      // Agents can only see logs for their assigned clients
      else if (user.role === 'agent') {
        const assignments = await mysqlStorage.getAgentAssignments(userId);
        const clientIds = assignments.map((a: any) => a.clientId);
        
        if (clientIds.length === 0) {
          return res.json([]);
        }
        
        // Note: For agents, we filter client-related logs only
        options.clientId = clientIds[0]; // Limited scope for agents
      }
      // Clients can only see their own logs
      else if (user.role === 'client') {
        options.clientId = userId;
      }
      // Admins can see all
      
      const logs = await mysqlStorage.getAuditLogs(options);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // REPORTS / METRICS ENDPOINTS
  // ===========================================

  // Get comprehensive CRM metrics (for reports page)
  app.get("/api/reports/metrics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Only staff can access reports
      if (user.role === 'client') {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Build scope options based on role
      let scopeOptions: any = { isGlobal: user.role === 'admin' || user.role === 'super_admin' };
      
      if (user.role === 'tax_office') {
        scopeOptions.officeId = user.officeId;
      } else if (user.role === 'agent') {
        const assignments = await mysqlStorage.getAgentAssignments(userId);
        scopeOptions.agentClientIds = assignments.map((a: any) => a.clientId);
      }
      
      // Fetch all metrics data
      const [
        clients, 
        payments, 
        appointments, 
        tasks, 
        leads, 
        taxFilings,
        tickets
      ] = await Promise.all([
        mysqlStorage.getClientsByScope(scopeOptions),
        mysqlStorage.getPaymentsByScope(scopeOptions),
        storage.getAppointments(),
        storage.getTasks(),
        storage.getLeads(),
        storage.getTaxFilings(),
        mysqlStorage.getTicketsByScope(scopeOptions)
      ]);
      
      // Calculate metrics
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      
      // Client metrics
      const totalClients = clients.length;
      const newClientsThisMonth = clients.filter(c => 
        c.createdAt && new Date(c.createdAt) >= startOfMonth
      ).length;
      const activeClients = clients.filter(c => c.isActive).length;
      
      // Payment metrics
      const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.serviceFee?.toString() || '0'), 0);
      const paymentsThisMonth = payments.filter(p => 
        p.createdAt && new Date(p.createdAt) >= startOfMonth
      );
      const revenueThisMonth = paymentsThisMonth.reduce(
        (sum, p) => sum + parseFloat(p.serviceFee?.toString() || '0'), 0
      );
      const paymentsThisYear = payments.filter(p => 
        p.createdAt && new Date(p.createdAt) >= startOfYear
      );
      const revenueThisYear = paymentsThisYear.reduce(
        (sum, p) => sum + parseFloat(p.serviceFee?.toString() || '0'), 0
      );
      
      // Task metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;
      const overdueTasks = tasks.filter(t => 
        t.status === 'pending' && t.dueDate && new Date(t.dueDate) < now
      ).length;
      
      // Lead metrics
      const totalLeads = leads.length;
      const newLeads = leads.filter(l => l.status === 'new').length;
      const convertedLeads = leads.filter(l => l.status === 'converted').length;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(1) : 0;
      
      // Tax filing metrics
      const totalFilings = taxFilings.length;
      const filingsByStatus = {
        new: taxFilings.filter(f => f.status === 'new').length,
        documents_pending: taxFilings.filter(f => f.status === 'documents_pending').length,
        review: taxFilings.filter(f => f.status === 'review').length,
        filed: taxFilings.filter(f => f.status === 'filed').length,
        accepted: taxFilings.filter(f => f.status === 'accepted').length,
        approved: taxFilings.filter(f => f.status === 'approved').length,
        paid: taxFilings.filter(f => f.status === 'paid').length
      };
      const totalRefunds = taxFilings.reduce((sum, f) => {
        const estimated = parseFloat(f.estimatedRefund?.toString() || '0');
        const actual = parseFloat(f.actualRefund?.toString() || '0');
        return sum + (actual > 0 ? actual : estimated);
      }, 0);
      
      // Ticket metrics
      const totalTickets = tickets.length;
      const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
      const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
      
      // Appointment metrics
      const totalAppointments = appointments.length;
      const upcomingAppointments = appointments.filter(a => 
        a.appointmentDate && new Date(a.appointmentDate) >= now && a.status !== 'cancelled'
      ).length;
      const completedAppointments = appointments.filter(a => a.status === 'completed').length;
      
      res.json({
        clients: {
          total: totalClients,
          newThisMonth: newClientsThisMonth,
          active: activeClients
        },
        revenue: {
          total: totalPayments,
          thisMonth: revenueThisMonth,
          thisYear: revenueThisYear,
          paymentCount: payments.length
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          overdue: overdueTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0
        },
        leads: {
          total: totalLeads,
          new: newLeads,
          converted: convertedLeads,
          conversionRate
        },
        taxFilings: {
          total: totalFilings,
          byStatus: filingsByStatus,
          totalRefunds
        },
        tickets: {
          total: totalTickets,
          open: openTickets,
          resolved: resolvedTickets,
          resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets * 100).toFixed(1) : 0
        },
        appointments: {
          total: totalAppointments,
          upcoming: upcomingAppointments,
          completed: completedAppointments
        }
      });
    } catch (error: any) {
      console.error('Error fetching report metrics:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // NOTIFICATIONS ENDPOINTS
  // ===========================================

  // Get notifications for the current user
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const unreadOnly = req.query.unreadOnly === 'true';
      const type = req.query.type;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const notifications = await mysqlStorage.getNotifications(userId, {
        unreadOnly,
        type,
        limit,
        offset
      });

      res.json(notifications);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get unread notification count for the current user
  app.get("/api/notifications/count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const count = await mysqlStorage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error: any) {
      console.error('Error fetching notification count:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark a notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const notification = await mysqlStorage.markNotificationAsRead(id, userId);
      
      if (!notification) {
        return res.status(404).json({ error: "Notification not found or access denied" });
      }

      res.json(notification);
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await mysqlStorage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a notification
  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const deleted = await mysqlStorage.deleteNotification(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Notification not found or access denied" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // MARKETING - Email (Gmail) and SMS (Twilio)
  // ===========================================

  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_FROM;

  // Send marketing email via Gmail SMTP
  app.post("/api/marketing/email", isAuthenticated, requireAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { to, subject, message } = req.body || {};

      if (!Array.isArray(to) || to.length === 0) {
        return res.status(400).json({ error: "At least one recipient is required" });
      }
      if (!subject || !message) {
        return res.status(400).json({ error: "Subject and message are required" });
      }
      if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        return res.status(500).json({ error: "Gmail credentials are not configured (GMAIL_USER, GMAIL_APP_PASSWORD)" });
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD,
        },
      });

      let sent = 0;
      const errors: string[] = [];

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
          console.error(`[MARKETING][EMAIL] Failed for ${recipient}:`, err?.message || err);
          errors.push(`${recipient}: ${err?.message || "Send failed"}`);
        }
      }

      const failed = to.length - sent;
      res.json({ success: failed === 0, sent, failed, errors });
    } catch (error: any) {
      console.error("[MARKETING][EMAIL] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Send marketing SMS via Twilio
  app.post("/api/marketing/sms", isAuthenticated, requireAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { to, message } = req.body || {};

      if (!Array.isArray(to) || to.length === 0) {
        return res.status(400).json({ error: "At least one recipient is required" });
      }
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
        return res.status(500).json({ error: "Twilio is not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM)" });
      }

      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      let sent = 0;
      const errors: string[] = [];

      for (const recipient of to) {
        try {
          await client.messages.create({
            from: TWILIO_FROM,
            to: recipient,
            body: message,
          });
          sent += 1;
        } catch (err: any) {
          console.error(`[MARKETING][SMS] Failed for ${recipient}:`, err?.message || err);
          errors.push(`${recipient}: ${err?.message || "Send failed"}`);
        }
      }

      const failed = to.length - sent;
      res.json({ success: failed === 0, sent, failed, errors });
    } catch (error: any) {
      console.error("[MARKETING][SMS] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // Homepage Agents API (Public agents displayed on homepage)
  // ============================================

  // Get all homepage agents (public - no auth required)
  app.get("/api/homepage-agents", async (req, res) => {
    try {
      const agents = await mysqlStorage.getHomePageAgents();
      console.log(`[HOMEPAGE-AGENTS] Returning ${agents.length} agents`);
      agents.forEach(a => {
        console.log(`[HOMEPAGE-AGENTS] Agent: ${a.name}, imageUrl: ${a.imageUrl || 'NONE'}`);
      });
      res.json(agents);
    } catch (error: any) {
      console.error('Error fetching homepage agents:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new homepage agent (admin only)
  app.post("/api/homepage-agents", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const agent = await mysqlStorage.createHomePageAgent(req.body);
      res.status(201).json(agent);
    } catch (error: any) {
      console.error('Error creating homepage agent:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update a homepage agent (admin only)
  app.patch("/api/homepage-agents/:id", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const agent = await mysqlStorage.updateHomePageAgent(id, req.body);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error: any) {
      console.error('Error updating homepage agent:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a homepage agent (admin only)
  app.delete("/api/homepage-agents/:id", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await mysqlStorage.deleteHomePageAgent(id);
      if (!deleted) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting homepage agent:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Reorder homepage agents (admin only)
  app.post("/api/homepage-agents/reorder", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const { agentIds } = req.body;
      if (!Array.isArray(agentIds)) {
        return res.status(400).json({ error: "agentIds must be an array" });
      }
      await mysqlStorage.reorderHomePageAgents(agentIds);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error reordering homepage agents:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get upload URL for agent photo (admin only)
  app.post("/api/homepage-agents/:id/photo", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const { fileName } = req.body;
      
      if (!fileName) {
        return res.status(400).json({ error: "fileName is required" });
      }
      
      // Check if we're on Replit with Object Storage available
      if (isReplitEnvironment()) {
        const objectStorageService = new ObjectStorageService();
        const { uploadURL, objectPath } = await objectStorageService.getAgentPhotoUploadURL(id, fileName);
        res.json({ uploadURL, objectPath, mode: 'object-storage' });
      } else {
        // On Render/other environments, use FTP
        res.json({ 
          uploadURL: '/api/homepage-agents/photo-ftp',
          objectPath: null,
          mode: 'ftp',
          agentId: id
        });
      }
    } catch (error: any) {
      console.error('Error getting agent photo upload URL:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Confirm agent photo upload and update agent record (admin only)
  app.post("/api/homepage-agents/:id/photo/confirm", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const { objectPath } = req.body;
      
      if (!objectPath) {
        return res.status(400).json({ error: "objectPath is required" });
      }
      
      // Validate agent exists first
      const existingAgent = await mysqlStorage.getHomePageAgentById(id);
      if (!existingAgent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      // Store the object path - the /api/agent-photos/:id endpoint will handle serving
      const agent = await mysqlStorage.updateHomePageAgent(id, { imageUrl: objectPath });
      
      res.json({ success: true, imageUrl: objectPath, agent });
    } catch (error: any) {
      console.error('Error confirming agent photo upload:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // FTP upload for agent photos (non-Replit environments)
  app.post("/api/homepage-agents/photo-ftp", isAuthenticated, requireAdmin(), async (req: any, res) => {
    let diagId = `ftp-agent-${Date.now()}`;
    try {
      const agentId = req.headers['x-agent-id'] as string;
      const rawFileName = req.headers['x-file-name'] as string;
      const fileName = rawFileName ? decodeURIComponent(rawFileName) : '';
      const contentLength = Number(req.headers['content-length'] || 0);

      // Check env configuration early for clearer errors
      const missingEnv = ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD']
        .filter((k) => !process.env[k]);
      if (missingEnv.length > 0) {
        console.error(`[${diagId}] Missing FTP env vars: ${missingEnv.join(', ')}`);
        return res.status(500).json({ 
          error: "FTP credentials not configured",
          missingEnv,
          diagId,
        });
      }

      if (!agentId || !fileName) {
        return res.status(400).json({ error: "x-agent-id and x-file-name headers are required" });
      }

      // Validate agent exists
      const existingAgent = await mysqlStorage.getHomePageAgentById(agentId);
      if (!existingAgent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      // Use body from express.raw() middleware for application/octet-stream
      let fileBuffer: Buffer | null = null;
      if (Buffer.isBuffer(req.body)) {
        fileBuffer = req.body;
      } else if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
        fileBuffer = req.rawBody as Buffer;
      }
      
      if (!fileBuffer || fileBuffer.length === 0) {
        console.error(`[${diagId}] No file data received`, { 
          hasBody: !!req.body, 
          bodyType: typeof req.body, 
          isBodyBuffer: Buffer.isBuffer(req.body),
          hasRawBody: !!req.rawBody,
          rawBodyType: typeof req.rawBody,
          isRawBodyBuffer: req.rawBody ? Buffer.isBuffer(req.rawBody) : false
        });
        return res.status(400).json({ error: "No file data received", diagId, contentLength });
      }
      
      if (fileBuffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "File too large (max 5MB)", diagId, size: fileBuffer.length });
      }

      console.log(`[${diagId}] Uploading agent photo`, {
        agentId,
        fileName,
        size: fileBuffer.length,
        contentLength,
      });

      // Upload to FTP in WordPress uploads directory (so WordPress can serve it)
      const result = await ftpStorageService.uploadFile(
        agentId,
        fileName,
        fileBuffer,
        undefined,
        'wp-content/uploads/agent-photos'
      );
      
      // Update agent with new image URL
      const imageUrl = `/ftp/${result.filePath}`;
      await mysqlStorage.updateHomePageAgent(agentId, { imageUrl });

      res.json({ 
        success: true, 
        filePath: result.filePath,
        fileUrl: result.fileUrl,
        imageUrl,
        diagId,
      });
    } catch (error: any) {
      console.error("Error in FTP agent photo upload:", error);
      res.status(500).json({ error: error.message, diagId });
    }
  });

  // Serve agent photos from object storage
  app.get("/api/agent-photos/:id", async (req, res) => {
    let diagId = `serve-photo-${Date.now()}`;
    try {
      const { id } = req.params;
      console.log(`[${diagId}] Request for agent ID: ${id}`);
      
      // Clean ID in case of browser quirks
      const cleanId = id.split('?')[0].split(':')[0];
      const agent = await mysqlStorage.getHomePageAgentById(cleanId);
      
      if (!agent) {
        console.error(`[${diagId}] Agent not found in DB: ${cleanId}`);
        return res.status(404).json({ error: "Agent not found", diagId });
      }
      
      if (!agent.imageUrl) {
        console.warn(`[${diagId}] Agent ${cleanId} has no imageUrl`);
        return res.status(404).json({ error: "Agent photo not found", diagId });
      }
      
      const imageUrl = agent.imageUrl;
      console.log(`[${diagId}] Agent ${cleanId} imageUrl in DB: ${imageUrl}`);
      
      // Handle different storage formats
      if (imageUrl.startsWith('/objects/public/')) {
        // Replit Object Storage
        const objectStorageService = new ObjectStorageService();
        const file = await objectStorageService.getPublicObjectFile(imageUrl);
        if (!file) {
          console.error(`[${diagId}] Replit object file not found: ${imageUrl}`);
          return res.status(404).json({ error: "Photo file not found", diagId });
        }
        await objectStorageService.downloadObject(file, res);
      } else if (imageUrl.startsWith('/ftp/')) {
        // FTP storage - redirect to the actual URL
        // Remove /ftp/ prefix
        let ftpPath = imageUrl.replace('/ftp/', '');
        
        // Ensure path starts with wp-content/uploads if it's a legacy or agent photo
        if (!ftpPath.startsWith('wp-content/')) {
          ftpPath = `wp-content/uploads/${ftpPath}`;
        }
        
        // Try to determine the best domain for the redirect
        const host = req.hostname || 'ststaxrepair.org';
        const redirectUrl = `https://${host}/${ftpPath}`;
        
        console.log(`[${diagId}] Redirecting to: ${redirectUrl}`);
        return res.redirect(redirectUrl);
      } else if (imageUrl.startsWith('http')) {
        // External URL - redirect
        return res.redirect(imageUrl);
      } else {
        console.error(`[${diagId}] Unknown image format for agent ${cleanId}: ${imageUrl}`);
        return res.status(404).json({ error: "Unknown image format", diagId });
      }
    } catch (error: any) {
      console.error(`[${diagId}] Error serving agent photo:`, error);
      res.status(500).json({ error: error.message, diagId });
    }
  });

  // Register AI Assistant routes
  app.use('/api/ai', aiRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
