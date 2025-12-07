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
  type RolePermission,
  type TaxFiling,
  type InsertTaxFiling,
  type FilingStatus,
  type PasswordResetToken,
  type Ticket,
  type InsertTicket,
  type KnowledgeBase,
  type InsertKnowledgeBase,
  type EmailVerificationToken,
  type InsertEmailVerificationToken,
  type Office,
  type InsertOffice,
  type OfficeBranding,
  type InsertOfficeBranding,
  type AgentClientAssignment,
  type InsertAgentClientAssignment,
  type TicketMessage,
  type InsertTicketMessage,
  type AuditLog,
  type InsertAuditLog,
  users as usersTable,
  taxDeadlines as taxDeadlinesTable,
  appointments as appointmentsTable,
  payments as paymentsTable,
  documentVersions as documentVersionsTable,
  eSignatures as eSignaturesTable,
  emailLogs as emailLogsTable,
  documentRequestTemplates as templatesTable,
  tasks as tasksTable,
  leads as leadsTable,
  staffMembers as staffTable,
  roleAuditLog as roleAuditLogTable,
  staffInvites as staffInvitesTable,
  permissions as permissionsTable,
  rolePermissions as rolePermissionsTable,
  taxFilings as taxFilingsTable,
  passwordResetTokens as passwordResetTokensTable,
  emailVerificationTokens as emailVerificationTokensTable,
  offices as officesTable,
  officeBranding as officeBrandingTable,
  agentClientAssignments as agentAssignmentsTable,
  ticketMessages as ticketMessagesTable,
  auditLogs as auditLogsTable
} from "@shared/mysql-schema";
import { mysqlPool } from "./mysql-db";
import { randomUUID } from "crypto";
import { mysqlDb } from "./mysql-db";
import { eq, and, gte, lte, lt, desc, asc } from "drizzle-orm";
import type { IStorage } from "./storage";

// Helper function to extract affectedRows from MySQL2/Drizzle delete result
// Handles both pooled connection (result[0].affectedRows) and direct connection (result.affectedRows) formats
function getAffectedRows(result: any): number {
  if (typeof result?.affectedRows === 'number') {
    return result.affectedRows;
  }
  if (Array.isArray(result) && typeof result[0]?.affectedRows === 'number') {
    return result[0].affectedRows;
  }
  return 0;
}

export class MySQLStorage implements IStorage {
  
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await mysqlDb.select().from(usersTable).where(eq(usersTable.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await mysqlDb.select().from(usersTable).where(eq(usersTable.email, email));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await mysqlDb.select().from(usersTable);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || randomUUID();
    const existing = await this.getUser(id);
    
    const userValues: Record<string, any> = {
      id,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      phone: userData.phone ?? null,
      address: userData.address ?? null,
      city: userData.city ?? null,
      state: userData.state ?? null,
      zipCode: userData.zipCode ?? null,
      country: userData.country ?? 'United States',
      role: userData.role ?? 'client',
      isActive: userData.isActive ?? true,
      updatedAt: new Date(),
    };

    // Handle passwordHash if provided
    if (userData.passwordHash !== undefined) {
      userValues.passwordHash = userData.passwordHash;
    }

    // Handle emailVerifiedAt if provided
    if (userData.emailVerifiedAt !== undefined) {
      userValues.emailVerifiedAt = userData.emailVerifiedAt;
    }

    if (existing) {
      await mysqlDb
        .update(usersTable)
        .set(userValues)
        .where(eq(usersTable.id, id));
      const [updated] = await mysqlDb.select().from(usersTable).where(eq(usersTable.id, id));
      return updated;
    } else {
      await mysqlDb
        .insert(usersTable)
        .values({ ...userValues, createdAt: new Date() });
      const [inserted] = await mysqlDb.select().from(usersTable).where(eq(usersTable.id, id));
      return inserted;
    }
  }

  // Tax Deadlines
  async getTaxDeadlines(): Promise<TaxDeadline[]> {
    return await mysqlDb.select().from(taxDeadlinesTable).orderBy(asc(taxDeadlinesTable.deadlineDate));
  }

  async getTaxDeadlinesByYear(year: number): Promise<TaxDeadline[]> {
    return await mysqlDb.select().from(taxDeadlinesTable)
      .where(eq(taxDeadlinesTable.taxYear, year))
      .orderBy(asc(taxDeadlinesTable.deadlineDate));
  }

  async createTaxDeadline(deadline: InsertTaxDeadline): Promise<TaxDeadline> {
    const id = randomUUID();
    const deadlineData = {
      id,
      title: deadline.title,
      description: deadline.description ?? null,
      deadlineDate: deadline.deadlineDate,
      deadlineType: deadline.deadlineType,
      taxYear: deadline.taxYear,
      isRecurring: deadline.isRecurring ?? false,
      notifyDaysBefore: deadline.notifyDaysBefore ?? 7,
      createdAt: new Date()
    };
    await mysqlDb.insert(taxDeadlinesTable).values(deadlineData);
    const [inserted] = await mysqlDb.select().from(taxDeadlinesTable).where(eq(taxDeadlinesTable.id, id));
    return inserted;
  }

  async updateTaxDeadline(id: string, deadline: Partial<InsertTaxDeadline>): Promise<TaxDeadline | undefined> {
    const existing = await mysqlDb.select().from(taxDeadlinesTable).where(eq(taxDeadlinesTable.id, id));
    if (existing.length === 0) return undefined;
    await mysqlDb.update(taxDeadlinesTable).set(deadline).where(eq(taxDeadlinesTable.id, id));
    const [updated] = await mysqlDb.select().from(taxDeadlinesTable).where(eq(taxDeadlinesTable.id, id));
    return updated;
  }

  async deleteTaxDeadline(id: string): Promise<boolean> {
    const result = await mysqlDb.delete(taxDeadlinesTable).where(eq(taxDeadlinesTable.id, id));
    return getAffectedRows(result) > 0;
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return await mysqlDb.select().from(appointmentsTable).orderBy(asc(appointmentsTable.appointmentDate));
  }

  async getAppointmentsByClient(clientId: string): Promise<Appointment[]> {
    return await mysqlDb.select().from(appointmentsTable)
      .where(eq(appointmentsTable.clientId, clientId))
      .orderBy(asc(appointmentsTable.appointmentDate));
  }

  async getAppointmentsByDateRange(start: Date, end: Date): Promise<Appointment[]> {
    return await mysqlDb.select().from(appointmentsTable)
      .where(and(
        gte(appointmentsTable.appointmentDate, start),
        lte(appointmentsTable.appointmentDate, end)
      ))
      .orderBy(asc(appointmentsTable.appointmentDate));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const appointmentData = {
      id,
      clientId: appointment.clientId,
      clientName: appointment.clientName,
      title: appointment.title,
      description: appointment.description ?? null,
      appointmentDate: appointment.appointmentDate,
      duration: appointment.duration ?? 60,
      status: appointment.status ?? "scheduled",
      location: appointment.location ?? null,
      staffId: appointment.staffId ?? null,
      staffName: appointment.staffName ?? null,
      notes: appointment.notes ?? null,
      createdAt: new Date()
    };
    await mysqlDb.insert(appointmentsTable).values(appointmentData);
    const [inserted] = await mysqlDb.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
    return inserted;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const existing = await mysqlDb.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
    if (existing.length === 0) return undefined;
    await mysqlDb.update(appointmentsTable).set(appointment).where(eq(appointmentsTable.id, id));
    const [updated] = await mysqlDb.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
    return updated;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    const result = await mysqlDb.delete(appointmentsTable).where(eq(appointmentsTable.id, id));
    return getAffectedRows(result) > 0;
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return await mysqlDb.select().from(paymentsTable).orderBy(desc(paymentsTable.createdAt));
  }

  async getPaymentsByClient(clientId: string): Promise<Payment[]> {
    return await mysqlDb.select().from(paymentsTable)
      .where(eq(paymentsTable.clientId, clientId))
      .orderBy(desc(paymentsTable.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const paymentData = {
      id,
      clientId: payment.clientId,
      clientName: payment.clientName,
      serviceFee: payment.serviceFee,
      amountPaid: payment.amountPaid ?? "0.00",
      paymentStatus: payment.paymentStatus ?? "pending",
      dueDate: payment.dueDate ?? null,
      paidDate: payment.paidDate ?? null,
      paymentMethod: payment.paymentMethod ?? null,
      notes: payment.notes ?? null,
      createdAt: new Date()
    };
    await mysqlDb.insert(paymentsTable).values(paymentData);
    const [inserted] = await mysqlDb.select().from(paymentsTable).where(eq(paymentsTable.id, id));
    return inserted;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const existing = await mysqlDb.select().from(paymentsTable).where(eq(paymentsTable.id, id));
    if (existing.length === 0) return undefined;
    await mysqlDb.update(paymentsTable).set(payment).where(eq(paymentsTable.id, id));
    const [updated] = await mysqlDb.select().from(paymentsTable).where(eq(paymentsTable.id, id));
    return updated;
  }

  async deletePayment(id: string): Promise<boolean> {
    const result = await mysqlDb.delete(paymentsTable).where(eq(paymentsTable.id, id));
    return getAffectedRows(result) > 0;
  }

  // Document Versions
  async getDocumentVersions(clientId: string): Promise<DocumentVersion[]> {
    return await mysqlDb.select().from(documentVersionsTable)
      .where(eq(documentVersionsTable.clientId, clientId))
      .orderBy(desc(documentVersionsTable.uploadedAt));
  }

  async getDocumentVersionsByType(clientId: string, documentType: string): Promise<DocumentVersion[]> {
    return await mysqlDb.select().from(documentVersionsTable)
      .where(and(
        eq(documentVersionsTable.clientId, clientId),
        eq(documentVersionsTable.documentType, documentType)
      ))
      .orderBy(asc(documentVersionsTable.version));
  }

  async getAllDocuments(): Promise<DocumentVersion[]> {
    return await mysqlDb.select().from(documentVersionsTable)
      .orderBy(desc(documentVersionsTable.uploadedAt));
  }

  async createDocumentVersion(document: InsertDocumentVersion): Promise<DocumentVersion> {
    const id = randomUUID();
    const documentData = {
      id,
      clientId: document.clientId,
      documentName: document.documentName,
      documentType: document.documentType,
      fileUrl: document.fileUrl,
      version: document.version ?? 1,
      uploadedBy: document.uploadedBy,
      fileSize: document.fileSize ?? null,
      mimeType: document.mimeType ?? null,
      notes: document.notes ?? null,
      uploadedAt: new Date()
    };
    await mysqlDb.insert(documentVersionsTable).values(documentData);
    const [inserted] = await mysqlDb.select().from(documentVersionsTable).where(eq(documentVersionsTable.id, id));
    return inserted;
  }

  async deleteDocumentVersion(id: string): Promise<boolean> {
    const result = await mysqlDb.delete(documentVersionsTable).where(eq(documentVersionsTable.id, id));
    return getAffectedRows(result) > 0;
  }

  // E-Signatures
  async getESignatures(): Promise<ESignature[]> {
    return await mysqlDb.select().from(eSignaturesTable).orderBy(desc(eSignaturesTable.createdAt));
  }

  async getESignaturesByClient(clientId: string): Promise<ESignature[]> {
    return await mysqlDb.select().from(eSignaturesTable)
      .where(eq(eSignaturesTable.clientId, clientId))
      .orderBy(desc(eSignaturesTable.createdAt));
  }

  async getESignature(id: string): Promise<ESignature | undefined> {
    const [signature] = await mysqlDb.select().from(eSignaturesTable).where(eq(eSignaturesTable.id, id));
    return signature;
  }

  async createESignature(signature: InsertESignature): Promise<ESignature> {
    const id = randomUUID();
    const signatureData = {
      id,
      clientId: signature.clientId,
      clientName: signature.clientName,
      documentName: signature.documentName,
      documentType: signature.documentType ?? "form_8879",
      signatureData: signature.signatureData ?? null,
      ipAddress: signature.ipAddress ?? null,
      userAgent: signature.userAgent ?? null,
      signedAt: signature.signedAt ?? null,
      status: signature.status ?? "pending",
      documentUrl: signature.documentUrl ?? null,
      createdAt: new Date()
    };
    await mysqlDb.insert(eSignaturesTable).values(signatureData);
    const [inserted] = await mysqlDb.select().from(eSignaturesTable).where(eq(eSignaturesTable.id, id));
    return inserted;
  }

  async updateESignature(id: string, signature: Partial<InsertESignature>): Promise<ESignature | undefined> {
    const existing = await this.getESignature(id);
    if (!existing) return undefined;
    
    // Convert signedAt string to Date if necessary
    const updateData: Record<string, any> = { ...signature };
    if (updateData.signedAt && typeof updateData.signedAt === 'string') {
      updateData.signedAt = new Date(updateData.signedAt);
    }
    
    await mysqlDb.update(eSignaturesTable).set(updateData).where(eq(eSignaturesTable.id, id));
    const [updated] = await mysqlDb.select().from(eSignaturesTable).where(eq(eSignaturesTable.id, id));
    return updated;
  }

  async deleteESignature(id: string): Promise<boolean> {
    const result = await mysqlDb.delete(eSignaturesTable).where(eq(eSignaturesTable.id, id));
    return getAffectedRows(result) > 0;
  }

  // Email Logs
  async getEmailLogs(): Promise<EmailLog[]> {
    return await mysqlDb.select().from(emailLogsTable).orderBy(desc(emailLogsTable.sentAt));
  }

  async getEmailLogsByClient(clientId: string): Promise<EmailLog[]> {
    return await mysqlDb.select().from(emailLogsTable)
      .where(eq(emailLogsTable.clientId, clientId))
      .orderBy(desc(emailLogsTable.sentAt));
  }

  async createEmailLog(email: InsertEmailLog): Promise<EmailLog> {
    const id = randomUUID();
    const emailData = {
      id,
      clientId: email.clientId ?? null,
      toEmail: email.toEmail,
      fromEmail: email.fromEmail,
      subject: email.subject,
      body: email.body,
      emailType: email.emailType ?? null,
      status: email.status ?? "sent",
      sentAt: new Date()
    };
    await mysqlDb.insert(emailLogsTable).values(emailData);
    const [inserted] = await mysqlDb.select().from(emailLogsTable).where(eq(emailLogsTable.id, id));
    return inserted;
  }

  // Document Request Templates
  async getDocumentRequestTemplates(): Promise<DocumentRequestTemplate[]> {
    return await mysqlDb.select().from(templatesTable)
      .where(eq(templatesTable.isActive, true))
      .orderBy(asc(templatesTable.name));
  }

  async createDocumentRequestTemplate(template: InsertDocumentRequestTemplate): Promise<DocumentRequestTemplate> {
    const id = randomUUID();
    const templateData = {
      id,
      name: template.name,
      subject: template.subject,
      body: template.body,
      documentTypes: template.documentTypes ? [...template.documentTypes] : null,
      isActive: template.isActive ?? true,
      createdAt: new Date()
    };
    await mysqlDb.insert(templatesTable).values(templateData);
    const [inserted] = await mysqlDb.select().from(templatesTable).where(eq(templatesTable.id, id));
    return inserted;
  }

  async updateDocumentRequestTemplate(id: string, template: Partial<InsertDocumentRequestTemplate>): Promise<DocumentRequestTemplate | undefined> {
    const existing = await mysqlDb.select().from(templatesTable).where(eq(templatesTable.id, id));
    if (existing.length === 0) return undefined;
    const updateData = {
      ...template,
      documentTypes: template.documentTypes ? [...template.documentTypes] : undefined
    };
    await mysqlDb.update(templatesTable).set(updateData).where(eq(templatesTable.id, id));
    const [updated] = await mysqlDb.select().from(templatesTable).where(eq(templatesTable.id, id));
    return updated;
  }

  async deleteDocumentRequestTemplate(id: string): Promise<boolean> {
    const result = await mysqlDb.delete(templatesTable).where(eq(templatesTable.id, id));
    return getAffectedRows(result) > 0;
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return await mysqlDb.select().from(tasksTable).orderBy(desc(tasksTable.createdAt));
  }

  async getTasksByAssignee(assignedTo: string): Promise<Task[]> {
    return await mysqlDb.select().from(tasksTable)
      .where(eq(tasksTable.assignedTo, assignedTo))
      .orderBy(desc(tasksTable.createdAt));
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return await mysqlDb.select().from(tasksTable)
      .where(eq(tasksTable.status, status))
      .orderBy(desc(tasksTable.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = randomUUID();
    const taskData = {
      id,
      title: task.title,
      description: task.description ?? null,
      clientId: task.clientId ?? null,
      clientName: task.clientName ?? null,
      assignedToId: task.assignedToId ?? null,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate ?? null,
      priority: task.priority ?? "medium",
      status: task.status ?? "todo",
      category: task.category ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await mysqlDb.insert(tasksTable).values(taskData);
    const [inserted] = await mysqlDb.select().from(tasksTable).where(eq(tasksTable.id, id));
    return inserted;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = await mysqlDb.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (existing.length === 0) return undefined;
    await mysqlDb.update(tasksTable).set({ ...task, updatedAt: new Date() }).where(eq(tasksTable.id, id));
    const [updated] = await mysqlDb.select().from(tasksTable).where(eq(tasksTable.id, id));
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await mysqlDb.delete(tasksTable).where(eq(tasksTable.id, id));
    return getAffectedRows(result) > 0;
  }

  // Leads
  async getLeads(): Promise<Lead[]> {
    return await mysqlDb.select().from(leadsTable).orderBy(desc(leadsTable.createdAt));
  }

  async getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
    return await mysqlDb.select().from(leadsTable)
      .where(eq(leadsTable.status, status))
      .orderBy(desc(leadsTable.createdAt));
  }

  async getLeadsByAssignee(assignedToId: string): Promise<Lead[]> {
    return await mysqlDb.select().from(leadsTable)
      .where(eq(leadsTable.assignedToId, assignedToId))
      .orderBy(desc(leadsTable.createdAt));
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await mysqlDb.select().from(leadsTable).where(eq(leadsTable.id, id));
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const leadData = {
      id,
      name: lead.name,
      email: lead.email ?? null,
      phone: lead.phone ?? null,
      company: lead.company ?? null,
      address: lead.address ?? null,
      city: lead.city ?? null,
      state: lead.state ?? null,
      zipCode: lead.zipCode ?? null,
      country: lead.country ?? "United States",
      source: lead.source ?? null,
      status: (lead.status ?? "new") as LeadStatus,
      notes: lead.notes ?? null,
      assignedToId: lead.assignedToId ?? null,
      assignedToName: lead.assignedToName ?? null,
      estimatedValue: lead.estimatedValue ?? null,
      lastContactDate: lead.lastContactDate ?? null,
      nextFollowUpDate: lead.nextFollowUpDate ?? null,
      convertedToClientId: lead.convertedToClientId ?? null,
      convertedAt: lead.convertedAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await mysqlDb.insert(leadsTable).values([leadData]);
    const [inserted] = await mysqlDb.select().from(leadsTable).where(eq(leadsTable.id, id));
    return inserted;
  }

  async updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const existing = await mysqlDb.select().from(leadsTable).where(eq(leadsTable.id, id));
    if (existing.length === 0) return undefined;
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (lead.name !== undefined) updateData.name = lead.name;
    if (lead.email !== undefined) updateData.email = lead.email;
    if (lead.phone !== undefined) updateData.phone = lead.phone;
    if (lead.company !== undefined) updateData.company = lead.company;
    if (lead.address !== undefined) updateData.address = lead.address;
    if (lead.city !== undefined) updateData.city = lead.city;
    if (lead.state !== undefined) updateData.state = lead.state;
    if (lead.zipCode !== undefined) updateData.zipCode = lead.zipCode;
    if (lead.country !== undefined) updateData.country = lead.country;
    if (lead.source !== undefined) updateData.source = lead.source;
    if (lead.status !== undefined) updateData.status = lead.status as LeadStatus;
    if (lead.notes !== undefined) updateData.notes = lead.notes;
    if (lead.assignedToId !== undefined) updateData.assignedToId = lead.assignedToId;
    if (lead.assignedToName !== undefined) updateData.assignedToName = lead.assignedToName;
    if (lead.estimatedValue !== undefined) updateData.estimatedValue = lead.estimatedValue;
    if (lead.lastContactDate !== undefined) updateData.lastContactDate = lead.lastContactDate;
    if (lead.nextFollowUpDate !== undefined) updateData.nextFollowUpDate = lead.nextFollowUpDate;
    await mysqlDb.update(leadsTable).set(updateData).where(eq(leadsTable.id, id));
    const [updated] = await mysqlDb.select().from(leadsTable).where(eq(leadsTable.id, id));
    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = await mysqlDb.delete(leadsTable).where(eq(leadsTable.id, id));
    return getAffectedRows(result) > 0;
  }

  async convertLeadToClient(leadId: string, clientId: string): Promise<Lead | undefined> {
    const existing = await mysqlDb.select().from(leadsTable).where(eq(leadsTable.id, leadId));
    if (existing.length === 0) return undefined;
    await mysqlDb.update(leadsTable).set({ 
      status: "converted" as LeadStatus,
      convertedToClientId: clientId,
      convertedAt: new Date(),
      updatedAt: new Date()
    }).where(eq(leadsTable.id, leadId));
    const [updated] = await mysqlDb.select().from(leadsTable).where(eq(leadsTable.id, leadId));
    return updated;
  }

  // Staff Members
  async getStaffMembers(): Promise<StaffMember[]> {
    return await mysqlDb.select().from(staffTable)
      .where(eq(staffTable.isActive, true))
      .orderBy(asc(staffTable.name));
  }

  async getStaffMember(id: string): Promise<StaffMember | undefined> {
    const [member] = await mysqlDb.select().from(staffTable).where(eq(staffTable.id, id));
    return member;
  }

  async createStaffMember(member: InsertStaffMember): Promise<StaffMember> {
    const id = randomUUID();
    const memberData = {
      id,
      userId: member.userId ?? null,
      name: member.name,
      email: member.email ?? null,
      role: member.role ?? "Tax Preparer",
      department: member.department ?? null,
      isActive: member.isActive ?? true,
      hireDate: member.hireDate ?? null,
      createdAt: new Date()
    };
    await mysqlDb.insert(staffTable).values(memberData);
    const [inserted] = await mysqlDb.select().from(staffTable).where(eq(staffTable.id, id));
    return inserted;
  }

  async updateStaffMember(id: string, member: Partial<InsertStaffMember>): Promise<StaffMember | undefined> {
    const existing = await mysqlDb.select().from(staffTable).where(eq(staffTable.id, id));
    if (existing.length === 0) return undefined;
    await mysqlDb.update(staffTable).set(member).where(eq(staffTable.id, id));
    const [updated] = await mysqlDb.select().from(staffTable).where(eq(staffTable.id, id));
    return updated;
  }

  async deleteStaffMember(id: string): Promise<boolean> {
    const result = await mysqlDb.delete(staffTable).where(eq(staffTable.id, id));
    return getAffectedRows(result) > 0;
  }

  // User Role Management
  async updateUserRole(userId: string, newRole: UserRole, changedById: string, changedByName: string, reason?: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const previousRole = user.role || 'client';
    
    await mysqlDb.update(usersTable)
      .set({ role: newRole, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));

    await this.createRoleAuditLog({
      userId,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || userId,
      previousRole,
      newRole,
      changedById,
      changedByName,
      reason: reason || null
    });

    const [updated] = await mysqlDb.select().from(usersTable).where(eq(usersTable.id, userId));
    return updated;
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined> {
    const existing = await this.getUser(userId);
    if (!existing) return undefined;
    
    await mysqlDb.update(usersTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));
    
    const [updated] = await mysqlDb.select().from(usersTable).where(eq(usersTable.id, userId));
    return updated;
  }

  async updateUser(userId: string, data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  }>): Promise<User | undefined> {
    const existing = await this.getUser(userId);
    if (!existing) return undefined;
    
    const updateData: any = { updatedAt: new Date() };
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    
    await mysqlDb.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, userId));
    
    const [updated] = await mysqlDb.select().from(usersTable).where(eq(usersTable.id, userId));
    return updated;
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await mysqlDb.select().from(usersTable)
      .where(eq(usersTable.role, role))
      .orderBy(asc(usersTable.firstName));
  }

  async getStaffUsers(): Promise<User[]> {
    return await mysqlDb.select().from(usersTable)
      .where(
        and(
          eq(usersTable.isActive, true)
        )
      )
      .orderBy(asc(usersTable.firstName));
  }

  // Role Audit Log
  async getRoleAuditLogs(): Promise<RoleAuditLog[]> {
    return await mysqlDb.select().from(roleAuditLogTable)
      .orderBy(desc(roleAuditLogTable.createdAt));
  }

  async getRoleAuditLogsByUser(userId: string): Promise<RoleAuditLog[]> {
    return await mysqlDb.select().from(roleAuditLogTable)
      .where(eq(roleAuditLogTable.userId, userId))
      .orderBy(desc(roleAuditLogTable.createdAt));
  }

  async createRoleAuditLog(log: InsertRoleAuditLog): Promise<RoleAuditLog> {
    const id = randomUUID();
    const logData = {
      id,
      userId: log.userId,
      userName: log.userName ?? null,
      previousRole: log.previousRole ?? null,
      newRole: log.newRole,
      changedById: log.changedById,
      changedByName: log.changedByName ?? null,
      reason: log.reason ?? null,
      createdAt: new Date()
    };
    await mysqlDb.insert(roleAuditLogTable).values(logData);
    const [inserted] = await mysqlDb.select().from(roleAuditLogTable).where(eq(roleAuditLogTable.id, id));
    return inserted;
  }

  // Staff Invites
  async getStaffInvites(): Promise<StaffInvite[]> {
    return await mysqlDb.select().from(staffInvitesTable)
      .orderBy(desc(staffInvitesTable.createdAt));
  }

  async getStaffInviteByCode(inviteCode: string): Promise<StaffInvite | undefined> {
    const [invite] = await mysqlDb.select().from(staffInvitesTable)
      .where(eq(staffInvitesTable.inviteCode, inviteCode));
    return invite;
  }

  async createStaffInvite(invite: InsertStaffInvite): Promise<StaffInvite> {
    const id = randomUUID();
    const inviteData = {
      id,
      email: invite.email,
      role: invite.role as UserRole,
      inviteCode: invite.inviteCode,
      invitedById: invite.invitedById,
      invitedByName: invite.invitedByName ?? null,
      expiresAt: invite.expiresAt,
      createdAt: new Date()
    };
    await mysqlDb.insert(staffInvitesTable).values(inviteData as any);
    const [inserted] = await mysqlDb.select().from(staffInvitesTable).where(eq(staffInvitesTable.id, id));
    return inserted;
  }

  async useStaffInvite(inviteCode: string, userId: string, userEmail: string): Promise<StaffInvite | undefined> {
    const invite = await this.getStaffInviteByCode(inviteCode);
    if (!invite) return undefined;
    
    if (invite.usedAt) {
      throw new Error("Invite has already been used");
    }
    
    if (new Date(invite.expiresAt) < new Date()) {
      throw new Error("Invite has expired");
    }

    // CRITICAL: Verify that the logged-in user's email matches the invited email
    // This prevents accidentally changing the wrong user's role
    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new Error(`This invitation was sent to ${invite.email}. Please log in with that email address to redeem it.`);
    }

    // Get the user's current role for audit log
    const currentUser = await this.getUser(userId);
    const previousRole = currentUser?.role || 'client';

    await mysqlDb.update(staffInvitesTable)
      .set({ usedAt: new Date(), usedById: userId })
      .where(eq(staffInvitesTable.inviteCode, inviteCode));

    await mysqlDb.update(usersTable)
      .set({ role: invite.role, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));

    await this.createRoleAuditLog({
      userId,
      previousRole: previousRole as UserRole,
      newRole: invite.role,
      changedById: invite.invitedById,
      changedByName: invite.invitedByName,
      reason: `Staff invite redeemed (code: ${inviteCode.substring(0, 8)}...)`
    });

    const [updated] = await mysqlDb.select().from(staffInvitesTable).where(eq(staffInvitesTable.inviteCode, inviteCode));
    return updated;
  }

  async markStaffInviteUsed(inviteCode: string, userId: string): Promise<boolean> {
    const result = await mysqlDb.update(staffInvitesTable)
      .set({ usedAt: new Date(), usedById: userId })
      .where(eq(staffInvitesTable.inviteCode, inviteCode));
    return getAffectedRows(result) > 0;
  }

  async deleteStaffInvite(id: string): Promise<boolean> {
    const result = await mysqlDb.delete(staffInvitesTable).where(eq(staffInvitesTable.id, id));
    return getAffectedRows(result) > 0;
  }

  // Permissions
  async getPermissions(): Promise<Permission[]> {
    return await mysqlDb.select().from(permissionsTable)
      .orderBy(asc(permissionsTable.sortOrder));
  }

  async getPermissionsByGroup(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getPermissions();
    const grouped: Record<string, Permission[]> = {};
    
    for (const perm of permissions) {
      if (!grouped[perm.featureGroup]) {
        grouped[perm.featureGroup] = [];
      }
      grouped[perm.featureGroup].push(perm);
    }
    
    return grouped;
  }

  // Role Permissions
  async getRolePermissions(role: UserRole): Promise<string[]> {
    const results = await mysqlDb
      .select({
        slug: permissionsTable.slug,
        granted: rolePermissionsTable.granted
      })
      .from(rolePermissionsTable)
      .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionId, permissionsTable.id))
      .where(and(
        eq(rolePermissionsTable.role, role),
        eq(rolePermissionsTable.granted, true)
      ));
    
    return results.map(r => r.slug);
  }

  async getAllRolePermissions(): Promise<Record<UserRole, string[]>> {
    const roles: UserRole[] = ['client', 'agent', 'tax_office', 'admin'];
    const result: Record<UserRole, string[]> = {
      client: [],
      agent: [],
      tax_office: [],
      admin: []
    };
    
    for (const role of roles) {
      result[role] = await this.getRolePermissions(role);
    }
    
    return result;
  }

  async hasPermission(role: UserRole, permissionSlug: string): Promise<boolean> {
    const [result] = await mysqlDb
      .select({ granted: rolePermissionsTable.granted })
      .from(rolePermissionsTable)
      .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionId, permissionsTable.id))
      .where(and(
        eq(rolePermissionsTable.role, role),
        eq(permissionsTable.slug, permissionSlug),
        eq(rolePermissionsTable.granted, true)
      ));
    
    return !!result;
  }

  async setRolePermission(role: UserRole, permissionSlug: string, granted: boolean): Promise<void> {
    // Get the permission ID
    const [permission] = await mysqlDb
      .select({ id: permissionsTable.id })
      .from(permissionsTable)
      .where(eq(permissionsTable.slug, permissionSlug));
    
    if (!permission) {
      throw new Error(`Permission not found: ${permissionSlug}`);
    }

    // Check if role permission already exists
    const [existing] = await mysqlDb
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.role, role),
        eq(rolePermissionsTable.permissionId, permission.id)
      ));

    if (existing) {
      // Update existing
      await mysqlDb
        .update(rolePermissionsTable)
        .set({ granted, updatedAt: new Date() })
        .where(eq(rolePermissionsTable.id, existing.id));
    } else {
      // Insert new
      await mysqlDb
        .insert(rolePermissionsTable)
        .values({
          id: randomUUID(),
          role,
          permissionId: permission.id,
          granted,
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
  }

  async updateRolePermissions(role: UserRole, permissions: Record<string, boolean>): Promise<void> {
    for (const [slug, granted] of Object.entries(permissions)) {
      await this.setRolePermission(role, slug, granted);
    }
  }

  async getRolePermissionMatrix(): Promise<{
    permissions: Permission[];
    matrix: Record<UserRole, Record<string, boolean>>;
  }> {
    const permissions = await this.getPermissions();
    const roles: UserRole[] = ['client', 'agent', 'tax_office', 'admin'];
    
    const matrix: Record<UserRole, Record<string, boolean>> = {
      client: {},
      agent: {},
      tax_office: {},
      admin: {}
    };

    // Get all role permissions in one query
    const allRolePerms = await mysqlDb
      .select({
        role: rolePermissionsTable.role,
        slug: permissionsTable.slug,
        granted: rolePermissionsTable.granted
      })
      .from(rolePermissionsTable)
      .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionId, permissionsTable.id));

    // Build the matrix
    for (const perm of permissions) {
      for (const role of roles) {
        const match = allRolePerms.find(rp => rp.role === role && rp.slug === perm.slug);
        matrix[role][perm.slug] = match?.granted ?? false;
      }
    }

    return { permissions, matrix };
  }

  // Tax Filings
  async getTaxFilings(): Promise<TaxFiling[]> {
    return await mysqlDb.select().from(taxFilingsTable).orderBy(desc(taxFilingsTable.createdAt));
  }

  async getTaxFilingsByYear(year: number): Promise<TaxFiling[]> {
    return await mysqlDb.select().from(taxFilingsTable)
      .where(eq(taxFilingsTable.taxYear, year))
      .orderBy(desc(taxFilingsTable.createdAt));
  }

  async getTaxFilingsByClient(clientId: string): Promise<TaxFiling[]> {
    return await mysqlDb.select().from(taxFilingsTable)
      .where(eq(taxFilingsTable.clientId, clientId))
      .orderBy(desc(taxFilingsTable.taxYear));
  }

  async getTaxFilingByClientYear(clientId: string, year: number): Promise<TaxFiling | undefined> {
    const [filing] = await mysqlDb.select().from(taxFilingsTable)
      .where(and(
        eq(taxFilingsTable.clientId, clientId),
        eq(taxFilingsTable.taxYear, year)
      ));
    return filing;
  }

  async getTaxFilingsByStatus(status: FilingStatus): Promise<TaxFiling[]> {
    return await mysqlDb.select().from(taxFilingsTable)
      .where(eq(taxFilingsTable.status, status))
      .orderBy(desc(taxFilingsTable.createdAt));
  }

  async getTaxFilingsByYearAndStatus(year: number, status: FilingStatus): Promise<TaxFiling[]> {
    return await mysqlDb.select().from(taxFilingsTable)
      .where(and(
        eq(taxFilingsTable.taxYear, year),
        eq(taxFilingsTable.status, status)
      ))
      .orderBy(desc(taxFilingsTable.createdAt));
  }

  async createTaxFiling(filing: InsertTaxFiling): Promise<TaxFiling> {
    const id = randomUUID();
    const now = new Date();
    const status = (filing.status ?? 'new') as FilingStatus;
    const filingData: any = {
      id,
      clientId: filing.clientId,
      taxYear: filing.taxYear,
      status,
      documentsReceivedAt: filing.documentsReceivedAt ?? null,
      submittedAt: filing.submittedAt ?? null,
      acceptedAt: filing.acceptedAt ?? null,
      approvedAt: filing.approvedAt ?? null,
      fundedAt: filing.fundedAt ?? null,
      estimatedRefund: filing.estimatedRefund ?? null,
      actualRefund: filing.actualRefund ?? null,
      serviceFee: filing.serviceFee ?? null,
      feePaid: filing.feePaid ?? false,
      preparerId: filing.preparerId ?? null,
      preparerName: filing.preparerName ?? null,
      officeLocation: filing.officeLocation ?? null,
      filingType: filing.filingType ?? 'individual',
      federalStatus: filing.federalStatus ?? null,
      stateStatus: filing.stateStatus ?? null,
      statesFiled: filing.statesFiled ?? null,
      notes: filing.notes ?? null,
      statusHistory: [{ status, date: now.toISOString() }],
      createdAt: now,
      updatedAt: now
    };

    await mysqlDb.insert(taxFilingsTable).values(filingData);
    const [created] = await mysqlDb.select().from(taxFilingsTable).where(eq(taxFilingsTable.id, id));
    return created;
  }

  async updateTaxFiling(id: string, filing: Partial<InsertTaxFiling>): Promise<TaxFiling | undefined> {
    const existing = await mysqlDb.select().from(taxFilingsTable).where(eq(taxFilingsTable.id, id));
    if (!existing.length) return undefined;

    const updateData: any = { ...filing, updatedAt: new Date() };
    await mysqlDb.update(taxFilingsTable)
      .set(updateData)
      .where(eq(taxFilingsTable.id, id));
    
    const [updated] = await mysqlDb.select().from(taxFilingsTable).where(eq(taxFilingsTable.id, id));
    return updated;
  }

  async updateTaxFilingStatus(id: string, status: FilingStatus, note?: string): Promise<TaxFiling | undefined> {
    const [existing] = await mysqlDb.select().from(taxFilingsTable).where(eq(taxFilingsTable.id, id));
    if (!existing) return undefined;

    const now = new Date();
    const statusHistory = existing.statusHistory || [];
    statusHistory.push({ status, date: now.toISOString(), note });

    const updates: Partial<TaxFiling> = {
      status,
      statusHistory,
      updatedAt: now
    };

    // Set date fields based on status transition
    switch (status) {
      case 'documents_pending':
        break;
      case 'review':
        updates.documentsReceivedAt = now;
        break;
      case 'filed':
        updates.submittedAt = now;
        break;
      case 'accepted':
        updates.acceptedAt = now;
        break;
      case 'approved':
        updates.approvedAt = now;
        break;
      case 'paid':
        updates.fundedAt = now;
        break;
    }

    await mysqlDb.update(taxFilingsTable)
      .set(updates)
      .where(eq(taxFilingsTable.id, id));
    
    const [updated] = await mysqlDb.select().from(taxFilingsTable).where(eq(taxFilingsTable.id, id));
    return updated;
  }

  async deleteTaxFiling(id: string): Promise<boolean> {
    const result = await mysqlDb.delete(taxFilingsTable).where(eq(taxFilingsTable.id, id));
    return true;
  }

  async getTaxFilingMetrics(year: number): Promise<{
    total: number;
    byStatus: Record<FilingStatus, number>;
    totalEstimatedRefund: number;
    totalActualRefund: number;
  }> {
    const filings = await this.getTaxFilingsByYear(year);
    
    const byStatus: Record<FilingStatus, number> = {
      new: 0,
      documents_pending: 0,
      review: 0,
      filed: 0,
      accepted: 0,
      approved: 0,
      paid: 0
    };

    let totalEstimatedRefund = 0;
    let totalActualRefund = 0;

    for (const filing of filings) {
      if (filing.status) {
        byStatus[filing.status]++;
      }
      if (filing.estimatedRefund) {
        totalEstimatedRefund += parseFloat(filing.estimatedRefund);
      }
      if (filing.actualRefund) {
        totalActualRefund += parseFloat(filing.actualRefund);
      }
    }

    return {
      total: filings.length,
      byStatus,
      totalEstimatedRefund,
      totalActualRefund
    };
  }

  // Password Reset Tokens
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const id = randomUUID();
    await mysqlDb.insert(passwordResetTokensTable).values({
      id,
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    });
    const [created] = await mysqlDb.select().from(passwordResetTokensTable).where(eq(passwordResetTokensTable.id, id));
    return created;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await mysqlDb.select()
      .from(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.token, token));
    return resetToken;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await mysqlDb.update(passwordResetTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokensTable.token, token));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await mysqlDb.delete(passwordResetTokensTable)
      .where(lt(passwordResetTokensTable.expiresAt, new Date()));
  }

  // Email Verification Tokens
  async createEmailVerificationToken(userId: string, email: string, token: string, expiresAt: Date): Promise<EmailVerificationToken> {
    const id = randomUUID();
    await mysqlDb.insert(emailVerificationTokensTable).values({
      id,
      userId,
      email,
      token,
      expiresAt,
      createdAt: new Date(),
    });
    const [created] = await mysqlDb.select().from(emailVerificationTokensTable).where(eq(emailVerificationTokensTable.id, id));
    return created;
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    const [verificationToken] = await mysqlDb.select()
      .from(emailVerificationTokensTable)
      .where(eq(emailVerificationTokensTable.token, token));
    return verificationToken;
  }

  async getEmailVerificationTokenByUserId(userId: string): Promise<EmailVerificationToken | undefined> {
    const [verificationToken] = await mysqlDb.select()
      .from(emailVerificationTokensTable)
      .where(and(
        eq(emailVerificationTokensTable.userId, userId),
        gte(emailVerificationTokensTable.expiresAt, new Date())
      ));
    return verificationToken;
  }

  async markEmailVerificationTokenUsed(token: string): Promise<void> {
    await mysqlDb.update(emailVerificationTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokensTable.token, token));
  }

  async incrementEmailVerificationResendCount(token: string): Promise<void> {
    const existing = await this.getEmailVerificationToken(token);
    if (existing) {
      await mysqlDb.update(emailVerificationTokensTable)
        .set({ resendCount: (existing.resendCount || 0) + 1 })
        .where(eq(emailVerificationTokensTable.token, token));
    }
  }

  async deleteExpiredEmailVerificationTokens(): Promise<void> {
    await mysqlDb.delete(emailVerificationTokensTable)
      .where(lt(emailVerificationTokensTable.expiresAt, new Date()));
  }

  async markUserEmailVerified(userId: string): Promise<void> {
    await mysqlDb.update(usersTable)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(usersTable.id, userId));
  }

  // Tickets
  async getTickets(): Promise<Ticket[]> {
    const [rows] = await mysqlPool.query(
      `SELECT id, client_id as clientId, client_name as clientName, subject, description, 
       category, priority, status, assigned_to_id as assignedToId, assigned_to as assignedTo,
       resolved_at as resolvedAt, created_at as createdAt, updated_at as updatedAt
       FROM tickets ORDER BY created_at DESC`
    );
    return rows as Ticket[];
  }

  async getTicketsByClient(clientId: string): Promise<Ticket[]> {
    const [rows] = await mysqlPool.query(
      `SELECT id, client_id as clientId, client_name as clientName, subject, description, 
       category, priority, status, assigned_to_id as assignedToId, assigned_to as assignedTo,
       resolved_at as resolvedAt, created_at as createdAt, updated_at as updatedAt
       FROM tickets WHERE client_id = ? ORDER BY created_at DESC`,
      [clientId]
    );
    return rows as Ticket[];
  }

  async getTicketsByAssignee(assignedToId: string): Promise<Ticket[]> {
    const [rows] = await mysqlPool.query(
      `SELECT id, client_id as clientId, client_name as clientName, subject, description, 
       category, priority, status, assigned_to_id as assignedToId, assigned_to as assignedTo,
       resolved_at as resolvedAt, created_at as createdAt, updated_at as updatedAt
       FROM tickets WHERE assigned_to_id = ? ORDER BY created_at DESC`,
      [assignedToId]
    );
    return rows as Ticket[];
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [rows] = await mysqlPool.query(
      `SELECT id, client_id as clientId, client_name as clientName, subject, description, 
       category, priority, status, assigned_to_id as assignedToId, assigned_to as assignedTo,
       resolved_at as resolvedAt, created_at as createdAt, updated_at as updatedAt
       FROM tickets WHERE id = ?`,
      [id]
    );
    const result = rows as Ticket[];
    return result[0];
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const id = randomUUID();
    await mysqlPool.query(
      `INSERT INTO tickets (id, client_id, client_name, subject, description, category, priority, status, assigned_to_id, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, ticket.clientId || null, ticket.clientName || null, ticket.subject, ticket.description || null,
       ticket.category || 'general', ticket.priority || 'medium', ticket.status || 'open',
       ticket.assignedToId || null, ticket.assignedTo || null]
    );
    const created = await this.getTicket(id);
    return created!;
  }

  async updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const updates: string[] = [];
    const values: any[] = [];

    if (ticket.subject !== undefined) { updates.push('subject = ?'); values.push(ticket.subject); }
    if (ticket.description !== undefined) { updates.push('description = ?'); values.push(ticket.description); }
    if (ticket.category !== undefined) { updates.push('category = ?'); values.push(ticket.category); }
    if (ticket.priority !== undefined) { updates.push('priority = ?'); values.push(ticket.priority); }
    if (ticket.status !== undefined) { updates.push('status = ?'); values.push(ticket.status); }
    if (ticket.assignedToId !== undefined) { updates.push('assigned_to_id = ?'); values.push(ticket.assignedToId); }
    if (ticket.assignedTo !== undefined) { updates.push('assigned_to = ?'); values.push(ticket.assignedTo); }
    if (ticket.resolvedAt !== undefined) { updates.push('resolved_at = ?'); values.push(ticket.resolvedAt); }

    if (updates.length === 0) return this.getTicket(id);

    values.push(id);
    await mysqlPool.query(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.getTicket(id);
  }

  async deleteTicket(id: string): Promise<boolean> {
    await mysqlPool.query('DELETE FROM tickets WHERE id = ?', [id]);
    return true;
  }

  // Knowledge Base
  async getKnowledgeBaseArticles(): Promise<KnowledgeBase[]> {
    const [rows] = await mysqlPool.query(
      `SELECT id, title, content, category, tags, author_id as authorId, author_name as authorName,
       is_published as isPublished, view_count as viewCount, created_at as createdAt, updated_at as updatedAt
       FROM knowledge_base ORDER BY created_at DESC`
    );
    return rows as KnowledgeBase[];
  }

  async getKnowledgeBaseByCategory(category: string): Promise<KnowledgeBase[]> {
    const [rows] = await mysqlPool.query(
      `SELECT id, title, content, category, tags, author_id as authorId, author_name as authorName,
       is_published as isPublished, view_count as viewCount, created_at as createdAt, updated_at as updatedAt
       FROM knowledge_base WHERE category = ? ORDER BY created_at DESC`,
      [category]
    );
    return rows as KnowledgeBase[];
  }

  async getKnowledgeBaseArticle(id: string): Promise<KnowledgeBase | undefined> {
    const [rows] = await mysqlPool.query(
      `SELECT id, title, content, category, tags, author_id as authorId, author_name as authorName,
       is_published as isPublished, view_count as viewCount, created_at as createdAt, updated_at as updatedAt
       FROM knowledge_base WHERE id = ?`,
      [id]
    );
    const result = rows as KnowledgeBase[];
    return result[0];
  }

  async createKnowledgeBaseArticle(article: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const id = randomUUID();
    await mysqlPool.query(
      `INSERT INTO knowledge_base (id, title, content, category, tags, author_id, author_name, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, article.title, article.content, article.category || null, article.tags || null,
       article.authorId || null, article.authorName || null, article.isPublished !== false]
    );
    const created = await this.getKnowledgeBaseArticle(id);
    return created!;
  }

  async updateKnowledgeBaseArticle(id: string, article: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase | undefined> {
    const updates: string[] = [];
    const values: any[] = [];

    if (article.title !== undefined) { updates.push('title = ?'); values.push(article.title); }
    if (article.content !== undefined) { updates.push('content = ?'); values.push(article.content); }
    if (article.category !== undefined) { updates.push('category = ?'); values.push(article.category); }
    if (article.tags !== undefined) { updates.push('tags = ?'); values.push(article.tags); }
    if (article.isPublished !== undefined) { updates.push('is_published = ?'); values.push(article.isPublished); }

    if (updates.length === 0) return this.getKnowledgeBaseArticle(id);

    values.push(id);
    await mysqlPool.query(`UPDATE knowledge_base SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.getKnowledgeBaseArticle(id);
  }

  async deleteKnowledgeBaseArticle(id: string): Promise<boolean> {
    await mysqlPool.query('DELETE FROM knowledge_base WHERE id = ?', [id]);
    return true;
  }

  // ============================================================================
  // AGENT-CLIENT ASSIGNMENTS - Critical for scope enforcement
  // ============================================================================
  
  async getAgentAssignedClientIds(agentId: string): Promise<string[]> {
    const results = await mysqlDb
      .select({ clientId: agentAssignmentsTable.clientId })
      .from(agentAssignmentsTable)
      .where(and(
        eq(agentAssignmentsTable.agentId, agentId),
        eq(agentAssignmentsTable.isActive, true)
      ));
    return results.map(r => r.clientId);
  }

  async getAgentAssignments(agentId: string): Promise<AgentClientAssignment[]> {
    return await mysqlDb
      .select()
      .from(agentAssignmentsTable)
      .where(eq(agentAssignmentsTable.agentId, agentId));
  }

  async getClientAssignedAgents(clientId: string): Promise<AgentClientAssignment[]> {
    return await mysqlDb
      .select()
      .from(agentAssignmentsTable)
      .where(and(
        eq(agentAssignmentsTable.clientId, clientId),
        eq(agentAssignmentsTable.isActive, true)
      ));
  }

  async assignClientToAgent(agentId: string, clientId: string, assignedBy: string): Promise<AgentClientAssignment> {
    const id = randomUUID();
    await mysqlDb
      .insert(agentAssignmentsTable)
      .values({
        id,
        agentId,
        clientId,
        assignedBy,
        isActive: true,
        assignedAt: new Date()
      });
    const [result] = await mysqlDb
      .select()
      .from(agentAssignmentsTable)
      .where(eq(agentAssignmentsTable.id, id));
    return result;
  }

  async unassignClientFromAgent(agentId: string, clientId: string): Promise<boolean> {
    await mysqlDb
      .update(agentAssignmentsTable)
      .set({ isActive: false })
      .where(and(
        eq(agentAssignmentsTable.agentId, agentId),
        eq(agentAssignmentsTable.clientId, clientId)
      ));
    return true;
  }

  async reassignClient(clientId: string, fromAgentId: string, toAgentId: string, assignedBy: string): Promise<AgentClientAssignment> {
    await this.unassignClientFromAgent(fromAgentId, clientId);
    return await this.assignClientToAgent(toAgentId, clientId, assignedBy);
  }

  // ============================================================================
  // OFFICES - Tax Office tenant management
  // ============================================================================

  async getOffice(id: string): Promise<Office | undefined> {
    const [office] = await mysqlDb
      .select()
      .from(officesTable)
      .where(eq(officesTable.id, id));
    return office;
  }

  async getOffices(): Promise<Office[]> {
    return await mysqlDb
      .select()
      .from(officesTable)
      .orderBy(officesTable.name);
  }

  async createOffice(office: InsertOffice): Promise<Office> {
    const id = randomUUID();
    await mysqlDb
      .insert(officesTable)
      .values({
        id,
        ...office,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    const [result] = await mysqlDb
      .select()
      .from(officesTable)
      .where(eq(officesTable.id, id));
    return result;
  }

  async updateOffice(id: string, office: Partial<InsertOffice>): Promise<Office | undefined> {
    await mysqlDb
      .update(officesTable)
      .set({ ...office, updatedAt: new Date() })
      .where(eq(officesTable.id, id));
    return this.getOffice(id);
  }

  async getOfficeUsers(officeId: string): Promise<User[]> {
    return await mysqlDb
      .select()
      .from(usersTable)
      .where(eq(usersTable.officeId, officeId));
  }

  async getOfficeClients(officeId: string): Promise<User[]> {
    return await mysqlDb
      .select()
      .from(usersTable)
      .where(and(
        eq(usersTable.officeId, officeId),
        eq(usersTable.role, 'client')
      ));
  }

  async getOfficeAgents(officeId: string): Promise<User[]> {
    return await mysqlDb
      .select()
      .from(usersTable)
      .where(and(
        eq(usersTable.officeId, officeId),
        eq(usersTable.role, 'agent')
      ));
  }

  // ============================================================================
  // TICKET MESSAGES - Supports public and internal notes
  // ============================================================================

  async getTicketMessages(ticketId: string, includeInternal: boolean = false): Promise<TicketMessage[]> {
    if (includeInternal) {
      return await mysqlDb
        .select()
        .from(ticketMessagesTable)
        .where(eq(ticketMessagesTable.ticketId, ticketId))
        .orderBy(asc(ticketMessagesTable.createdAt));
    }
    return await mysqlDb
      .select()
      .from(ticketMessagesTable)
      .where(and(
        eq(ticketMessagesTable.ticketId, ticketId),
        eq(ticketMessagesTable.isInternal, false)
      ))
      .orderBy(asc(ticketMessagesTable.createdAt));
  }

  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    const id = randomUUID();
    await mysqlDb
      .insert(ticketMessagesTable)
      .values({
        id,
        ...message,
        createdAt: new Date()
      });
    const [result] = await mysqlDb
      .select()
      .from(ticketMessagesTable)
      .where(eq(ticketMessagesTable.id, id));
    return result;
  }

  // ============================================================================
  // AUDIT LOGS - Critical action tracking
  // ============================================================================

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    await mysqlDb
      .insert(auditLogsTable)
      .values({
        id,
        ...log,
        createdAt: new Date()
      });
    const [result] = await mysqlDb
      .select()
      .from(auditLogsTable)
      .where(eq(auditLogsTable.id, id));
    return result;
  }

  async getAuditLogs(options: {
    officeId?: string;
    userId?: string;
    action?: string;
    resourceType?: string;
    clientId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AuditLog[]> {
    const conditions = [];
    
    if (options.officeId) {
      conditions.push(eq(auditLogsTable.officeId, options.officeId));
    }
    if (options.userId) {
      conditions.push(eq(auditLogsTable.userId, options.userId));
    }
    if (options.action) {
      conditions.push(eq(auditLogsTable.action, options.action as any));
    }
    if (options.resourceType) {
      conditions.push(eq(auditLogsTable.resourceType, options.resourceType));
    }
    if (options.clientId) {
      conditions.push(eq(auditLogsTable.clientId, options.clientId));
    }
    
    let query = mysqlDb
      .select()
      .from(auditLogsTable)
      .orderBy(desc(auditLogsTable.createdAt));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    if (options.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
  }

  // ============================================================================
  // SCOPED QUERY HELPERS - Filter by agent assignments or office
  // ============================================================================

  async getClientsByScope(options: {
    agentClientIds?: string[];
    officeId?: string;
    isGlobal?: boolean;
  }): Promise<User[]> {
    if (options.isGlobal) {
      return await mysqlDb
        .select()
        .from(usersTable)
        .where(eq(usersTable.role, 'client'));
    }
    
    if (options.agentClientIds && options.agentClientIds.length > 0) {
      const [rows] = await mysqlPool.query(
        `SELECT * FROM users WHERE role = 'client' AND id IN (?)`,
        [options.agentClientIds]
      );
      return rows as User[];
    }
    
    if (options.officeId) {
      return await mysqlDb
        .select()
        .from(usersTable)
        .where(and(
          eq(usersTable.role, 'client'),
          eq(usersTable.officeId, options.officeId)
        ));
    }
    
    return [];
  }

  async getPaymentsByScope(options: {
    agentClientIds?: string[];
    officeId?: string;
    isGlobal?: boolean;
  }): Promise<Payment[]> {
    if (options.isGlobal) {
      return await mysqlDb
        .select()
        .from(paymentsTable)
        .orderBy(desc(paymentsTable.createdAt));
    }
    
    if (options.agentClientIds && options.agentClientIds.length > 0) {
      const [rows] = await mysqlPool.query(
        `SELECT * FROM payments WHERE client_id IN (?) ORDER BY created_at DESC`,
        [options.agentClientIds]
      );
      return rows as Payment[];
    }
    
    if (options.officeId) {
      return await mysqlDb
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.officeId, options.officeId))
        .orderBy(desc(paymentsTable.createdAt));
    }
    
    return [];
  }

  async getTicketsByScope(options: {
    agentClientIds?: string[];
    officeId?: string;
    isGlobal?: boolean;
    clientId?: string;
  }): Promise<Ticket[]> {
    const [rows] = await mysqlPool.query(
      `SELECT id, client_id as clientId, client_name as clientName, office_id as officeId,
       subject, description, category, priority, status, 
       assigned_to_id as assignedToId, assigned_to as assignedTo,
       internal_notes as internalNotes, resolved_at as resolvedAt,
       created_at as createdAt, updated_at as updatedAt
       FROM tickets ORDER BY created_at DESC`
    );
    let tickets = rows as Ticket[];
    
    if (options.clientId) {
      tickets = tickets.filter(t => t.clientId === options.clientId);
    }
    
    if (options.isGlobal) {
      return tickets;
    }
    
    if (options.agentClientIds && options.agentClientIds.length > 0) {
      return tickets.filter(t => t.clientId && options.agentClientIds!.includes(t.clientId));
    }
    
    if (options.officeId) {
      return tickets.filter(t => t.officeId === options.officeId);
    }
    
    return [];
  }

  // Approve payment (for Tax Office/Admin only)
  async approvePayment(paymentId: string, approvedById: string, approvedByName: string): Promise<Payment | undefined> {
    await mysqlDb
      .update(paymentsTable)
      .set({
        paymentStatus: 'pending',
        approvedById,
        approvedByName,
        approvedAt: new Date()
      })
      .where(eq(paymentsTable.id, paymentId));
    
    const [result] = await mysqlDb
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, paymentId));
    return result;
  }

  // Create payment request (for Agents - creates pending_approval status)
  async createPaymentRequest(payment: InsertPayment, requestedById: string, requestedByName: string): Promise<Payment> {
    const id = randomUUID();
    await mysqlDb
      .insert(paymentsTable)
      .values({
        id,
        ...payment,
        paymentStatus: 'pending_approval',
        requestedById,
        requestedByName,
        createdAt: new Date()
      });
    
    const [result] = await mysqlDb
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, id));
    return result;
  }

  // Office methods
  async getOffice(id: string): Promise<Office | undefined> {
    const [office] = await mysqlDb.select().from(officesTable).where(eq(officesTable.id, id));
    return office;
  }

  async getOfficeBySlug(slug: string): Promise<Office | undefined> {
    const [office] = await mysqlDb.select().from(officesTable).where(eq(officesTable.slug, slug));
    return office;
  }

  async getOffices(): Promise<Office[]> {
    return await mysqlDb.select().from(officesTable).orderBy(asc(officesTable.name));
  }

  async createOffice(office: InsertOffice): Promise<Office> {
    const id = randomUUID();
    await mysqlDb.insert(officesTable).values({ id, ...office });
    const [result] = await mysqlDb.select().from(officesTable).where(eq(officesTable.id, id));
    return result;
  }

  async updateOffice(id: string, office: Partial<InsertOffice>): Promise<Office | undefined> {
    await mysqlDb.update(officesTable).set(office).where(eq(officesTable.id, id));
    const [result] = await mysqlDb.select().from(officesTable).where(eq(officesTable.id, id));
    return result;
  }

  // Office Branding methods (White-labeling)
  async getOfficeBranding(officeId: string): Promise<OfficeBranding | undefined> {
    const [branding] = await mysqlDb.select().from(officeBrandingTable).where(eq(officeBrandingTable.officeId, officeId));
    return branding;
  }

  async createOfficeBranding(branding: InsertOfficeBranding): Promise<OfficeBranding> {
    const id = randomUUID();
    await mysqlDb.insert(officeBrandingTable).values({ id, ...branding });
    const [result] = await mysqlDb.select().from(officeBrandingTable).where(eq(officeBrandingTable.id, id));
    return result;
  }

  async updateOfficeBranding(officeId: string, branding: Partial<InsertOfficeBranding>): Promise<OfficeBranding | undefined> {
    await mysqlDb.update(officeBrandingTable).set({
      ...branding,
      updatedAt: new Date()
    }).where(eq(officeBrandingTable.officeId, officeId));
    const [result] = await mysqlDb.select().from(officeBrandingTable).where(eq(officeBrandingTable.officeId, officeId));
    return result;
  }

  async deleteOfficeBranding(officeId: string): Promise<boolean> {
    const result = await mysqlDb.delete(officeBrandingTable).where(eq(officeBrandingTable.officeId, officeId));
    return getAffectedRows(result) > 0;
  }

  // User theme preference
  async updateUserThemePreference(userId: string, theme: ThemePreference): Promise<User | undefined> {
    await mysqlDb.update(usersTable).set({ themePreference: theme }).where(eq(usersTable.id, userId));
    const [result] = await mysqlDb.select().from(usersTable).where(eq(usersTable.id, userId));
    return result;
  }
}

export const mysqlStorage = new MySQLStorage();
