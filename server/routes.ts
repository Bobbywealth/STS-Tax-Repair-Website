import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireRole, requireMinRole, requireAdmin, requireStaff, requirePermission } from "./authorization";
import {
  insertTaxDeadlineSchema,
  insertAppointmentSchema,
  insertPaymentSchema,
  insertDocumentVersionSchema,
  insertESignatureSchema,
  insertEmailLogSchema,
  insertDocumentRequestTemplateSchema,
  type Form8879Data
} from "@shared/mysql-schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { testPerfexConnection, getPerfexTables, queryPerfex, describePerfexTable } from "./perfex-db";
import { mysqlPool, runMySQLMigrations } from "./mysql-db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import bcrypt from "bcrypt";
import { encrypt, decrypt } from "./encryption";

export async function registerRoutes(app: Express): Promise<Server> {
  // Run MySQL migrations on startup
  await runMySQLMigrations();
  
  // Setup Authentication
  await setupAuth(app);

  // Redirect Perfex document URLs to the actual Perfex server
  // Perfex stores files at: uploads/clients/[CLIENT_ID]/filename
  // Accessed via: /download/preview_image?path=uploads/clients/[CLIENT_ID]/filename
  app.get("/perfex-uploads/uploads/customers/:clientId/*", (req, res) => {
    const perfexBaseUrl = "https://ststaxrepair.org";
    const clientId = req.params.clientId;
    // Get filename from the path (everything after /customers/clientId/)
    const pathParts = req.path.split(`/customers/${clientId}/`);
    const filename = pathParts[1] || '';
    // Perfex uses 'clients' not 'customers' in the actual file path
    const filePath = `uploads/clients/${clientId}/${filename}`;
    const fullUrl = `${perfexBaseUrl}/download/preview_image?path=${encodeURIComponent(filePath)}`;
    res.redirect(fullUrl);
  });

  // Auth routes - supports both Replit Auth and client session login
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check for client session login first
      if (req.session?.userId && req.session?.isClientLogin) {
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
      return res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Client Registration (public endpoint)
  app.post('/api/auth/register', async (req, res) => {
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
        return res.status(400).json({ message: "Required fields missing: firstName, lastName, email, password, fullName" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Extract last 4 of SSN and encrypt full SSN
      const ssnLast4 = ssn ? ssn.replace(/\D/g, '').slice(-4) : null;
      const ssnEncrypted = ssn ? encrypt(ssn) : null;

      // Encrypt sensitive data
      const irsUsernameEncrypted = irsUsername ? encrypt(irsUsername) : null;
      const irsPasswordEncrypted = irsPassword ? encrypt(irsPassword) : null;
      const bankRoutingEncrypted = bankRoutingNumber ? encrypt(bankRoutingNumber) : null;
      const bankAccountEncrypted = bankAccountNumber ? encrypt(bankAccountNumber) : null;

      // Create user
      const user = await storage.upsertUser({
        id: crypto.randomUUID(),
        email,
        firstName,
        lastName,
        fullName,
        phone: phone || null,
        phoneSecondary: phoneSecondary || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        country: country || 'United States',
        role: 'client',
        isActive: true,
        passwordHash,
        birthday: birthday ? new Date(birthday) : null,
        occupation: occupation || null,
        ssnLast4,
        ssnEncrypted,
        irsUsernameEncrypted,
        irsPasswordEncrypted,
        referredById: referredById === 'none' ? null : (referredById || null),
        directDepositBank: directDepositBank || null,
        bankRoutingEncrypted,
        bankAccountEncrypted,
      });

      res.status(201).json({ 
        message: "Registration successful",
        userId: user.id 
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  // Client Login (email/password) - public endpoint
  app.post('/api/client-login', async (req: any, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user has a password hash (registered clients)
      if (!user.passwordHash) {
        return res.status(401).json({ message: "This account uses Replit login. Please use the Staff Login option." });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is deactivated. Please contact support." });
      }

      // Create session for the client
      // Store user info in session (similar to Replit Auth but for password-based login)
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.isClientLogin = true;

      res.json({ 
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      });
    } catch (error: any) {
      console.error("Client login error:", error);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  // Get referrers list for registration (public endpoint)
  app.get('/api/users/referrers', async (req, res) => {
    try {
      // Get all active users who could be referrers (staff members)
      const users = await storage.getUsers();
      const referrers = users
        .filter(u => u.role !== 'client' && u.isActive)
        .map(u => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
        }));
      res.json(referrers);
    } catch (error: any) {
      console.error("Error fetching referrers:", error);
      res.status(500).json({ message: "Failed to fetch referrers" });
    }
  });

  // Users (for staff to select clients) - requires clients.view permission
  app.get("/api/users", isAuthenticated, requirePermission('clients.view'), async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  // Get single user by ID - requires clients.view permission
  app.get("/api/users/:id", isAuthenticated, requirePermission('clients.view'), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user role (admin only)
  app.patch("/api/users/:id/role", isAuthenticated, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user.claims.sub);
      if (!adminUser || adminUser.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { role, reason } = req.body;
      if (!role || !['client', 'agent', 'tax_office', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const adminName = `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() || adminUser.email || 'Admin';
      const user = await storage.updateUserRole(req.params.id, role, req.user.claims.sub, adminName, reason);
      
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
      const adminUser = await storage.getUser(req.user.claims.sub);
      if (!adminUser || adminUser.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
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

  // Get users by role - admin only
  app.get("/api/users/role/:role", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const role = req.params.role as any;
      if (!['client', 'agent', 'tax_office', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const users = await storage.getUsersByRole(role);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Role Audit Log (admin only)
  app.get("/api/role-audit-logs", isAuthenticated, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user.claims.sub);
      if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'tax_office')) {
        return res.status(403).json({ error: "Admin or Tax Office access required" });
      }
      const logs = await storage.getRoleAuditLogs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Staff Invites (admin only)
  app.get("/api/staff-invites", isAuthenticated, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user.claims.sub);
      if (!adminUser || adminUser.role !== 'admin') {
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
      const adminUser = await storage.getUser(req.user.claims.sub);
      if (!adminUser || adminUser.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { email, role } = req.body;
      if (!email || !role || !['agent', 'tax_office', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Valid email and role required" });
      }

      const crypto = await import('crypto');
      const inviteCode = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const adminName = `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() || adminUser.email || 'Admin';
      
      const invite = await storage.createStaffInvite({
        email,
        role,
        inviteCode,
        invitedById: req.user.claims.sub,
        invitedByName: adminName,
        expiresAt,
      });
      res.status(201).json(invite);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Redeem staff invite
  app.post("/api/staff-invites/redeem", isAuthenticated, async (req: any, res) => {
    try {
      const { inviteCode } = req.body;
      if (!inviteCode) {
        return res.status(400).json({ error: "Invite code required" });
      }

      const invite = await storage.useStaffInvite(inviteCode, req.user.claims.sub);
      if (!invite) {
        return res.status(404).json({ error: "Invalid or expired invite code" });
      }
      res.json({ success: true, role: invite.role });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete staff invite (admin only)
  app.delete("/api/staff-invites/:id", isAuthenticated, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user.claims.sub);
      if (!adminUser || adminUser.role !== 'admin') {
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
  });

  // ============================================
  // PERMISSIONS MANAGEMENT
  // ============================================

  // Get all permissions
  app.get("/api/permissions", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get permissions grouped by feature
  app.get("/api/permissions/grouped", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const grouped = await storage.getPermissionsByGroup();
      res.json(grouped);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get complete permission matrix (all roles x all permissions)
  app.get("/api/permissions/matrix", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const matrix = await storage.getRolePermissionMatrix();
      res.json(matrix);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get current user's permissions
  app.get("/api/auth/permissions", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Admin has all permissions
      if (user.role === 'admin') {
        const allPermissions = await storage.getPermissions();
        return res.json({
          role: user.role,
          permissions: allPermissions.map(p => p.slug)
        });
      }
      
      const permissions = await storage.getRolePermissions(user.role);
      res.json({
        role: user.role,
        permissions
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get permissions for a specific role
  app.get("/api/roles/:role/permissions", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const role = req.params.role as any;
      if (!['client', 'agent', 'tax_office', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const permissions = await storage.getRolePermissions(role);
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update permissions for a role
  app.put("/api/roles/:role/permissions", isAuthenticated, requireAdmin(), async (req: any, res) => {
    try {
      const role = req.params.role as any;
      if (!['client', 'agent', 'tax_office', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      const { permissions } = req.body;
      if (!permissions || typeof permissions !== 'object') {
        return res.status(400).json({ error: "permissions object required" });
      }
      
      // Update permissions
      await storage.updateRolePermissions(role, permissions);
      
      // Clear cache for this role
      const { clearPermissionCache } = await import('./authorization');
      clearPermissionCache(role);
      
      // Log the change
      const adminUser = await storage.getUser(req.user.claims.sub);
      const adminName = `${adminUser?.firstName || ''} ${adminUser?.lastName || ''}`.trim() || adminUser?.email || 'Admin';
      console.log(`Permissions updated for ${role} by ${adminName}:`, permissions);
      
      // Return updated permissions
      const updated = await storage.getRolePermissions(role);
      res.json({ role, permissions: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle a single permission for a role
  app.patch("/api/roles/:role/permissions/:slug", isAuthenticated, requireAdmin(), async (req: any, res) => {
    try {
      const { role, slug } = req.params;
      if (!['client', 'agent', 'tax_office', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      const { granted } = req.body;
      if (typeof granted !== 'boolean') {
        return res.status(400).json({ error: "granted boolean required" });
      }
      
      await storage.setRolePermission(role, slug, granted);
      
      // Clear cache for this role
      const { clearPermissionCache } = await import('./authorization');
      clearPermissionCache(role);
      
      res.json({ role, permission: slug, granted });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tax Deadlines - requires deadlines permission
  app.get("/api/deadlines", isAuthenticated, requirePermission('deadlines.view'), async (req, res) => {
    const deadlines = await storage.getTaxDeadlines();
    res.json(deadlines);
  });

  app.get("/api/deadlines/year/:year", isAuthenticated, requirePermission('deadlines.view'), async (req, res) => {
    const year = parseInt(req.params.year);
    const deadlines = await storage.getTaxDeadlinesByYear(year);
    res.json(deadlines);
  });

  app.post("/api/deadlines", isAuthenticated, requirePermission('deadlines.create'), async (req, res) => {
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
  });

  app.patch("/api/deadlines/:id", isAuthenticated, requirePermission('deadlines.edit'), async (req, res) => {
    try {
      const deadline = await storage.updateTaxDeadline(req.params.id, req.body);
      if (!deadline) {
        return res.status(404).json({ error: "Deadline not found" });
      }
      res.json(deadline);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/deadlines/:id", isAuthenticated, requirePermission('deadlines.edit'), async (req, res) => {
    const success = await storage.deleteTaxDeadline(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Deadline not found" });
    }
    res.status(204).send();
  });

  // Appointments - requires appointments.view/modify permission
  app.get("/api/appointments", isAuthenticated, requirePermission('appointments.view'), async (req, res) => {
    const { clientId, start, end } = req.query;
    
    if (clientId) {
      const appointments = await storage.getAppointmentsByClient(clientId as string);
      return res.json(appointments);
    }
    
    if (start && end) {
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      const appointments = await storage.getAppointmentsByDateRange(startDate, endDate);
      return res.json(appointments);
    }
    
    const appointments = await storage.getAppointments();
    res.json(appointments);
  });

  app.post("/api/appointments", isAuthenticated, requirePermission('appointments.create'), async (req, res) => {
    try {
      const result = insertAppointmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      const appointment = await storage.createAppointment(result.data);
      res.status(201).json(appointment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/appointments/:id", isAuthenticated, requirePermission('appointments.edit'), async (req, res) => {
    try {
      const appointment = await storage.updateAppointment(req.params.id, req.body);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/appointments/:id", isAuthenticated, requirePermission('appointments.delete'), async (req, res) => {
    const success = await storage.deleteAppointment(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.status(204).send();
  });

  // Payments - requires payments.view permission (financial data)
  app.get("/api/payments", isAuthenticated, requirePermission('payments.view'), async (req, res) => {
    const { clientId } = req.query;
    
    if (clientId) {
      const payments = await storage.getPaymentsByClient(clientId as string);
      return res.json(payments);
    }
    
    const payments = await storage.getPayments();
    res.json(payments);
  });

  app.post("/api/payments", isAuthenticated, requirePermission('payments.create'), async (req, res) => {
    try {
      const result = insertPaymentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      const payment = await storage.createPayment(result.data);
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/payments/:id", isAuthenticated, requirePermission('payments.edit'), async (req, res) => {
    try {
      const payment = await storage.updatePayment(req.params.id, req.body);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/payments/:id", isAuthenticated, requirePermission('payments.delete'), async (req, res) => {
    const success = await storage.deletePayment(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.status(204).send();
  });

  // Tasks - Pull from Perfex CRM tbltasks table - requires tasks.view permission
  app.get("/api/tasks", isAuthenticated, requirePermission('tasks.view'), async (req, res) => {
    try {
      const tasks = await queryPerfex(`
        SELECT 
          t.id,
          t.name as title,
          t.description,
          t.rel_id as clientId,
          c.company as clientName,
          ta.staffid as assignedToId,
          CONCAT(s.firstname, ' ', s.lastname) as assignedTo,
          t.duedate as dueDate,
          CASE 
            WHEN t.priority = 1 THEN 'low'
            WHEN t.priority = 2 THEN 'medium'
            WHEN t.priority = 3 THEN 'high'
            ELSE 'medium'
          END as priority,
          CASE 
            WHEN t.status = 1 THEN 'todo'
            WHEN t.status = 2 THEN 'in-progress'
            WHEN t.status = 3 THEN 'in-progress'
            WHEN t.status = 4 THEN 'in-progress'
            WHEN t.status = 5 THEN 'done'
            ELSE 'todo'
          END as status,
          t.dateadded as createdAt
        FROM tbltasks t
        LEFT JOIN tbltask_assigned ta ON t.id = ta.taskid
        LEFT JOIN tblstaff s ON ta.staffid = s.staffid
        LEFT JOIN tblclients c ON t.rel_id = c.userid AND t.rel_type = 'customer'
        ORDER BY t.dateadded DESC
        LIMIT 100
      `);
      res.json(tasks);
    } catch (error: any) {
      console.error('Error fetching Perfex tasks:', error);
      res.json([]);
    }
  });

  // Note: Tasks are read from Perfex CRM - create/update/delete not supported yet
  app.post("/api/tasks", async (req, res) => {
    res.status(501).json({ 
      error: "Task creation is managed through Perfex CRM. Please create tasks in Perfex." 
    });
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    res.status(501).json({ 
      error: "Task updates are managed through Perfex CRM. Please update tasks in Perfex." 
    });
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    res.status(501).json({ 
      error: "Task deletion is managed through Perfex CRM. Please delete tasks in Perfex." 
    });
  });

  // Leads - Pull from Perfex CRM tblleads table - requires leads.view permission
  app.get("/api/leads", isAuthenticated, requirePermission('leads.view'), async (req, res) => {
    try {
      const leads = await queryPerfex(`
        SELECT 
          l.id,
          l.name,
          l.email,
          l.phonenumber as phone,
          l.company,
          l.city,
          l.state,
          l.country,
          l.source as sourceId,
          COALESCE(ls.name, 'Unknown') as source,
          l.status as statusId,
          COALESCE(lst.name, 'New') as stage,
          CONCAT(s.firstname, ' ', s.lastname) as assignedTo,
          l.dateadded as created,
          l.lastcontact as lastContact
        FROM tblleads l
        LEFT JOIN tblleads_sources ls ON l.source = ls.id
        LEFT JOIN tblleads_status lst ON l.status = lst.id
        LEFT JOIN tblstaff s ON l.assigned = s.staffid
        ORDER BY l.dateadded DESC
        LIMIT 100
      `);
      res.json(leads);
    } catch (error: any) {
      console.error('Error fetching Perfex leads:', error);
      res.json([]);
    }
  });

  // Staff Members - Pull from Perfex CRM tblstaff table - requires settings permission
  app.get("/api/staff", isAuthenticated, requirePermission('settings.view'), async (req, res) => {
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
      console.error('Error fetching Perfex staff:', error);
      res.json([]);
    }
  });

  app.get("/api/staff/:id", isAuthenticated, requirePermission('settings.view'), async (req, res) => {
    try {
      const [member] = await queryPerfex(`
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
      `, [req.params.id]);
      
      if (!member) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      res.json(member);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/staff", isAuthenticated, requirePermission('settings.edit'), async (req, res) => {
    try {
      const member = await storage.createStaffMember(req.body);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/staff/:id", isAuthenticated, requirePermission('settings.edit'), async (req, res) => {
    try {
      const member = await storage.updateStaffMember(req.params.id, req.body);
      if (!member) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      res.json(member);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/staff/:id", isAuthenticated, requirePermission('settings.edit'), async (req, res) => {
    const success = await storage.deleteStaffMember(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    res.status(204).send();
  });

  // Document Versions - requires documents permission
  // Note: /all route must come before /:clientId to avoid matching "all" as a clientId
  app.get("/api/documents/all", isAuthenticated, requirePermission('documents.view'), async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/documents/:clientId", isAuthenticated, requirePermission('documents.view'), async (req, res) => {
    const { documentType } = req.query;
    
    if (documentType) {
      const documents = await storage.getDocumentVersionsByType(
        req.params.clientId,
        documentType as string
      );
      return res.json(documents);
    }
    
    const documents = await storage.getDocumentVersions(req.params.clientId);
    res.json(documents);
  });

  app.post("/api/documents", isAuthenticated, requirePermission('documents.upload'), async (req, res) => {
    try {
      const result = insertDocumentVersionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      const document = await storage.createDocumentVersion(result.data);
      res.status(201).json(document);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, requirePermission('documents.delete'), async (req, res) => {
    const success = await storage.deleteDocumentVersion(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.status(204).send();
  });

  // E-Signatures - requires signatures permission
  app.get("/api/signatures", isAuthenticated, requirePermission('signatures.view'), async (req, res) => {
    const { clientId } = req.query;
    
    if (clientId) {
      const signatures = await storage.getESignaturesByClient(clientId as string);
      return res.json(signatures);
    }
    
    const signatures = await storage.getESignatures();
    res.json(signatures);
  });

  app.get("/api/signatures/:id", isAuthenticated, async (req, res) => {
    const signature = await storage.getESignature(req.params.id);
    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }
    res.json(signature);
  });

  app.post("/api/signatures", isAuthenticated, requirePermission('signatures.create'), async (req, res) => {
    try {
      const result = insertESignatureSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      const signature = await storage.createESignature(result.data);
      res.status(201).json(signature);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/signatures/:id", isAuthenticated, async (req, res) => {
    try {
      // Capture real client IP address from request
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || "unknown";
      
      // Merge IP address with request body for audit trail
      const updateData = {
        ...req.body,
        ipAddress,
      };
      
      const signature = await storage.updateESignature(req.params.id, updateData);
      if (!signature) {
        return res.status(404).json({ error: "Signature not found" });
      }
      res.json(signature);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/signatures/:id", isAuthenticated, requirePermission('signatures.create'), async (req, res) => {
    const success = await storage.deleteESignature(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Signature not found" });
    }
    res.status(204).send();
  });

  // Generate filled IRS Form 8879 PDF - requires signatures.download_pdf permission
  app.get("/api/signatures/:id/pdf", isAuthenticated, requirePermission('signatures.download_pdf'), async (req, res) => {
    try {
      const signature = await storage.getESignature(req.params.id);
      if (!signature) {
        return res.status(404).json({ error: "Signature not found" });
      }

      if (signature.status !== 'signed') {
        return res.status(400).json({ error: "Document has not been signed yet" });
      }

      // Parse formData
      const formData: Form8879Data = typeof signature.formData === 'string'
        ? JSON.parse(signature.formData)
        : signature.formData as Form8879Data;

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
      const pdfDoc = await PDFDocument.load(irsFormBytes, { ignoreEncryption: true });
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
      const fieldNames = fields.map(f => f.getName());
      console.log("Available form fields:", fieldNames);

      // Helper to safely set text field value
      const setTextField = (fieldName: string, value: string | undefined | null) => {
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
      setTextField('f1_01', formData.taxYear);
      setTextField('topmostSubform[0].Page1[0].f1_01[0]', formData.taxYear);
      
      // Taxpayer name field
      setTextField('f1_02', formData.taxpayerName);
      setTextField('topmostSubform[0].Page1[0].f1_02[0]', formData.taxpayerName);
      
      // Taxpayer SSN
      setTextField('f1_03', formData.taxpayerSSN);
      setTextField('topmostSubform[0].Page1[0].f1_03[0]', formData.taxpayerSSN);
      
      // Spouse name
      if (formData.spouseName) {
        setTextField('f1_04', formData.spouseName);
        setTextField('topmostSubform[0].Page1[0].f1_04[0]', formData.spouseName);
      }
      
      // Spouse SSN
      if (formData.spouseSSN) {
        setTextField('f1_05', formData.spouseSSN);
        setTextField('topmostSubform[0].Page1[0].f1_05[0]', formData.spouseSSN);
      }

      // Part I - Tax Return Information (Lines 1-5)
      // Line 1: AGI
      if (formData.agi) {
        const agiValue = Number(formData.agi).toLocaleString();
        setTextField('f1_06', agiValue) || setTextField('f1_07', agiValue);
      }
      
      // Line 2: Total Tax
      if (formData.totalTax) {
        const taxValue = Number(formData.totalTax).toLocaleString();
        setTextField('f1_08', taxValue) || setTextField('f1_09', taxValue);
      }
      
      // Line 3: Federal withheld
      if (formData.federalWithheld) {
        const withheldValue = Number(formData.federalWithheld).toLocaleString();
        setTextField('f1_10', withheldValue);
      }
      
      // Line 4: Refund amount
      if (formData.federalRefund) {
        const refundValue = Number(formData.federalRefund).toLocaleString();
        setTextField('f1_11', refundValue) || setTextField('f1_12', refundValue);
      }
      
      // Line 5: Amount owed
      if (formData.amountOwed) {
        const owedValue = Number(formData.amountOwed).toLocaleString();
        setTextField('f1_13', owedValue);
      }

      // Part II - ERO firm name and PIN authorization
      if (formData.eroFirmName) {
        setTextField('f1_14', formData.eroFirmName);
        setTextField('f1_15', formData.eroFirmName);
      }
      
      // Taxpayer PIN
      if (formData.taxpayerPin) {
        setTextField('f1_16', formData.taxpayerPin);
        setTextField('f1_17', formData.taxpayerPin);
      }
      
      // Spouse PIN
      if (formData.spousePin) {
        setTextField('f1_18', formData.spousePin);
        setTextField('f1_19', formData.spousePin);
      }

      // Part III - ERO EFIN/PIN
      if (formData.eroPin) {
        setTextField('f1_20', formData.eroPin);
        setTextField('f1_21', formData.eroPin);
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
          firstPage.drawText(formData.taxYear, { x: 298, y: 722, size: smallFontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Taxpayer name - left side of name/SSN row (y~665)
        if (formData.taxpayerName) {
          firstPage.drawText(formData.taxpayerName, { x: 120, y: 665, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Taxpayer SSN - right side (x~485)
        if (formData.taxpayerSSN) {
          firstPage.drawText(formData.taxpayerSSN, { x: 485, y: 665, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Spouse name (y~647)
        if (formData.spouseName) {
          firstPage.drawText(formData.spouseName, { x: 120, y: 647, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Spouse SSN
        if (formData.spouseSSN) {
          firstPage.drawText(formData.spouseSSN, { x: 485, y: 647, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Part I - Tax Return Information - dollar amounts right-aligned around x=555
        // Line 1: AGI (y~562)
        if (formData.agi) {
          firstPage.drawText(Number(formData.agi).toLocaleString(), { x: 540, y: 562, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Line 2: Total Tax (y~544)
        if (formData.totalTax) {
          firstPage.drawText(Number(formData.totalTax).toLocaleString(), { x: 540, y: 544, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Line 3: Federal withheld (y~526)
        if (formData.federalWithheld) {
          firstPage.drawText(Number(formData.federalWithheld).toLocaleString(), { x: 540, y: 526, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Line 4: Refund amount (y~508)
        if (formData.federalRefund) {
          firstPage.drawText(Number(formData.federalRefund).toLocaleString(), { x: 540, y: 508, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Line 5: Amount owed (y~490)
        if (formData.amountOwed) {
          firstPage.drawText(Number(formData.amountOwed).toLocaleString(), { x: 540, y: 490, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Part II - ERO firm name in authorization line (y~390)
        if (formData.eroFirmName) {
          firstPage.drawText(formData.eroFirmName, { x: 140, y: 390, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Taxpayer PIN - 5 digits in PIN box (y~390, x~465)
        if (formData.taxpayerPin) {
          firstPage.drawText(formData.taxpayerPin, { x: 465, y: 390, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Spouse authorization with ERO firm name (y~310)
        if (formData.spouseName && formData.eroFirmName) {
          firstPage.drawText(formData.eroFirmName, { x: 140, y: 310, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Spouse PIN (y~310, x~465)
        if (formData.spousePin) {
          firstPage.drawText(formData.spousePin, { x: 465, y: 310, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        
        // Part III - ERO EFIN/PIN (y~195)
        if (formData.eroPin) {
          firstPage.drawText(formData.eroPin, { x: 400, y: 195, size: fontSize, font, color: rgb(0, 0, 0) });
        }
      } else {
        // Flatten form fields so they appear as regular text
        form.flatten();
      }
      
      // Add taxpayer signature image
      if (signature.signatureData) {
        try {
          const base64Data = signature.signatureData.replace(/^data:image\/\w+;base64,/, '');
          const signatureImageBytes = Buffer.from(base64Data, 'base64');
          const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
          
          const maxWidth = 150;
          const maxHeight = 30;
          const scaleFactor = Math.min(maxWidth / signatureImage.width, maxHeight / signatureImage.height);
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
        const dateStr = signedDate.toLocaleDateString('en-US', { 
          month: '2-digit', 
          day: '2-digit', 
          year: 'numeric' 
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
        const dateStr = signedDate.toLocaleDateString('en-US', { 
          month: '2-digit', 
          day: '2-digit', 
          year: 'numeric' 
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
        auditParts.push(`Signed: ${new Date(signature.signedAt).toISOString()}`);
      }
      auditParts.push(`ID: ${signature.id}`);
      
      firstPage.drawText(auditParts.join(' | '), {
        x: 72,
        y: auditY,
        size: auditFontSize,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();

      // Send the PDF
      const clientName = formData.taxpayerName?.replace(/[^a-zA-Z0-9]/g, '_') || 'client';
      const filename = `Form_8879_${clientName}_${formData.taxYear || 'signed'}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(pdfBytes));
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: error.message });
    }
  });

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
      const template = await storage.updateDocumentRequestTemplate(req.params.id, req.body);
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

  // Object Storage - File Upload
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const { clientId, fileName, fileType, fileSize } = req.body;
      
      if (!clientId || !fileName) {
        return res.status(400).json({ error: "clientId and fileName are required" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL(clientId, fileName);
      
      res.json({ uploadURL, objectPath });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Save document metadata after upload
  app.post("/api/objects/confirm", async (req, res) => {
    try {
      const { clientId, objectPath, fileName, fileType, fileSize, category } = req.body;
      
      if (!clientId || !objectPath || !fileName) {
        return res.status(400).json({ error: "clientId, objectPath, and fileName are required" });
      }
      
      // Determine document type from category or file extension
      let documentType = category || "Other";
      if (!category) {
        const lowerName = fileName.toLowerCase();
        if (lowerName.includes('w2') || lowerName.includes('w-2')) {
          documentType = "W-2";
        } else if (lowerName.includes('1099')) {
          documentType = "1099";
        } else if (lowerName.includes('id') || lowerName.includes('license') || lowerName.includes('passport')) {
          documentType = "ID";
        }
      }
      
      // Get latest version number for this client/document type
      const existingDocs = await storage.getDocumentVersionsByType(clientId, documentType);
      const newVersion = existingDocs.length + 1;
      
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

  // Serve uploaded files
  app.get("/objects/*", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ PERFEX CRM MIGRATION ROUTES ============
  // All admin routes require admin role

  // Test Perfex CRM database connection
  app.get("/api/admin/perfex/test", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const connected = await testPerfexConnection();
      if (connected) {
        const tables = await getPerfexTables();
        res.json({ success: true, message: "Perfex CRM database connected!", tables });
      } else {
        res.status(500).json({ success: false, message: "Failed to connect to Perfex CRM database" });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Describe a Perfex CRM table schema
  app.get("/api/admin/perfex/describe/:table", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const schema = await describePerfexTable(req.params.table);
      res.json(schema);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get Perfex clients count
  app.get("/api/admin/perfex/clients/count", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const result = await queryPerfex("SELECT COUNT(*) as count FROM tblclients");
      res.json({ count: result[0]?.count || 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Preview Perfex clients (first 20)
  app.get("/api/admin/perfex/clients/preview", isAuthenticated, requireAdmin(), async (req, res) => {
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
  });

  // Get Perfex contacts for a client
  app.get("/api/admin/perfex/contacts", isAuthenticated, requireAdmin(), async (req, res) => {
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
  });

  // Get Perfex files count
  app.get("/api/admin/perfex/files/count", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const result = await queryPerfex("SELECT COUNT(*) as count FROM tblfiles WHERE rel_type = 'customer'");
      res.json({ count: result[0]?.count || 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete all WordPress signups from users table
  app.delete("/api/admin/clear-wordpress-clients", isAuthenticated, requireAdmin(), async (req, res) => {
    try {
      const [result] = await mysqlPool.query("DELETE FROM users WHERE original_submission_id IS NOT NULL");
      const affected = (result as any).affectedRows || 0;
      res.json({ success: true, message: `Deleted ${affected} WordPress signup clients` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Migrate Perfex clients to CRM
  app.post("/api/admin/migrate-perfex-clients", isAuthenticated, requireAdmin(), async (req, res) => {
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
          const firstName = client.firstname || client.company?.split(' ')[0] || 'Unknown';
          const lastName = client.lastname || client.company?.split(' ').slice(1).join(' ') || '';
          const email = client.email || null;
          const phone = client.contact_phone || client.company_phone || null;

          await mysqlPool.query(`
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
          `, [
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
            client.active === 1 ? 'Active Client' : 'Inactive',
            `Company: ${client.company || 'N/A'} | Perfex ID: ${client.userid}`,
            client.datecreated || new Date()
          ]);

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
        errors: errors.slice(0, 10)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Migrate Perfex files/documents
  app.post("/api/admin/migrate-perfex-documents", isAuthenticated, requireAdmin(), async (req, res) => {
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
          let documentType = 'Other';
          const lowerName = (file.file_name || '').toLowerCase();
          if (lowerName.includes('w2') || lowerName.includes('w-2')) {
            documentType = 'W-2';
          } else if (lowerName.includes('1099')) {
            documentType = '1099';
          } else if (lowerName.includes('id') || lowerName.includes('license') || lowerName.includes('passport')) {
            documentType = 'ID';
          } else if (lowerName.includes('tax') || lowerName.includes('return')) {
            documentType = 'Tax Return';
          }

          // File URL points to Perfex uploads folder structure
          const fileUrl = `/perfex-uploads/uploads/customers/${file.rel_id}/${file.file_name}`;

          await mysqlPool.query(`
            INSERT INTO document_versions (id, client_id, document_name, document_type, file_url, version, uploaded_by, notes, uploaded_at)
            VALUES (UUID(), ?, ?, ?, ?, 1, 'perfex-import', ?, ?)
          `, [
            clientId,
            file.file_name,
            documentType,
            fileUrl,
            'Imported from Perfex CRM',
            file.dateadded || new Date()
          ]);

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
        errors: errors.slice(0, 10)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
