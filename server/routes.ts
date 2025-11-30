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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Authentication
  await setupAuth(app);

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

  // Document Versions
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

  const httpServer = createServer(app);
  return httpServer;
}
