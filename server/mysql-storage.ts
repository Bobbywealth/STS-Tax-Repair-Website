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
  type RolePermission,
  type TaxFiling,
  type InsertTaxFiling,
  type FilingStatus,
  users as usersTable,
  taxDeadlines as taxDeadlinesTable,
  appointments as appointmentsTable,
  payments as paymentsTable,
  documentVersions as documentVersionsTable,
  eSignatures as eSignaturesTable,
  emailLogs as emailLogsTable,
  documentRequestTemplates as templatesTable,
  tasks as tasksTable,
  staffMembers as staffTable,
  roleAuditLog as roleAuditLogTable,
  staffInvites as staffInvitesTable,
  permissions as permissionsTable,
  rolePermissions as rolePermissionsTable,
  taxFilings as taxFilingsTable
} from "@shared/mysql-schema";
import { randomUUID } from "crypto";
import { mysqlDb } from "./mysql-db";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import type { IStorage } from "./storage";

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
    return (result as any).affectedRows > 0;
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
    return (result as any).affectedRows > 0;
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
    return (result as any).affectedRows > 0;
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
    return (result as any).affectedRows > 0;
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
    return (result as any).affectedRows > 0;
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
    return (result as any).affectedRows > 0;
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
    return (result as any).affectedRows > 0;
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
    return (result as any).affectedRows > 0;
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

  async useStaffInvite(inviteCode: string, userId: string): Promise<StaffInvite | undefined> {
    const invite = await this.getStaffInviteByCode(inviteCode);
    if (!invite) return undefined;
    
    if (invite.usedAt) {
      throw new Error("Invite has already been used");
    }
    
    if (new Date(invite.expiresAt) < new Date()) {
      throw new Error("Invite has expired");
    }

    await mysqlDb.update(staffInvitesTable)
      .set({ usedAt: new Date(), usedById: userId })
      .where(eq(staffInvitesTable.inviteCode, inviteCode));

    await mysqlDb.update(usersTable)
      .set({ role: invite.role, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));

    await this.createRoleAuditLog({
      userId,
      previousRole: 'client',
      newRole: invite.role,
      changedById: invite.invitedById,
      changedByName: invite.invitedByName,
      reason: `Staff invite redeemed (code: ${inviteCode.substring(0, 8)}...)`
    });

    const [updated] = await mysqlDb.select().from(staffInvitesTable).where(eq(staffInvitesTable.inviteCode, inviteCode));
    return updated;
  }

  async deleteStaffInvite(id: string): Promise<boolean> {
    const result = await mysqlDb.delete(staffInvitesTable).where(eq(staffInvitesTable.id, id));
    return (result as any).affectedRows > 0;
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
    const filingData = {
      id,
      clientId: filing.clientId,
      taxYear: filing.taxYear,
      status: filing.status ?? 'new' as FilingStatus,
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
      statusHistory: [{ status: filing.status ?? 'new', date: now.toISOString() }],
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

    await mysqlDb.update(taxFilingsTable)
      .set({ ...filing, updatedAt: new Date() })
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
}

export const mysqlStorage = new MySQLStorage();
