import { sql } from "drizzle-orm";
import { mysqlTable, text, varchar, timestamp, int, boolean, decimal, json, index } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// User Roles - defines access levels in the system
export type UserRole = 'client' | 'agent' | 'tax_office' | 'admin';

// User storage table for Replit Auth + Client Data
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
  clientType: varchar("client_type", { length: 50 }),
  notes: text("notes"),
  originalSubmissionId: int("original_submission_id"),
  referralSource: text("referral_source"),
  role: varchar("role", { length: 20 }).default("client").$type<UserRole>(),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
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

// Tax Deadlines Table
export const taxDeadlines = mysqlTable("tax_deadlines", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  title: text("title").notNull(),
  description: text("description"),
  deadlineDate: timestamp("deadline_date").notNull(),
  deadlineType: varchar("deadline_type", { length: 50 }).notNull(),
  taxYear: int("tax_year").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  notifyDaysBefore: int("notify_days_before").default(7),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaxDeadlineSchema = createInsertSchema(taxDeadlines).omit({
  id: true,
  createdAt: true,
});

export type InsertTaxDeadline = z.infer<typeof insertTaxDeadlineSchema>;
export type TaxDeadline = typeof taxDeadlines.$inferSelect;

// Appointments Table
export const appointments = mysqlTable("appointments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  clientId: varchar("client_id", { length: 36 }).notNull(),
  clientName: text("client_name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: int("duration").default(60),
  status: varchar("status", { length: 50 }).default("scheduled"),
  location: text("location"),
  staffId: varchar("staff_id", { length: 36 }),
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
export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  clientId: varchar("client_id", { length: 36 }).notNull(),
  clientName: text("client_name").notNull(),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default('0.00'),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  paymentMethod: varchar("payment_method", { length: 50 }),
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
export const documentVersions = mysqlTable("document_versions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  clientId: varchar("client_id", { length: 36 }).notNull(),
  documentName: text("document_name").notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  fileUrl: text("file_url").notNull(),
  version: int("version").default(1),
  uploadedBy: text("uploaded_by").notNull(),
  fileSize: int("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  notes: text("notes"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  uploadedAt: true,
});

export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
export type DocumentVersion = typeof documentVersions.$inferSelect;

// Form 8879 Data Type
export interface Form8879Data {
  taxYear?: string;
  taxpayerName?: string;
  taxpayerSSN?: string;
  spouseName?: string;
  spouseSSN?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  agi?: string;
  totalTax?: string;
  federalRefund?: string;
  amountOwed?: string;
  eroPin?: string;
  taxpayerPin?: string;
  spousePin?: string;
  practitionerPin?: string;
  dateOfBirth?: string;
  priorYearAgi?: string;
  identityProtectionPin?: string;
}

// E-Signatures Table
export const eSignatures = mysqlTable("e_signatures", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  clientId: varchar("client_id", { length: 36 }).notNull(),
  clientName: text("client_name").notNull(),
  documentName: text("document_name").notNull(),
  documentType: varchar("document_type", { length: 50 }).default("form_8879"),
  signatureData: text("signature_data"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  signedAt: timestamp("signed_at"),
  status: varchar("status", { length: 50 }).default("pending"),
  documentUrl: text("document_url"),
  formData: json("form_data").$type<Form8879Data>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertESignatureSchema = createInsertSchema(eSignatures).omit({
  id: true,
  createdAt: true,
});

export type InsertESignature = z.infer<typeof insertESignatureSchema>;
export type ESignature = typeof eSignatures.$inferSelect;

// Email Logs Table
export const emailLogs = mysqlTable("email_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  clientId: varchar("client_id", { length: 36 }),
  toEmail: varchar("to_email", { length: 255 }).notNull(),
  fromEmail: varchar("from_email", { length: 255 }).notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  emailType: varchar("email_type", { length: 50 }),
  status: varchar("status", { length: 50 }).default("sent"),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  sentAt: true,
});

export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;

// Document Request Templates Table
export const documentRequestTemplates = mysqlTable("document_request_templates", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  documentTypes: json("document_types").$type<string[]>(),
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
export const tasks = mysqlTable("tasks", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  title: text("title").notNull(),
  description: text("description"),
  clientId: varchar("client_id", { length: 36 }),
  clientName: text("client_name"),
  assignedToId: varchar("assigned_to_id", { length: 36 }),
  assignedTo: text("assigned_to").notNull(),
  dueDate: timestamp("due_date"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  status: varchar("status", { length: 20 }).default("todo"),
  category: varchar("category", { length: 50 }),
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

// Staff Members Table
export const staffMembers = mysqlTable("staff_members", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }),
  role: varchar("role", { length: 100 }).default("Tax Preparer"),
  department: varchar("department", { length: 100 }),
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

// Role Audit Log - tracks role changes for compliance
export const roleAuditLog = mysqlTable("role_audit_log", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).notNull(),
  userName: text("user_name"),
  previousRole: varchar("previous_role", { length: 20 }),
  newRole: varchar("new_role", { length: 20 }).notNull(),
  changedById: varchar("changed_by_id", { length: 36 }).notNull(),
  changedByName: text("changed_by_name"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoleAuditLogSchema = createInsertSchema(roleAuditLog).omit({
  id: true,
  createdAt: true,
});

export type InsertRoleAuditLog = z.infer<typeof insertRoleAuditLogSchema>;
export type RoleAuditLog = typeof roleAuditLog.$inferSelect;

// Staff Invites - for inviting new staff members
export const staffInvites = mysqlTable("staff_invites", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().$type<UserRole>(),
  inviteCode: varchar("invite_code", { length: 64 }).notNull().unique(),
  invitedById: varchar("invited_by_id", { length: 36 }).notNull(),
  invitedByName: text("invited_by_name"),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  usedById: varchar("used_by_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffInviteSchema = createInsertSchema(staffInvites).omit({
  id: true,
  createdAt: true,
  usedAt: true,
  usedById: true,
});

export type InsertStaffInvite = z.infer<typeof insertStaffInviteSchema>;
export type StaffInvite = typeof staffInvites.$inferSelect;
