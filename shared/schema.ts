import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Appointments Table
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  clientName: text("client_name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").default(60), // minutes
  status: text("status").default("scheduled"), // 'scheduled', 'completed', 'cancelled', 'no-show'
  location: text("location"),
  staffId: varchar("staff_id"),
  staffName: text("staff_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Payments Table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  clientName: text("client_name").notNull(),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default('0.00'),
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'partial', 'paid', 'overdue'
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  paymentMethod: text("payment_method"), // 'cash', 'check', 'credit_card', 'bank_transfer'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Document Versions Table
export const documentVersions = pgTable("document_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  documentName: text("document_name").notNull(),
  documentType: text("document_type").notNull(), // 'w2', '1099', 'id', 'other'
  fileUrl: text("file_url").notNull(),
  version: integer("version").default(1),
  uploadedBy: text("uploaded_by").notNull(), // 'client' or staff name
  fileSize: integer("file_size"), // bytes
  mimeType: text("mime_type"),
  notes: text("notes"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  uploadedAt: true,
});

export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
export type DocumentVersion = typeof documentVersions.$inferSelect;

// E-Signatures Table
export const eSignatures = pgTable("e_signatures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  clientName: text("client_name").notNull(),
  documentName: text("document_name").notNull(),
  documentType: text("document_type").default("form_8879"), // 'form_8879', 'engagement_letter', 'other'
  signatureData: text("signature_data"), // Base64 encoded signature
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  signedAt: timestamp("signed_at"),
  status: text("status").default("pending"), // 'pending', 'signed', 'declined'
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertESignatureSchema = createInsertSchema(eSignatures).omit({
  id: true,
  createdAt: true,
});

export type InsertESignature = z.infer<typeof insertESignatureSchema>;
export type ESignature = typeof eSignatures.$inferSelect;

// Email Logs Table
export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id"),
  toEmail: text("to_email").notNull(),
  fromEmail: text("from_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  emailType: text("email_type"), // 'status_update', 'document_request', 'appointment_reminder', 'general'
  status: text("status").default("sent"), // 'sent', 'failed', 'pending'
  sentAt: timestamp("sent_at").defaultNow(),
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  sentAt: true,
});

export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;

// Document Request Templates Table
export const documentRequestTemplates = pgTable("document_request_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  documentTypes: text("document_types").array(), // ['w2', '1099', 'id']
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDocumentRequestTemplateSchema = createInsertSchema(documentRequestTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertDocumentRequestTemplate = z.infer<typeof insertDocumentRequestTemplateSchema>;
export type DocumentRequestTemplate = typeof documentRequestTemplates.$inferSelect;

// Tasks Table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  clientId: varchar("client_id"),
  clientName: text("client_name"),
  assignedToId: varchar("assigned_to_id"),
  assignedTo: text("assigned_to").notNull(),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("medium"), // 'low', 'medium', 'high'
  status: text("status").default("todo"), // 'todo', 'in-progress', 'done'
  category: text("category"), // 'document_review', 'client_followup', 'filing', 'other'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Staff Members Table (extends users for internal staff)
export const staffMembers = pgTable("staff_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  name: text("name").notNull(),
  email: varchar("email"),
  role: text("role").default("Tax Preparer"), // 'Admin', 'Senior Tax Preparer', 'Tax Preparer', 'Junior Tax Preparer'
  department: text("department"),
  isActive: boolean("is_active").default(true),
  hireDate: timestamp("hire_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffMemberSchema = createInsertSchema(staffMembers).omit({
  id: true,
  createdAt: true,
});

export type InsertStaffMember = z.infer<typeof insertStaffMemberSchema>;
export type StaffMember = typeof staffMembers.$inferSelect;
