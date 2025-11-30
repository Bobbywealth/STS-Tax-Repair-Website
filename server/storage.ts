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
} from "@shared/mysql-schema";

export interface IStorage {
  // Users (Replit Auth required)
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;

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
}

// MySQL storage connected to cPanel database
import { mysqlStorage } from "./mysql-storage";
export const storage: IStorage = mysqlStorage;
