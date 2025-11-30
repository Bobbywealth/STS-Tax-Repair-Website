import { 
  type User, 
  type UpsertUser,
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
  users as usersTable,
  taxDeadlines as taxDeadlinesTable,
  appointments as appointmentsTable,
  payments as paymentsTable,
  documentVersions as documentVersionsTable,
  eSignatures as eSignaturesTable,
  emailLogs as emailLogsTable,
  documentRequestTemplates as templatesTable
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

  async getUsers(): Promise<User[]> {
    return await mysqlDb.select().from(usersTable);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || randomUUID();
    const existing = await this.getUser(id);
    
    const userValues = {
      id,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
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
    await mysqlDb.update(eSignaturesTable).set(signature).where(eq(eSignaturesTable.id, id));
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
}

export const mysqlStorage = new MySQLStorage();
