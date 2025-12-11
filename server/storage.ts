import { 
  type User, 
  type UpsertUser,
  type UserRole,
  type ThemePreference,
  type TaxDeadline,
  type InsertTaxDeadline,
  type Appointment,
  type InsertAppointment,
  type Payment,
  type InsertPayment,
  type DocumentVersion,
  type InsertDocumentVersion,
  type ESignature,
  type InsertESignature,
  type EmailLog,
  type InsertEmailLog,
  type DocumentRequestTemplate,
  type InsertDocumentRequestTemplate,
  type Task,
  type InsertTask,
  type Lead,
  type InsertLead,
  type LeadStatus,
  type StaffMember,
  type InsertStaffMember,
  type RoleAuditLog,
  type InsertRoleAuditLog,
  type StaffInvite,
  type InsertStaffInvite,
  type Permission,
  type TaxFiling,
  type InsertTaxFiling,
  type FilingStatus,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type Ticket,
  type InsertTicket,
  type KnowledgeBase,
  type InsertKnowledgeBase,
  type EmailVerificationToken,
  type Office,
  type InsertOffice,
  type OfficeBranding,
  type InsertOfficeBranding,
  type NotificationPreferences,
  type InsertNotificationPreferences,
} from "@shared/mysql-schema";

export interface IStorage {
  // Users (Replit Auth required)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(userId: string, newRole: UserRole, changedById: string, changedByName: string, reason?: string): Promise<User | undefined>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined>;
  updateUser(userId: string, data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  }>): Promise<User | undefined>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  getStaffUsers(): Promise<User[]>;

  // Tax Deadlines
  getTaxDeadlines(): Promise<TaxDeadline[]>;
  getTaxDeadlinesByYear(year: number): Promise<TaxDeadline[]>;
  createTaxDeadline(deadline: InsertTaxDeadline): Promise<TaxDeadline>;
  updateTaxDeadline(id: string, deadline: Partial<InsertTaxDeadline>): Promise<TaxDeadline | undefined>;
  deleteTaxDeadline(id: string): Promise<boolean>;

  // Appointments
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByClient(clientId: string): Promise<Appointment[]>;
  getAppointmentsByDateRange(start: Date, end: Date): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;

  // Payments
  getPayments(): Promise<Payment[]>;
  getPaymentsByClient(clientId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: string): Promise<boolean>;

  // Document Versions
  getDocumentVersions(clientId: string): Promise<DocumentVersion[]>;
  getDocumentVersion(id: string): Promise<DocumentVersion | undefined>;
  getDocumentVersionsByType(clientId: string, documentType: string): Promise<DocumentVersion[]>;
  getAllDocuments(): Promise<DocumentVersion[]>;
  createDocumentVersion(document: InsertDocumentVersion): Promise<DocumentVersion>;
  deleteDocumentVersion(id: string): Promise<boolean>;

  // E-Signatures
  getESignatures(): Promise<ESignature[]>;
  getESignaturesByClient(clientId: string): Promise<ESignature[]>;
  getESignature(id: string): Promise<ESignature | undefined>;
  createESignature(signature: InsertESignature): Promise<ESignature>;
  updateESignature(id: string, signature: Partial<InsertESignature>): Promise<ESignature | undefined>;
  deleteESignature(id: string): Promise<boolean>;

  // Email Logs
  getEmailLogs(): Promise<EmailLog[]>;
  getEmailLogsByClient(clientId: string): Promise<EmailLog[]>;
  createEmailLog(email: InsertEmailLog): Promise<EmailLog>;

  // Document Request Templates
  getDocumentRequestTemplates(): Promise<DocumentRequestTemplate[]>;
  createDocumentRequestTemplate(template: InsertDocumentRequestTemplate): Promise<DocumentRequestTemplate>;
  updateDocumentRequestTemplate(id: string, template: Partial<InsertDocumentRequestTemplate>): Promise<DocumentRequestTemplate | undefined>;
  deleteDocumentRequestTemplate(id: string): Promise<boolean>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTasksByAssignee(assignedTo: string): Promise<Task[]>;
  getTasksByStatus(status: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Leads
  getLeads(): Promise<Lead[]>;
  getLeadsByStatus(status: LeadStatus): Promise<Lead[]>;
  getLeadsByAssignee(assignedToId: string): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;
  convertLeadToClient(leadId: string, clientId: string): Promise<Lead | undefined>;

  // Staff Members
  getStaffMembers(): Promise<StaffMember[]>;
  getStaffMember(id: string): Promise<StaffMember | undefined>;
  createStaffMember(member: InsertStaffMember): Promise<StaffMember>;
  updateStaffMember(id: string, member: Partial<InsertStaffMember>): Promise<StaffMember | undefined>;
  deleteStaffMember(id: string): Promise<boolean>;

  // Role Audit Log
  getRoleAuditLogs(): Promise<RoleAuditLog[]>;
  getRoleAuditLogsByUser(userId: string): Promise<RoleAuditLog[]>;
  createRoleAuditLog(log: InsertRoleAuditLog): Promise<RoleAuditLog>;

  // Staff Invites
  getStaffInvites(): Promise<StaffInvite[]>;
  getStaffInviteByCode(inviteCode: string): Promise<StaffInvite | undefined>;
  createStaffInvite(invite: InsertStaffInvite): Promise<StaffInvite>;
  useStaffInvite(inviteCode: string, userId: string, userEmail: string): Promise<StaffInvite | undefined>;
  markStaffInviteUsed(inviteCode: string, userId: string): Promise<boolean>;
  deleteStaffInvite(id: string): Promise<boolean>;

  // Permissions
  getPermissions(): Promise<Permission[]>;
  getPermissionsByGroup(): Promise<Record<string, Permission[]>>;
  getRolePermissions(role: UserRole): Promise<string[]>;
  getAllRolePermissions(): Promise<Record<UserRole, string[]>>;
  hasPermission(role: UserRole, permissionSlug: string): Promise<boolean>;
  setRolePermission(role: UserRole, permissionSlug: string, granted: boolean): Promise<void>;
  updateRolePermissions(role: UserRole, permissions: Record<string, boolean>): Promise<void>;
  getRolePermissionMatrix(): Promise<{ permissions: Permission[]; matrix: Record<UserRole, Record<string, boolean>>; }>;

  // Tax Filings
  getTaxFilings(): Promise<TaxFiling[]>;
  getTaxFilingsByYear(year: number): Promise<TaxFiling[]>;
  getTaxFilingsByClient(clientId: string): Promise<TaxFiling[]>;
  getTaxFilingByClientYear(clientId: string, year: number): Promise<TaxFiling | undefined>;
  getTaxFilingsByStatus(status: FilingStatus): Promise<TaxFiling[]>;
  getTaxFilingsByYearAndStatus(year: number, status: FilingStatus): Promise<TaxFiling[]>;
  createTaxFiling(filing: InsertTaxFiling): Promise<TaxFiling>;
  updateTaxFiling(id: string, filing: Partial<InsertTaxFiling>): Promise<TaxFiling | undefined>;
  updateTaxFilingStatus(id: string, status: FilingStatus, note?: string): Promise<TaxFiling | undefined>;
  deleteTaxFiling(id: string): Promise<boolean>;
  getTaxFilingMetrics(year: number): Promise<{
    total: number;
    byStatus: Record<FilingStatus, number>;
    totalEstimatedRefund: number;
    totalActualRefund: number;
  }>;

  // Password Reset Tokens
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;

  // Email Verification Tokens
  createEmailVerificationToken(userId: string, email: string, token: string, expiresAt: Date): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  getEmailVerificationTokenByUserId(userId: string): Promise<EmailVerificationToken | undefined>;
  markEmailVerificationTokenUsed(token: string): Promise<void>;
  incrementEmailVerificationResendCount(token: string): Promise<void>;
  deleteExpiredEmailVerificationTokens(): Promise<void>;
  markUserEmailVerified(userId: string): Promise<void>;

  // Tickets
  getTickets(): Promise<Ticket[]>;
  getTicketsByClient(clientId: string): Promise<Ticket[]>;
  getTicketsByAssignee(assignedToId: string): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: string): Promise<boolean>;

  // Knowledge Base
  getKnowledgeBaseArticles(): Promise<KnowledgeBase[]>;
  getKnowledgeBaseByCategory(category: string): Promise<KnowledgeBase[]>;
  getKnowledgeBaseArticle(id: string): Promise<KnowledgeBase | undefined>;
  createKnowledgeBaseArticle(article: InsertKnowledgeBase): Promise<KnowledgeBase>;
  updateKnowledgeBaseArticle(id: string, article: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase | undefined>;
  deleteKnowledgeBaseArticle(id: string): Promise<boolean>;

  // Offices
  getOffice(id: string): Promise<Office | undefined>;
  getOfficeBySlug(slug: string): Promise<Office | undefined>;
  getOffices(): Promise<Office[]>;
  createOffice(office: InsertOffice): Promise<Office>;
  updateOffice(id: string, office: Partial<InsertOffice>): Promise<Office | undefined>;
  
  // Office Branding (White-labeling)
  getOfficeBranding(officeId: string): Promise<OfficeBranding | undefined>;
  createOfficeBranding(branding: InsertOfficeBranding): Promise<OfficeBranding>;
  updateOfficeBranding(officeId: string, branding: Partial<InsertOfficeBranding>): Promise<OfficeBranding | undefined>;
  deleteOfficeBranding(officeId: string): Promise<boolean>;
  
  // Notification preferences
  getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined>;
  upsertNotificationPreferences(prefs: InsertNotificationPreferences): Promise<NotificationPreferences>;

  // User theme preference
  updateUserThemePreference(userId: string, theme: ThemePreference): Promise<User | undefined>;
}

// MySQL storage connected to cPanel database
import { mysqlStorage } from "./mysql-storage";
export const storage: IStorage = mysqlStorage;
