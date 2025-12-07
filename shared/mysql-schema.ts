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
// Note: Schema matches actual MySQL database columns from Perfex CRM migration
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
  country: varchar("country", { length: 100 }).default("United States"),
  role: varchar("role", { length: 20 }).default("client").$type<UserRole>(),
  isActive: boolean("is_active").default(true),
  passwordHash: varchar("password_hash", { length: 255 }),
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
  federalWithheld?: string;
  amountOwed?: string;
  eroPin?: string;
  taxpayerPin?: string;
  spousePin?: string;
  practitionerPin?: string;
  dateOfBirth?: string;
  priorYearAgi?: string;
  identityProtectionPin?: string;
  eroFirmName?: string;
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

// Filing Status Type - tracks the lifecycle of a tax filing
export type FilingStatus = 'new' | 'documents_pending' | 'review' | 'filed' | 'accepted' | 'approved' | 'paid';

// Tax Filings Table - tracks each client's tax filing per year
export const taxFilings = mysqlTable(
  "tax_filings",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    clientId: varchar("client_id", { length: 36 }).notNull(),
    taxYear: int("tax_year").notNull(),
    status: varchar("status", { length: 30 }).default("new").$type<FilingStatus>(),
    
    // Key dates in the filing lifecycle
    createdAt: timestamp("created_at").defaultNow(),
    documentsReceivedAt: timestamp("documents_received_at"),
    submittedAt: timestamp("submitted_at"),
    acceptedAt: timestamp("accepted_at"),
    approvedAt: timestamp("approved_at"),
    fundedAt: timestamp("funded_at"),
    
    // Financial details
    estimatedRefund: decimal("estimated_refund", { precision: 10, scale: 2 }),
    actualRefund: decimal("actual_refund", { precision: 10, scale: 2 }),
    serviceFee: decimal("service_fee", { precision: 10, scale: 2 }),
    feePaid: boolean("fee_paid").default(false),
    
    // Assignment
    preparerId: varchar("preparer_id", { length: 36 }),
    preparerName: text("preparer_name"),
    officeLocation: varchar("office_location", { length: 100 }),
    
    // Filing details
    filingType: varchar("filing_type", { length: 50 }).default("individual"),
    federalStatus: varchar("federal_status", { length: 50 }),
    stateStatus: varchar("state_status", { length: 50 }),
    statesFiled: json("states_filed").$type<string[]>(),
    
    // Notes and tracking
    notes: text("notes"),
    statusHistory: json("status_history").$type<Array<{status: string; date: string; note?: string}>>(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    clientYearIdx: index("filing_client_year_idx").on(table.clientId, table.taxYear),
    statusIdx: index("filing_status_idx").on(table.status),
    yearIdx: index("filing_year_idx").on(table.taxYear),
    preparerIdx: index("filing_preparer_idx").on(table.preparerId),
  }),
);

export const insertTaxFilingSchema = createInsertSchema(taxFilings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTaxFiling = z.infer<typeof insertTaxFilingSchema>;
export type TaxFiling = typeof taxFilings.$inferSelect;

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

// Permissions - defines all available system permissions
export const permissions = mysqlTable("permissions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  featureGroup: varchar("feature_group", { length: 100 }).notNull(),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

// Role Permissions - maps which permissions each role has
export const rolePermissions = mysqlTable(
  "role_permissions",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    role: varchar("role", { length: 20 }).notNull().$type<UserRole>(),
    permissionId: varchar("permission_id", { length: 36 }).notNull(),
    granted: boolean("granted").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    roleIdx: index("role_permission_role_idx").on(table.role),
    permissionIdx: index("role_permission_permission_idx").on(table.permissionId),
  }),
);

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

// Permission Groups for UI organization
export const PermissionGroups = {
  DASHBOARD: 'dashboard',
  CLIENTS: 'clients',
  LEADS: 'leads',
  DOCUMENTS: 'documents',
  PAYMENTS: 'payments',
  APPOINTMENTS: 'appointments',
  DEADLINES: 'deadlines',
  TASKS: 'tasks',
  SUPPORT: 'support',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  ADMIN: 'admin',
} as const;

// Default permission definitions with role assignments
export const DefaultPermissions: Array<{
  slug: string;
  label: string;
  description: string;
  featureGroup: string;
  defaultRoles: UserRole[];
}> = [
  // Dashboard
  { slug: 'dashboard.view', label: 'View Dashboard', description: 'Access the main dashboard', featureGroup: 'dashboard', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'dashboard.stats', label: 'View Statistics', description: 'View dashboard statistics and charts', featureGroup: 'dashboard', defaultRoles: ['agent', 'tax_office', 'admin'] },
  
  // Clients
  { slug: 'clients.view', label: 'View Clients', description: 'View client list and details', featureGroup: 'clients', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'clients.create', label: 'Create Clients', description: 'Add new clients', featureGroup: 'clients', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'clients.edit', label: 'Edit Clients', description: 'Modify client information', featureGroup: 'clients', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'clients.delete', label: 'Delete Clients', description: 'Remove clients from system', featureGroup: 'clients', defaultRoles: ['tax_office', 'admin'] },
  
  // Leads
  { slug: 'leads.view', label: 'View Leads', description: 'View lead list and details', featureGroup: 'leads', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'leads.create', label: 'Create Leads', description: 'Add new leads', featureGroup: 'leads', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'leads.edit', label: 'Edit Leads', description: 'Modify lead information', featureGroup: 'leads', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'leads.convert', label: 'Convert Leads', description: 'Convert leads to clients', featureGroup: 'leads', defaultRoles: ['agent', 'tax_office', 'admin'] },
  
  // Documents
  { slug: 'documents.view', label: 'View Documents', description: 'View uploaded documents', featureGroup: 'documents', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'documents.upload', label: 'Upload Documents', description: 'Upload new documents', featureGroup: 'documents', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'documents.download', label: 'Download Documents', description: 'Download documents', featureGroup: 'documents', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'documents.delete', label: 'Delete Documents', description: 'Remove documents', featureGroup: 'documents', defaultRoles: ['tax_office', 'admin'] },
  { slug: 'documents.request', label: 'Request Documents', description: 'Request documents from clients', featureGroup: 'documents', defaultRoles: ['agent', 'tax_office', 'admin'] },
  
  // E-Signatures
  { slug: 'signatures.view', label: 'View E-Signatures', description: 'View e-signature requests', featureGroup: 'documents', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'signatures.create', label: 'Create E-Signature Requests', description: 'Send Form 8879 for signature', featureGroup: 'documents', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'signatures.sign', label: 'Sign Documents', description: 'Sign e-signature requests', featureGroup: 'documents', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'signatures.download_pdf', label: 'Download Signed PDFs', description: 'Download completed Form 8879 PDFs', featureGroup: 'documents', defaultRoles: ['agent', 'tax_office', 'admin'] },
  
  // Payments
  { slug: 'payments.view', label: 'View Payments', description: 'View payment records', featureGroup: 'payments', defaultRoles: ['tax_office', 'admin'] },
  { slug: 'payments.create', label: 'Create Payments', description: 'Add payment records', featureGroup: 'payments', defaultRoles: ['tax_office', 'admin'] },
  { slug: 'payments.edit', label: 'Edit Payments', description: 'Modify payment information', featureGroup: 'payments', defaultRoles: ['tax_office', 'admin'] },
  { slug: 'payments.delete', label: 'Delete Payments', description: 'Remove payment records', featureGroup: 'payments', defaultRoles: ['admin'] },
  
  // Appointments
  { slug: 'appointments.view', label: 'View Appointments', description: 'View scheduled appointments', featureGroup: 'appointments', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'appointments.create', label: 'Create Appointments', description: 'Schedule new appointments', featureGroup: 'appointments', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'appointments.edit', label: 'Edit Appointments', description: 'Modify appointment details', featureGroup: 'appointments', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'appointments.delete', label: 'Delete Appointments', description: 'Cancel appointments', featureGroup: 'appointments', defaultRoles: ['tax_office', 'admin'] },
  
  // Tax Deadlines
  { slug: 'deadlines.view', label: 'View Tax Deadlines', description: 'View tax deadline calendar', featureGroup: 'deadlines', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'deadlines.create', label: 'Create Deadlines', description: 'Add new tax deadlines', featureGroup: 'deadlines', defaultRoles: ['tax_office', 'admin'] },
  { slug: 'deadlines.edit', label: 'Edit Deadlines', description: 'Modify deadline information', featureGroup: 'deadlines', defaultRoles: ['tax_office', 'admin'] },
  
  // Tasks
  { slug: 'tasks.view', label: 'View Tasks', description: 'View task board', featureGroup: 'tasks', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'tasks.create', label: 'Create Tasks', description: 'Add new tasks', featureGroup: 'tasks', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'tasks.edit', label: 'Edit Tasks', description: 'Modify task details', featureGroup: 'tasks', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'tasks.assign', label: 'Assign Tasks', description: 'Assign tasks to team members', featureGroup: 'tasks', defaultRoles: ['tax_office', 'admin'] },
  
  // Support
  { slug: 'support.view', label: 'View Support Tickets', description: 'View support tickets', featureGroup: 'support', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'support.create', label: 'Create Support Tickets', description: 'Submit support requests', featureGroup: 'support', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'support.respond', label: 'Respond to Tickets', description: 'Reply to support tickets', featureGroup: 'support', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'support.close', label: 'Close Tickets', description: 'Close support tickets', featureGroup: 'support', defaultRoles: ['agent', 'tax_office', 'admin'] },
  
  // Knowledge Base
  { slug: 'knowledge.view', label: 'View Knowledge Base', description: 'Access knowledge base articles', featureGroup: 'knowledge', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'knowledge.create', label: 'Create Articles', description: 'Create knowledge base articles', featureGroup: 'knowledge', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'knowledge.edit', label: 'Edit Articles', description: 'Edit knowledge base articles', featureGroup: 'knowledge', defaultRoles: ['agent', 'tax_office', 'admin'] },
  
  // Reports
  { slug: 'reports.view', label: 'View Reports', description: 'Access reports and analytics', featureGroup: 'reports', defaultRoles: ['tax_office', 'admin'] },
  { slug: 'reports.export', label: 'Export Reports', description: 'Export report data', featureGroup: 'reports', defaultRoles: ['tax_office', 'admin'] },
  
  // Settings
  { slug: 'settings.view', label: 'View Settings', description: 'View system settings', featureGroup: 'settings', defaultRoles: ['tax_office', 'admin'] },
  { slug: 'settings.edit', label: 'Edit Settings', description: 'Modify system settings', featureGroup: 'settings', defaultRoles: ['admin'] },
  
  // Admin
  { slug: 'admin.users', label: 'Manage Users', description: 'Manage user accounts and roles', featureGroup: 'admin', defaultRoles: ['admin'] },
  { slug: 'admin.permissions', label: 'Manage Permissions', description: 'Configure role permissions', featureGroup: 'admin', defaultRoles: ['admin'] },
  { slug: 'admin.audit', label: 'View Audit Logs', description: 'View system audit logs', featureGroup: 'admin', defaultRoles: ['admin'] },
  { slug: 'admin.invites', label: 'Manage Invites', description: 'Create and manage staff invites', featureGroup: 'admin', defaultRoles: ['admin'] },
  { slug: 'admin.system', label: 'System Administration', description: 'Full system administration access', featureGroup: 'admin', defaultRoles: ['admin'] },
];

// Tickets Table for support
export const tickets = mysqlTable("tickets", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  clientId: varchar("client_id", { length: 36 }),
  clientName: text("client_name"),
  subject: text("subject").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).default("general"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  status: varchar("status", { length: 20 }).default("open"),
  assignedToId: varchar("assigned_to_id", { length: 36 }),
  assignedTo: text("assigned_to"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

// Knowledge Base Table
export const knowledgeBase = mysqlTable("knowledge_base", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  tags: text("tags"),
  authorId: varchar("author_id", { length: 36 }),
  authorName: text("author_name"),
  isPublished: boolean("is_published").default(true),
  viewCount: int("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;

// Password Reset Tokens Table
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Email Types for the system
export type EmailType = 
  | 'welcome'
  | 'password_reset'
  | 'email_verification'
  | 'document_request'
  | 'document_uploaded'
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'payment_reminder'
  | 'payment_received'
  | 'tax_filing_status'
  | 'signature_request'
  | 'signature_completed'
  | 'staff_invite'
  | 'support_ticket_created'
  | 'support_ticket_response';
