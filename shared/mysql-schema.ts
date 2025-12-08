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

// Offices Table - Tax Office tenant isolation
// Each Tax Office belongs to an office, and all their clients/agents are scoped to that office
export const offices = mysqlTable("offices", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique(), // Subdomain routing: acmetax.ststaxrepair.org
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOfficeSchema = createInsertSchema(offices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOffice = z.infer<typeof insertOfficeSchema>;
export type Office = typeof offices.$inferSelect;

// Office Branding Table - Custom branding per Tax Office
// Enables white-labeling: custom logo, colors, company name, reply-to email
export const officeBranding = mysqlTable("office_branding", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  officeId: varchar("office_id", { length: 36 }).notNull().unique(),
  companyName: varchar("company_name", { length: 255 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  logoObjectKey: varchar("logo_object_key", { length: 255 }), // Object storage key
  primaryColor: varchar("primary_color", { length: 20 }).default('#1a4d2e'),
  secondaryColor: varchar("secondary_color", { length: 20 }).default('#4CAF50'),
  accentColor: varchar("accent_color", { length: 20 }).default('#22c55e'),
  defaultTheme: varchar("default_theme", { length: 10 }).default('light').$type<'light' | 'dark'>(),
  replyToEmail: varchar("reply_to_email", { length: 255 }),
  replyToName: varchar("reply_to_name", { length: 255 }),
  updatedByUserId: varchar("updated_by_user_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOfficeBrandingSchema = createInsertSchema(officeBranding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOfficeBranding = z.infer<typeof insertOfficeBrandingSchema>;
export type OfficeBranding = typeof officeBranding.$inferSelect;

// Homepage Agents Table - agents displayed on the homepage
export const homePageAgents = mysqlTable("home_page_agents", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  address: text("address"),
  imageUrl: varchar("image_url", { length: 500 }),
  imageObjectKey: varchar("image_object_key", { length: 255 }), // Object storage key
  rating: int("rating").default(5),
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHomePageAgentSchema = createInsertSchema(homePageAgents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertHomePageAgent = z.infer<typeof insertHomePageAgentSchema>;
export type HomePageAgent = typeof homePageAgents.$inferSelect;

// Agent-Client Assignments Table - tracks which agents are assigned to which clients
// CRITICAL: Agents can ONLY see data for clients explicitly assigned to them
export const agentClientAssignments = mysqlTable(
  "agent_client_assignments",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    agentId: varchar("agent_id", { length: 36 }).notNull(),
    clientId: varchar("client_id", { length: 36 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    agentIdx: index("idx_assignments_agent").on(table.agentId),
    clientIdx: index("idx_assignments_client").on(table.clientId),
  }),
);

export const insertAgentClientAssignmentSchema = createInsertSchema(agentClientAssignments).omit({
  id: true,
  createdAt: true,
});

export type InsertAgentClientAssignment = z.infer<typeof insertAgentClientAssignmentSchema>;
export type AgentClientAssignment = typeof agentClientAssignments.$inferSelect;

// Users Table - All users in the system (clients, agents, tax office staff, admins)
export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    email: varchar("email", { length: 255 }).unique().notNull(),
    passwordHash: text("password_hash"),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    role: varchar("role", { length: 20 }).$type<UserRole>().default('client'),
    officeId: varchar("office_id", { length: 36 }), // Tax Office scope
    isEmailVerified: boolean("is_email_verified").default(false),
    isActive: boolean("is_active").default(true),
    profileImageUrl: varchar("profile_image_url", { length: 500 }),
    profileImageObjectKey: varchar("profile_image_object_key", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    lastLoginAt: timestamp("last_login_at"),
    userAgent: text("user_agent"),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    officeIdx: index("idx_users_office").on(table.officeId),
    roleIdx: index("idx_users_role").on(table.role),
  }),
);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  userAgent: true,
  isEmailVerified: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Appointments Table - Client bookings with tax preparers
export const appointments = mysqlTable(
  "appointments",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    clientId: varchar("client_id", { length: 36 }).notNull(),
    agentId: varchar("agent_id", { length: 36 }).notNull(),
    appointmentDate: timestamp("appointment_date").notNull(),
    status: varchar("status", { length: 20 }).$type<'scheduled' | 'completed' | 'cancelled' | 'no_show'>().default('scheduled'),
    notes: text("notes"),
    videoCallUrl: varchar("video_call_url", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    clientIdx: index("idx_appointments_client").on(table.clientId),
    agentIdx: index("idx_appointments_agent").on(table.agentId),
    dateIdx: index("idx_appointments_date").on(table.appointmentDate),
  }),
);

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Documents Table - Files uploaded by clients and agents
// Tracks document versions, uploads, revisions
export const documentVersions = mysqlTable(
  "document_versions",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    clientId: varchar("client_id", { length: 36 }).notNull(),
    documentType: varchar("document_type", { length: 50 }).notNull(), // e.g., 'w2', '1099', 'id_scan'
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: varchar("file_url", { length: 500 }).notNull(), // Full URL or path to file
    fileSize: int("file_size"), // in bytes
    mimeType: varchar("mime_type", { length: 100 }),
    uploadedByUserId: varchar("uploaded_by_user_id", { length: 36 }).notNull(),
    status: varchar("status", { length: 20 }).$type<'pending' | 'reviewing' | 'approved' | 'rejected'>().default('pending'),
    rejectionReason: text("rejection_reason"),
    version: int("version").default(1),
    parentDocumentId: varchar("parent_document_id", { length: 36 }), // Links to original document if this is a revision
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    clientIdx: index("idx_documents_client").on(table.clientId),
    typeIdx: index("idx_documents_type").on(table.documentType),
    statusIdx: index("idx_documents_status").on(table.status),
  }),
);

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
export type DocumentVersion = typeof documentVersions.$inferSelect;

// Payments Table - Track all payments (received and requested refunds)
export const payments = mysqlTable(
  "payments",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    clientId: varchar("client_id", { length: 36 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default('USD'),
    paymentType: varchar("payment_type", { length: 20 }).$type<'service_fee' | 'refund_advance' | 'rfp_fee'>().notNull(),
    paymentMethod: varchar("payment_method", { length: 50 }).$type<'check' | 'ach' | 'credit_card' | 'cash'>(),
    status: varchar("status", { length: 20 }).$type<'pending' | 'completed' | 'failed' | 'refunded'>().default('pending'),
    receiptNumber: varchar("receipt_number", { length: 100 }).unique(),
    notes: text("notes"),
    processedDate: timestamp("processed_date"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    clientIdx: index("idx_payments_client").on(table.clientId),
    statusIdx: index("idx_payments_status").on(table.status),
  }),
);

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedDate: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// E-Signatures Table - Form 8879 and other signature requests
export const eSignatures = mysqlTable(
  "e_signatures",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    clientId: varchar("client_id", { length: 36 }).notNull(),
    taxYear: varchar("tax_year", { length: 4 }).notNull(),
    formType: varchar("form_type", { length: 50 }).notNull(), // e.g., 'form_8879'
    status: varchar("status", { length: 20 }).$type<'pending' | 'signed' | 'rejected'>().default('pending'),
    signatureData: json("signature_data"), // Base64 image or signature object
    signedDate: timestamp("signed_date"),
    signatureUrl: varchar("signature_url", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    clientIdx: index("idx_esignatures_client").on(table.clientId),
    statusIdx: index("idx_esignatures_status").on(table.status),
  }),
);

export const insertESignatureSchema = createInsertSchema(eSignatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  signedDate: true,
});

export type InsertESignature = z.infer<typeof insertESignatureSchema>;
export type ESignature = typeof eSignatures.$inferSelect;

// Email Logs Table - Track all emails sent to clients
export const emailLogs = mysqlTable(
  "email_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
    recipientId: varchar("recipient_id", { length: 36 }), // User ID if known
    emailType: varchar("email_type", { length: 50 }).notNull(), // e.g., 'verification', 'password_reset', 'appointment_confirmation'
    subject: varchar("subject", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).$type<'sent' | 'failed' | 'bounced'>().default('sent'),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at").defaultNow(),
  },
  (table) => ({
    recipientIdx: index("idx_emails_recipient").on(table.recipientEmail),
    typeIdx: index("idx_emails_type").on(table.emailType),
    statusIdx: index("idx_emails_status").on(table.status),
  }),
);

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  sentAt: true,
});

export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;

// Document Request Templates Table - Custom templates for requesting documents from clients
export const documentRequestTemplates = mysqlTable(
  "document_request_templates",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    officeId: varchar("office_id", { length: 36 }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    requiredDocuments: json("required_documents").notNull(), // Array of document types
    priority: varchar("priority", { length: 20 }).$type<'low' | 'medium' | 'high'>().default('medium'),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    officeIdx: index("idx_templates_office").on(table.officeId),
  }),
);

export const insertDocumentRequestTemplateSchema = createInsertSchema(documentRequestTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocumentRequestTemplate = z.infer<typeof insertDocumentRequestTemplateSchema>;
export type DocumentRequestTemplate = typeof documentRequestTemplates.$inferSelect;

// Tax Filings Table - Track per-year tax filing status for each client
export const taxFilings = mysqlTable(
  "tax_filings",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    clientId: varchar("client_id", { length: 36 }).notNull(),
    taxYear: varchar("tax_year", { length: 4 }).notNull(),
    status: varchar("status", { length: 30 }).$type<'new' | 'documents_pending' | 'review' | 'filed' | 'accepted' | 'approved' | 'paid'>().default('new'),
    federalRefund: decimal("federal_refund", { precision: 12, scale: 2 }),
    stateRefund: decimal("state_refund", { precision: 12, scale: 2 }),
    filedDate: timestamp("filed_date"),
    approvedDate: timestamp("approved_date"),
    paidDate: timestamp("paid_date"),
    preparedByUserId: varchar("prepared_by_user_id", { length: 36 }),
    reviewedByUserId: varchar("reviewed_by_user_id", { length: 36 }),
    statusHistory: json("status_history"), // Array of status changes with timestamps for audit trail
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    clientTaxYearIdx: index("idx_tax_filings_client_year").on(table.clientId, table.taxYear),
    statusIdx: index("idx_tax_filings_status").on(table.status),
    yearIdx: index("idx_tax_filings_year").on(table.taxYear),
  }),
);

export const insertTaxFilingSchema = createInsertSchema(taxFilings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  filedDate: true,
  approvedDate: true,
  paidDate: true,
});

export type InsertTaxFiling = z.infer<typeof insertTaxFilingSchema>;
export type TaxFiling = typeof taxFilings.$inferSelect;

// Tasks Table - Track task assignments and status
export const tasks = mysqlTable(
  "tasks",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    clientId: varchar("client_id", { length: 36 }),
    assignedToId: varchar("assigned_to_id", { length: 36 }),
    status: varchar("status", { length: 20 }).$type<'todo' | 'in_progress' | 'completed' | 'blocked'>().default('todo'),
    priority: varchar("priority", { length: 20 }).$type<'low' | 'medium' | 'high' | 'critical'>().default('medium'),
    dueDate: timestamp("due_date"),
    createdByUserId: varchar("created_by_user_id", { length: 36 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    clientIdx: index("idx_tasks_client").on(table.clientId),
    assignedIdx: index("idx_tasks_assigned").on(table.assignedToId),
    statusIdx: index("idx_tasks_status").on(table.status),
  }),
);

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Audit Log Table - Track all sensitive operations for compliance
export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 }),
    action: varchar("action", { length: 100 }).notNull(),
    resourceType: varchar("resource_type", { length: 50 }).notNull(),
    resourceId: varchar("resource_id", { length: 36 }).notNull(),
    changes: json("changes"), // What changed: { field: { old, new } }
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_audit_user").on(table.userId),
    resourceIdx: index("idx_audit_resource").on(table.resourceType, table.resourceId),
  }),
);

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Role Audit Log Table - Track role changes for compliance
export const roleAuditLogs = mysqlTable(
  "role_audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    userName: varchar("user_name", { length: 255 }),
    previousRole: varchar("previous_role", { length: 50 }).$type<UserRole>(),
    newRole: varchar("new_role", { length: 50 }).$type<UserRole>().notNull(),
    changedByUserId: varchar("changed_by_user_id", { length: 36 }).notNull(),
    changedByName: varchar("changed_by_name", { length: 255 }),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_role_audit_user").on(table.userId),
    changedByIdx: index("idx_role_audit_changed_by").on(table.changedByUserId),
  }),
);

export const insertRoleAuditLogSchema = createInsertSchema(roleAuditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertRoleAuditLog = z.infer<typeof insertRoleAuditLogSchema>;
export type RoleAuditLog = typeof roleAuditLogs.$inferSelect;

// Staff Invites Table - Pending staff invitations
export const staffInvites = mysqlTable(
  "staff_invites",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).$type<UserRole>().default('agent'),
    inviteCode: varchar("invite_code", { length: 255 }).unique().notNull(),
    invitedByUserId: varchar("invited_by_user_id", { length: 36 }).notNull(),
    invitedByName: varchar("invited_by_name", { length: 255 }),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_invites_email").on(table.email),
    codeIdx: index("idx_invites_code").on(table.inviteCode),
  }),
);

export const insertStaffInviteSchema = createInsertSchema(staffInvites).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export type InsertStaffInvite = z.infer<typeof insertStaffInviteSchema>;
export type StaffInvite = typeof staffInvites.$inferSelect;

// Staff Requests Table - Pending staff join requests from signup form
export type StaffRequestStatus = 'pending' | 'approved' | 'rejected';

export const staffRequests = mysqlTable(
  "staff_requests",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    roleRequested: varchar("role_requested", { length: 50 }).$type<'agent' | 'tax_office'>().default('agent'),
    reason: text("reason"),
    status: varchar("status", { length: 20 }).$type<StaffRequestStatus>().default('pending'),
    reviewNotes: text("review_notes"),
    reviewedByUserId: varchar("reviewed_by_user_id", { length: 36 }),
    reviewedByName: varchar("reviewed_by_name", { length: 255 }),
    reviewedAt: timestamp("reviewed_at"),
    createdUserId: varchar("created_user_id", { length: 36 }), // The created user ID after approval
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_requests_email").on(table.email),
    statusIdx: index("idx_requests_status").on(table.status),
  }),
);

export const insertStaffRequestSchema = createInsertSchema(staffRequests).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  createdUserId: true,
  reviewedByUserId: true,
  reviewedByName: true,
});

export type InsertStaffRequest = z.infer<typeof insertStaffRequestSchema>;
export type StaffRequest = typeof staffRequests.$inferSelect;

// AGENTS FEATURE GROUP - Defines agent-related features and permissions
export const FEATURE_GROUPS = {
  AGENTS: 'agents',
  PAYMENTS: 'payments',
  SUPPORT: 'support',
  APPOINTMENTS: 'appointments',
  DOCUMENTS: 'documents',
  ANALYTICS: 'analytics',
  CLIENTS: 'clients',
  LEADS: 'leads',
  TASKS: 'tasks',
  REPORTS: 'reports',
  STAFF: 'staff',
  GENERAL: 'general',
} as const;

// Permissions Table - Role-based access control
export const permissions = [
  // General
  { slug: 'dashboard.view', label: 'View Dashboard', description: 'Access main dashboard', featureGroup: 'general', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  
  // Clients (Agent: scoped to assigned clients only)
  { slug: 'clients.view', label: 'View Clients', description: 'View client list and details (Agent: assigned clients only)', featureGroup: 'clients', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'clients.create', label: 'Create Clients', description: 'Add new clients to the system', featureGroup: 'clients', defaultRoles: ['tax_office', 'admin'] },
  { slug: 'clients.edit', label: 'Edit Clients', description: 'Modify client information (Agent: assigned clients only)', featureGroup: 'clients', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'clients.delete', label: 'Delete Clients', description: 'Remove clients from the system', featureGroup: 'clients', defaultRoles: ['tax_office', 'admin'] },
  { slug: 'clients.assign', label: 'Assign Clients to Agent', description: 'Assign or reassign clients to agents', featureGroup: 'clients', defaultRoles: ['tax_office', 'admin'] },
  
  // Leads (Agent: scoped to assigned leads only)
  { slug: 'leads.view', label: 'View Leads', description: 'View lead list and details (Agent: assigned leads only)', featureGroup: 'leads', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'leads.create', label: 'Create Leads', description: 'Add new leads', featureGroup: 'leads', defaultRoles: ['tax_office', 'admin'] },
  { slug: 'leads.edit', label: 'Edit Leads', description: 'Modify lead information (Agent: assigned leads only)', featureGroup: 'leads', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'leads.delete', label: 'Delete Leads', description: 'Remove leads from the system', featureGroup: 'leads', defaultRoles: ['tax_office', 'admin'] },
  
  // Documents (Agent: scoped to assigned clients only)
  { slug: 'documents.view', label: 'View Documents', description: 'View uploaded documents (Agent: assigned clients only)', featureGroup: 'documents', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'documents.upload', label: 'Upload Documents', description: 'Upload new documents', featureGroup: 'documents', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'documents.approve', label: 'Approve Documents', description: 'Review and approve uploaded documents', featureGroup: 'documents', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'documents.delete', label: 'Delete Documents', description: 'Remove documents from the system', featureGroup: 'documents', defaultRoles: ['agent', 'tax_office', 'admin'] },
  
  // Agents - manage homepage agent profiles
  { slug: 'agents.view', label: 'View Agents', description: 'View agent profiles displayed on homepage', featureGroup: 'agents', defaultRoles: ['admin'] },
  { slug: 'agents.create', label: 'Create Agents', description: 'Add new agent profiles to homepage', featureGroup: 'agents', defaultRoles: ['admin'] },
  { slug: 'agents.edit', label: 'Edit Agents', description: 'Modify agent profile information', featureGroup: 'agents', defaultRoles: ['admin'] },
  { slug: 'agents.delete', label: 'Delete Agents', description: 'Remove agent profiles from homepage', featureGroup: 'agents', defaultRoles: ['admin'] },
  
  // Payments (Agent: READ-ONLY for assigned clients, request only - no create/approve)
  { slug: 'payments.view', label: 'View Payments', description: 'View payment history and status', featureGroup: 'payments', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'payments.create', label: 'Record Payments', description: 'Record new payments received', featureGroup: 'payments', defaultRoles: ['tax_office', 'admin'] },
  { slug: 'payments.refund', label: 'Process Refunds', description: 'Issue refunds to clients', featureGroup: 'payments', defaultRoles: ['tax_office', 'admin'] },
  
  // Appointments
  { slug: 'appointments.view', label: 'View Appointments', description: 'View appointment calendar', featureGroup: 'appointments', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'appointments.create', label: 'Schedule Appointments', description: 'Create new appointments', featureGroup: 'appointments', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'appointments.edit', label: 'Edit Appointments', description: 'Modify appointment details', featureGroup: 'appointments', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'appointments.delete', label: 'Cancel Appointments', description: 'Cancel scheduled appointments', featureGroup: 'appointments', defaultRoles: ['agent', 'tax_office', 'admin'] },
  
  // Tasks
  { slug: 'tasks.view', label: 'View Tasks', description: 'View task list and details', featureGroup: 'tasks', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'tasks.create', label: 'Create Tasks', description: 'Create new tasks', featureGroup: 'tasks', defaultRoles: ['tax_office', 'admin'] },
  { slug: 'tasks.edit', label: 'Edit Tasks', description: 'Modify task information', featureGroup: 'tasks', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'tasks.delete', label: 'Delete Tasks', description: 'Remove tasks', featureGroup: 'tasks', defaultRoles: ['tax_office', 'admin'] },
  
  // Support
  { slug: 'support.view', label: 'View Support Tickets', description: 'View support ticket list', featureGroup: 'support', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'support.create', label: 'Create Support Tickets', description: 'Submit new support tickets', featureGroup: 'support', defaultRoles: ['client', 'agent', 'tax_office', 'admin'] },
  { slug: 'support.respond', label: 'Respond to Tickets', description: 'Reply to support tickets', featureGroup: 'support', defaultRoles: ['agent', 'tax_office', 'admin'] },
  { slug: 'support.close', label: 'Close Support Tickets', description: 'Mark tickets as resolved', featureGroup: 'support', defaultRoles: ['tax_office', 'admin'] },
  
  // Analytics & Reports
  { slug: 'analytics.view', label: 'View Analytics', description: 'Access dashboard analytics and reports', featureGroup: 'analytics', defaultRoles: ['tax_office', 'admin'] },
  { slug: 'reports.export', label: 'Export Reports', description: 'Export data to CSV/PDF', featureGroup: 'reports', defaultRoles: ['tax_office', 'admin'] },
  
  // Staff Management
  { slug: 'staff.manage', label: 'Manage Staff', description: 'Invite and manage staff members', featureGroup: 'staff', defaultRoles: ['admin'] },
  { slug: 'staff.roles', label: 'Manage Roles', description: 'Change user roles and permissions', featureGroup: 'staff', defaultRoles: ['admin'] },
  
  // Settings
  { slug: 'settings.view', label: 'View Settings', description: 'Access system settings', featureGroup: 'general', defaultRoles: ['tax_office', 'admin'] },
];

export type NotificationType =
  | 'system'
  | 'user_action'
  | 'payment_received'
  | 'document_uploaded'
  | 'appointment_scheduled'
  | 'signature_completed'
  | 'lead_created'
  | 'tax_filing_status';

// In-App Notifications Table - tracks notifications for users
export const notifications = mysqlTable(
  "notifications",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 }).notNull(), // Who should see this notification
    type: varchar("type", { length: 50 }).notNull().$type<NotificationType>(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    resourceType: varchar("resource_type", { length: 50 }), // e.g., 'staff_request', 'ticket', 'payment'
    resourceId: varchar("resource_id", { length: 36 }), // ID of the related resource
    link: varchar("link", { length: 255 }), // URL to navigate to when clicked
    isRead: boolean("is_read").default(false),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_notifications_user").on(table.userId),
    readIdx: index("idx_notifications_read").on(table.isRead),
    typeIdx: index("idx_notifications_type").on(table.type),
    createdIdx: index("idx_notifications_created").on(table.createdAt),
  }),
);

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  readAt: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
