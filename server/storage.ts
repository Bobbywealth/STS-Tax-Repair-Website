import { 
  type User, 
  type UpsertUser,
  type UserRole,
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
  type StaffMember,
  type InsertStaffMember,
  type RoleAuditLog,
  type InsertRoleAuditLog,
  type StaffInvite,
  type InsertStaffInvite,
  type Permission,
} from "@shared/mysql-schema";

export interface IStorage {
  // Users (Replit Auth required)
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(userId: string, newRole: UserRole, changedById: string, changedByName: string, reason?: string): Promise<User | undefined>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined>;
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
  useStaffInvite(inviteCode: string, userId: string): Promise<StaffInvite | undefined>;
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
}

// MySQL storage connected to cPanel database
import { mysqlStorage } from "./mysql-storage";
export const storage: IStorage = mysqlStorage;
