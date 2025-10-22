import { 
  type User, 
  type InsertUser,
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
  type InsertDocumentRequestTemplate
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
  createDocumentVersion(document: InsertDocumentVersion): Promise<DocumentVersion>;
  deleteDocumentVersion(id: string): Promise<boolean>;

  // E-Signatures
  getESignatures(): Promise<ESignature[]>;
  getESignaturesByClient(clientId: string): Promise<ESignature[]>;
  getESignature(id: string): Promise<ESignature | undefined>;
  createESignature(signature: InsertESignature): Promise<ESignature>;
  updateESignature(id: string, signature: Partial<InsertESignature>): Promise<ESignature | undefined>;

  // Email Logs
  getEmailLogs(): Promise<EmailLog[]>;
  getEmailLogsByClient(clientId: string): Promise<EmailLog[]>;
  createEmailLog(email: InsertEmailLog): Promise<EmailLog>;

  // Document Request Templates
  getDocumentRequestTemplates(): Promise<DocumentRequestTemplate[]>;
  createDocumentRequestTemplate(template: InsertDocumentRequestTemplate): Promise<DocumentRequestTemplate>;
  updateDocumentRequestTemplate(id: string, template: Partial<InsertDocumentRequestTemplate>): Promise<DocumentRequestTemplate | undefined>;
  deleteDocumentRequestTemplate(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private taxDeadlines: Map<string, TaxDeadline>;
  private appointments: Map<string, Appointment>;
  private payments: Map<string, Payment>;
  private documentVersions: Map<string, DocumentVersion>;
  private eSignatures: Map<string, ESignature>;
  private emailLogs: Map<string, EmailLog>;
  private documentRequestTemplates: Map<string, DocumentRequestTemplate>;

  constructor() {
    this.users = new Map();
    this.taxDeadlines = new Map();
    this.appointments = new Map();
    this.payments = new Map();
    this.documentVersions = new Map();
    this.eSignatures = new Map();
    this.emailLogs = new Map();
    this.documentRequestTemplates = new Map();
    
    // Seed some IRS tax deadlines
    this.seedTaxDeadlines();
  }

  private seedTaxDeadlines() {
    const currentYear = new Date().getFullYear();
    const deadlines: InsertTaxDeadline[] = [
      {
        title: "Individual Tax Return Deadline",
        description: "Federal income tax return filing deadline for individuals (Form 1040)",
        deadlineDate: new Date(currentYear, 3, 15), // April 15
        deadlineType: "filing",
        taxYear: currentYear - 1,
        isRecurring: true,
        notifyDaysBefore: 30,
      },
      {
        title: "Extension Deadline",
        description: "Extended filing deadline for individuals who filed Form 4868",
        deadlineDate: new Date(currentYear, 9, 15), // October 15
        deadlineType: "extension",
        taxYear: currentYear - 1,
        isRecurring: true,
        notifyDaysBefore: 14,
      },
      {
        title: "Q1 Estimated Tax Payment",
        description: "First quarter estimated tax payment deadline",
        deadlineDate: new Date(currentYear, 3, 15), // April 15
        deadlineType: "quarterly",
        taxYear: currentYear,
        isRecurring: true,
        notifyDaysBefore: 7,
      },
      {
        title: "Q2 Estimated Tax Payment",
        description: "Second quarter estimated tax payment deadline",
        deadlineDate: new Date(currentYear, 5, 15), // June 15
        deadlineType: "quarterly",
        taxYear: currentYear,
        isRecurring: true,
        notifyDaysBefore: 7,
      },
      {
        title: "Q3 Estimated Tax Payment",
        description: "Third quarter estimated tax payment deadline",
        deadlineDate: new Date(currentYear, 8, 15), // September 15
        deadlineType: "quarterly",
        taxYear: currentYear,
        isRecurring: true,
        notifyDaysBefore: 7,
      },
      {
        title: "Q4 Estimated Tax Payment",
        description: "Fourth quarter estimated tax payment deadline",
        deadlineDate: new Date(currentYear + 1, 0, 15), // January 15 next year
        deadlineType: "quarterly",
        taxYear: currentYear,
        isRecurring: true,
        notifyDaysBefore: 7,
      },
    ];

    deadlines.forEach(deadline => {
      const id = randomUUID();
      const newDeadline: TaxDeadline = {
        ...deadline,
        id,
        description: deadline.description ?? null,
        isRecurring: deadline.isRecurring ?? null,
        notifyDaysBefore: deadline.notifyDaysBefore ?? null,
        createdAt: new Date()
      };
      this.taxDeadlines.set(id, newDeadline);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Tax Deadlines
  async getTaxDeadlines(): Promise<TaxDeadline[]> {
    return Array.from(this.taxDeadlines.values()).sort(
      (a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime()
    );
  }

  async getTaxDeadlinesByYear(year: number): Promise<TaxDeadline[]> {
    return Array.from(this.taxDeadlines.values())
      .filter(d => d.taxYear === year)
      .sort((a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime());
  }

  async createTaxDeadline(deadline: InsertTaxDeadline): Promise<TaxDeadline> {
    const id = randomUUID();
    const newDeadline: TaxDeadline = {
      ...deadline,
      id,
      description: deadline.description ?? null,
      isRecurring: deadline.isRecurring ?? null,
      notifyDaysBefore: deadline.notifyDaysBefore ?? null,
      createdAt: new Date()
    };
    this.taxDeadlines.set(id, newDeadline);
    return newDeadline;
  }

  async updateTaxDeadline(id: string, deadline: Partial<InsertTaxDeadline>): Promise<TaxDeadline | undefined> {
    const existing = this.taxDeadlines.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...deadline };
    this.taxDeadlines.set(id, updated);
    return updated;
  }

  async deleteTaxDeadline(id: string): Promise<boolean> {
    return this.taxDeadlines.delete(id);
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).sort(
      (a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()
    );
  }

  async getAppointmentsByClient(clientId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(a => a.clientId === clientId)
      .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime());
  }

  async getAppointmentsByDateRange(start: Date, end: Date): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(a => a.appointmentDate >= start && a.appointmentDate <= end)
      .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime());
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const newAppointment: Appointment = {
      ...appointment,
      id,
      description: appointment.description ?? null,
      duration: appointment.duration ?? null,
      status: appointment.status ?? null,
      location: appointment.location ?? null,
      staffId: appointment.staffId ?? null,
      staffName: appointment.staffName ?? null,
      notes: appointment.notes ?? null,
      createdAt: new Date()
    };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const existing = this.appointments.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...appointment };
    this.appointments.set(id, updated);
    return updated;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getPaymentsByClient(clientId: string): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(p => p.clientId === clientId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const newPayment: Payment = {
      ...payment,
      id,
      amountPaid: payment.amountPaid ?? null,
      paymentStatus: payment.paymentStatus ?? null,
      dueDate: payment.dueDate ?? null,
      paidDate: payment.paidDate ?? null,
      paymentMethod: payment.paymentMethod ?? null,
      notes: payment.notes ?? null,
      createdAt: new Date()
    };
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const existing = this.payments.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...payment };
    this.payments.set(id, updated);
    return updated;
  }

  async deletePayment(id: string): Promise<boolean> {
    return this.payments.delete(id);
  }

  // Document Versions
  async getDocumentVersions(clientId: string): Promise<DocumentVersion[]> {
    return Array.from(this.documentVersions.values())
      .filter(d => d.clientId === clientId)
      .sort((a, b) => (b.uploadedAt?.getTime() || 0) - (a.uploadedAt?.getTime() || 0));
  }

  async getDocumentVersionsByType(clientId: string, documentType: string): Promise<DocumentVersion[]> {
    return Array.from(this.documentVersions.values())
      .filter(d => d.clientId === clientId && d.documentType === documentType)
      .sort((a, b) => (a.version || 0) - (b.version || 0));
  }

  async createDocumentVersion(document: InsertDocumentVersion): Promise<DocumentVersion> {
    const id = randomUUID();
    const newDocument: DocumentVersion = {
      ...document,
      id,
      version: document.version ?? null,
      fileSize: document.fileSize ?? null,
      mimeType: document.mimeType ?? null,
      notes: document.notes ?? null,
      uploadedAt: new Date()
    };
    this.documentVersions.set(id, newDocument);
    return newDocument;
  }

  async deleteDocumentVersion(id: string): Promise<boolean> {
    return this.documentVersions.delete(id);
  }

  // E-Signatures
  async getESignatures(): Promise<ESignature[]> {
    return Array.from(this.eSignatures.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getESignaturesByClient(clientId: string): Promise<ESignature[]> {
    return Array.from(this.eSignatures.values())
      .filter(s => s.clientId === clientId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getESignature(id: string): Promise<ESignature | undefined> {
    return this.eSignatures.get(id);
  }

  async createESignature(signature: InsertESignature): Promise<ESignature> {
    const id = randomUUID();
    const newSignature: ESignature = {
      ...signature,
      id,
      documentType: signature.documentType ?? null,
      signatureData: signature.signatureData ?? null,
      ipAddress: signature.ipAddress ?? null,
      userAgent: signature.userAgent ?? null,
      signedAt: signature.signedAt ?? null,
      status: signature.status ?? null,
      documentUrl: signature.documentUrl ?? null,
      createdAt: new Date()
    };
    this.eSignatures.set(id, newSignature);
    return newSignature;
  }

  async updateESignature(id: string, signature: Partial<InsertESignature>): Promise<ESignature | undefined> {
    const existing = this.eSignatures.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...signature };
    this.eSignatures.set(id, updated);
    return updated;
  }

  // Email Logs
  async getEmailLogs(): Promise<EmailLog[]> {
    return Array.from(this.emailLogs.values()).sort(
      (a, b) => (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0)
    );
  }

  async getEmailLogsByClient(clientId: string): Promise<EmailLog[]> {
    return Array.from(this.emailLogs.values())
      .filter(e => e.clientId === clientId)
      .sort((a, b) => (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0));
  }

  async createEmailLog(email: InsertEmailLog): Promise<EmailLog> {
    const id = randomUUID();
    const newEmail: EmailLog = {
      ...email,
      id,
      clientId: email.clientId ?? null,
      emailType: email.emailType ?? null,
      status: email.status ?? null,
      sentAt: new Date()
    };
    this.emailLogs.set(id, newEmail);
    return newEmail;
  }

  // Document Request Templates
  async getDocumentRequestTemplates(): Promise<DocumentRequestTemplate[]> {
    return Array.from(this.documentRequestTemplates.values())
      .filter(t => t.isActive)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  async createDocumentRequestTemplate(template: InsertDocumentRequestTemplate): Promise<DocumentRequestTemplate> {
    const id = randomUUID();
    const newTemplate: DocumentRequestTemplate = {
      ...template,
      id,
      documentTypes: template.documentTypes ?? null,
      isActive: template.isActive ?? null,
      createdAt: new Date()
    };
    this.documentRequestTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateDocumentRequestTemplate(id: string, template: Partial<InsertDocumentRequestTemplate>): Promise<DocumentRequestTemplate | undefined> {
    const existing = this.documentRequestTemplates.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...template };
    this.documentRequestTemplates.set(id, updated);
    return updated;
  }

  async deleteDocumentRequestTemplate(id: string): Promise<boolean> {
    return this.documentRequestTemplates.delete(id);
  }
}

export const storage = new MemStorage();
