import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertTaxDeadlineSchema,
  insertAppointmentSchema,
  insertPaymentSchema,
  insertDocumentVersionSchema,
  insertESignatureSchema,
  insertEmailLogSchema,
  insertDocumentRequestTemplateSchema
} from "@shared/mysql-schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { testPerfexConnection, getPerfexTables, queryPerfex, describePerfexTable } from "./perfex-db";
import { mysqlPool, runMySQLMigrations } from "./mysql-db";

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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Users (for staff to select clients)
  app.get("/api/users", async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  // Get single user by ID
  app.get("/api/users/:id", async (req, res) => {
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

  // Tax Deadlines
  app.get("/api/deadlines", async (req, res) => {
    const deadlines = await storage.getTaxDeadlines();
    res.json(deadlines);
  });

  app.get("/api/deadlines/year/:year", async (req, res) => {
    const year = parseInt(req.params.year);
    const deadlines = await storage.getTaxDeadlinesByYear(year);
    res.json(deadlines);
  });

  app.post("/api/deadlines", async (req, res) => {
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

  app.patch("/api/deadlines/:id", async (req, res) => {
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

  app.delete("/api/deadlines/:id", async (req, res) => {
    const success = await storage.deleteTaxDeadline(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Deadline not found" });
    }
    res.status(204).send();
  });

  // Appointments
  app.get("/api/appointments", async (req, res) => {
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

  app.post("/api/appointments", async (req, res) => {
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

  app.patch("/api/appointments/:id", async (req, res) => {
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

  app.delete("/api/appointments/:id", async (req, res) => {
    const success = await storage.deleteAppointment(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.status(204).send();
  });

  // Payments
  app.get("/api/payments", async (req, res) => {
    const { clientId } = req.query;
    
    if (clientId) {
      const payments = await storage.getPaymentsByClient(clientId as string);
      return res.json(payments);
    }
    
    const payments = await storage.getPayments();
    res.json(payments);
  });

  app.post("/api/payments", async (req, res) => {
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

  app.patch("/api/payments/:id", async (req, res) => {
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

  app.delete("/api/payments/:id", async (req, res) => {
    const success = await storage.deletePayment(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.status(204).send();
  });

  // Tasks - Pull from Perfex CRM tbltasks table
  app.get("/api/tasks", async (req, res) => {
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

  // Leads - Pull from Perfex CRM tblleads table
  app.get("/api/leads", async (req, res) => {
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

  // Staff Members - Pull from Perfex CRM tblstaff table
  app.get("/api/staff", async (req, res) => {
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

  app.get("/api/staff/:id", async (req, res) => {
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

  app.post("/api/staff", async (req, res) => {
    try {
      const member = await storage.createStaffMember(req.body);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/staff/:id", async (req, res) => {
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

  app.delete("/api/staff/:id", async (req, res) => {
    const success = await storage.deleteStaffMember(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    res.status(204).send();
  });

  // Document Versions
  // Note: /all route must come before /:clientId to avoid matching "all" as a clientId
  app.get("/api/documents/all", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/documents/:clientId", async (req, res) => {
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

  app.post("/api/documents", async (req, res) => {
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

  app.delete("/api/documents/:id", async (req, res) => {
    const success = await storage.deleteDocumentVersion(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.status(204).send();
  });

  // E-Signatures
  app.get("/api/signatures", async (req, res) => {
    const { clientId } = req.query;
    
    if (clientId) {
      const signatures = await storage.getESignaturesByClient(clientId as string);
      return res.json(signatures);
    }
    
    const signatures = await storage.getESignatures();
    res.json(signatures);
  });

  app.get("/api/signatures/:id", async (req, res) => {
    const signature = await storage.getESignature(req.params.id);
    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }
    res.json(signature);
  });

  app.post("/api/signatures", async (req, res) => {
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

  app.patch("/api/signatures/:id", async (req, res) => {
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

  app.delete("/api/signatures/:id", async (req, res) => {
    const success = await storage.deleteESignature(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Signature not found" });
    }
    res.status(204).send();
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

  // Test Perfex CRM database connection
  app.get("/api/admin/perfex/test", async (req, res) => {
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
  app.get("/api/admin/perfex/describe/:table", async (req, res) => {
    try {
      const schema = await describePerfexTable(req.params.table);
      res.json(schema);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get Perfex clients count
  app.get("/api/admin/perfex/clients/count", async (req, res) => {
    try {
      const result = await queryPerfex("SELECT COUNT(*) as count FROM tblclients");
      res.json({ count: result[0]?.count || 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Preview Perfex clients (first 20)
  app.get("/api/admin/perfex/clients/preview", async (req, res) => {
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
  app.get("/api/admin/perfex/contacts", async (req, res) => {
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
  app.get("/api/admin/perfex/files/count", async (req, res) => {
    try {
      const result = await queryPerfex("SELECT COUNT(*) as count FROM tblfiles WHERE rel_type = 'customer'");
      res.json({ count: result[0]?.count || 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete all WordPress signups from users table
  app.delete("/api/admin/clear-wordpress-clients", async (req, res) => {
    try {
      const [result] = await mysqlPool.query("DELETE FROM users WHERE original_submission_id IS NOT NULL");
      const affected = (result as any).affectedRows || 0;
      res.json({ success: true, message: `Deleted ${affected} WordPress signup clients` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Migrate Perfex clients to CRM
  app.post("/api/admin/migrate-perfex-clients", async (req, res) => {
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
  app.post("/api/admin/migrate-perfex-documents", async (req, res) => {
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
