import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import type {
  Appointment,
  DocumentVersion,
  ESignature,
  EmailLog,
  EmailVerificationToken,
  InsertAppointment,
  InsertDocumentRequestTemplate,
  InsertDocumentVersion,
  InsertEmailLog,
  InsertEmailVerificationToken,
  InsertHomePageAgent,
  InsertKnowledgeBase,
  InsertLead,
  InsertNotification,
  InsertMarketingCampaign,
  MarketingCampaign,
  InsertNotificationPreferences,
  InsertOffice,
  InsertOfficeBranding,
  InsertPasswordResetToken,
  InsertPayment,
  InsertPermission,
  InsertRoleAuditLog,
  InsertRolePermission,
  InsertStaffInvite,
  InsertStaffMember,
  InsertTask,
  InsertTaxFiling,
  HomePageAgent,
  KnowledgeBase,
  Lead,
  LeadStatus,
  Notification,
  NotificationPreferences,
  Office,
  OfficeBranding,
  PasswordResetToken,
  Payment,
  Permission,
  RoleAuditLog,
  StaffInvite,
  StaffMember,
  Task,
  TaxFiling,
  ThemePreference,
  Ticket,
  UpsertUser,
  User,
  UserRole,
} from "@shared/mysql-schema";
import { DefaultPermissions } from "@shared/mysql-schema";

/**
 * In-memory storage for local development when DB is not configured.
 * Goal: allow logging in + rendering authenticated pages to verify layout.
 *
 * IMPORTANT: This is NOT for production use.
 */
export class MemoryStorage {
  private users = new Map<string, User>();
  private offices = new Map<string, Office>();
  private branding = new Map<string, OfficeBranding>();
  private emailVerificationTokens = new Map<string, EmailVerificationToken>();
  private passwordResetTokens = new Map<string, PasswordResetToken>();
  private roleOverrides = new Map<UserRole, Map<string, boolean>>(); // slug -> granted
  private homePageAgents = new Map<string, HomePageAgent>();

  constructor() {
    // By default, do NOT seed any demo data.
    // If you explicitly want demo data for local development, set: DEMO_MODE=true
    if (process.env.DEMO_MODE === "true") {
      void this.seed();
    }
  }

  // Account deletion (App Store 5.1.1(v))
  async deleteUserAccount(userId: string): Promise<void> {
    // Remove any stored tokens for the user
    for (const [token, value] of this.emailVerificationTokens.entries()) {
      if (value.userId === userId) this.emailVerificationTokens.delete(token);
    }
    for (const [token, value] of this.passwordResetTokens.entries()) {
      if (value.userId === userId) this.passwordResetTokens.delete(token);
    }

    // Scrub and deactivate (keep row so UI doesn't explode if something references it)
    const user = this.users.get(userId);
    if (!user) return;
    this.users.set(userId, {
      ...user,
      email: `deleted+${userId}@ststaxrepair.invalid`,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      country: null,
      phoneSecondary: null,
      dateOfBirth: null,
      occupation: null,
      ssn: null,
      irsUsernameEncrypted: null,
      irsPasswordEncrypted: null,
      directDepositBank: null,
      bankRoutingEncrypted: null,
      bankAccountEncrypted: null,
      referralSource: null,
      passwordHash: null,
      emailVerifiedAt: null,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  private async seed() {
    const officeId = randomUUID();
    const office: Office = {
      id: officeId,
      name: "Demo Tax Office",
      slug: "demo-office",
      address: "123 Demo St",
      city: "Demo City",
      state: "CA",
      zipCode: "90001",
      phone: "(555) 123-4567",
      email: "office@demo.local",
      defaultTaxYear: 2024,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.offices.set(officeId, office);

    const officeBranding: OfficeBranding = {
      id: randomUUID(),
      officeId,
      companyName: "Demo Tax Office",
      logoUrl: null,
      logoObjectKey: null,
      primaryColor: "#1a4d2e",
      secondaryColor: "#4CAF50",
      accentColor: "#22c55e",
      defaultTheme: "dark",
      replyToEmail: "support@demo.local",
      replyToName: "Demo Tax Office",
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.branding.set(officeId, officeBranding);

    const adminId = randomUUID();
    const clientId = randomUUID();
    const agentId = randomUUID();
    const taxOfficeId = randomUUID();

    const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
    const clientPasswordHash = await bcrypt.hash("Client123!", 10);
    const agentPasswordHash = await bcrypt.hash("Agent123!", 10);
    const taxOfficePasswordHash = await bcrypt.hash("Office123!", 10);

    const now = new Date();

    const admin: User = {
      id: adminId,
      email: "demo-admin@local.test",
      firstName: "Demo",
      lastName: "Admin",
      profileImageUrl: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      country: "United States",
      phoneSecondary: null,
      dateOfBirth: null,
      occupation: null,
      ssn: null,
      irsUsernameEncrypted: null,
      irsPasswordEncrypted: null,
      directDepositBank: null,
      bankRoutingEncrypted: null,
      bankAccountEncrypted: null,
      role: "admin",
      officeId: null,
      assignedTo: null,
      referralSource: null,
      themePreference: "system",
      isActive: true,
      passwordHash: adminPasswordHash,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const taxOffice: User = {
      id: taxOfficeId,
      email: "demo-office@local.test",
      firstName: "Demo",
      lastName: "Office",
      profileImageUrl: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      country: "United States",
      phoneSecondary: null,
      dateOfBirth: null,
      occupation: null,
      ssn: null,
      irsUsernameEncrypted: null,
      irsPasswordEncrypted: null,
      directDepositBank: null,
      bankRoutingEncrypted: null,
      bankAccountEncrypted: null,
      role: "tax_office",
      officeId,
      assignedTo: null,
      referralSource: null,
      themePreference: "system",
      isActive: true,
      passwordHash: taxOfficePasswordHash,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const agent: User = {
      id: agentId,
      email: "demo-agent@local.test",
      firstName: "Demo",
      lastName: "Agent",
      profileImageUrl: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      country: "United States",
      phoneSecondary: null,
      dateOfBirth: null,
      occupation: null,
      ssn: null,
      irsUsernameEncrypted: null,
      irsPasswordEncrypted: null,
      directDepositBank: null,
      bankRoutingEncrypted: null,
      bankAccountEncrypted: null,
      role: "agent",
      officeId,
      assignedTo: null,
      referralSource: null,
      themePreference: "system",
      isActive: true,
      passwordHash: agentPasswordHash,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const client: User = {
      id: clientId,
      email: "demo-client@local.test",
      firstName: "Demo",
      lastName: "Client",
      profileImageUrl: null,
      phone: "(555) 999-8888",
      address: "999 Client Rd",
      city: "Demo City",
      state: "CA",
      zipCode: "90002",
      country: "United States",
      phoneSecondary: null,
      dateOfBirth: "1990-01-01",
      occupation: "Freelancer",
      ssn: "000-00-0000",
      irsUsernameEncrypted: null,
      irsPasswordEncrypted: null,
      directDepositBank: "Demo Bank",
      bankRoutingEncrypted: null,
      bankAccountEncrypted: null,
      role: "client",
      officeId,
      assignedTo: agentId,
      referralSource: "demo-agent@local.test",
      themePreference: "system",
      isActive: true,
      passwordHash: clientPasswordHash,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(adminId, admin);
    this.users.set(taxOfficeId, taxOffice);
    this.users.set(agentId, agent);
    this.users.set(clientId, client);
  }

  // -------------------------
  // Users
  // -------------------------
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const needle = (email || "").toLowerCase().trim();
    for (const u of this.users.values()) {
      if ((u.email || "").toLowerCase().trim() === needle) return u;
    }
    return undefined;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const id = user.id || randomUUID();
    const existing = this.users.get(id);
    const now = new Date();
    const merged: User = {
      ...(existing as any),
      ...user,
      id,
      role: (user.role || existing?.role || "client") as any,
      isActive: user.isActive ?? existing?.isActive ?? true,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    } as any;
    this.users.set(id, merged);
    return merged;
  }

  async updateUserRole(userId: string, newRole: UserRole): Promise<User | undefined> {
    const u = this.users.get(userId);
    if (!u) return undefined;
    const updated = { ...u, role: newRole, updatedAt: new Date() } as User;
    this.users.set(userId, updated);
    return updated;
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined> {
    const u = this.users.get(userId);
    if (!u) return undefined;
    const updated = { ...u, isActive, updatedAt: new Date() } as User;
    this.users.set(userId, updated);
    return updated;
  }

  async updateUser(userId: string, data: any): Promise<User | undefined> {
    const u = this.users.get(userId);
    if (!u) return undefined;
    const updated = { ...u, ...data, updatedAt: new Date() } as User;
    this.users.set(userId, updated);
    return updated;
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return (await this.getUsers()).filter((u) => (u.role || "client") === role);
  }

  async getAdminUsers(): Promise<User[]> {
    return (await this.getUsers()).filter(
      (u) => ((u.role || "client") === "admin" || (u.role || "client") === "super_admin") && u.isActive,
    );
  }

  async getStaffUsers(): Promise<User[]> {
    return (await this.getUsers()).filter((u) => (u.role || "client") !== "client");
  }

  // -------------------------
  // Permissions
  // -------------------------
  async getPermissions(): Promise<Permission[]> {
    const now = new Date();
    return DefaultPermissions.map((p, idx) => ({
      id: `demo-perm-${idx}`,
      slug: p.slug,
      label: p.label,
      description: p.description,
      featureGroup: p.featureGroup,
      sortOrder: idx,
      createdAt: now,
    })) as any;
  }

  async getPermissionsByGroup(): Promise<Record<string, Permission[]>> {
    const perms = await this.getPermissions();
    return perms.reduce((acc, p) => {
      const g = (p.featureGroup || "other") as string;
      acc[g] = acc[g] || [];
      acc[g].push(p);
      return acc;
    }, {} as Record<string, Permission[]>);
  }

  private getDefaultRoleSlugs(role: UserRole): string[] {
    return DefaultPermissions.filter((p) => p.defaultRoles.includes(role)).map((p) => p.slug);
  }

  async getRolePermissions(role: UserRole): Promise<string[]> {
    const base = new Set(this.getDefaultRoleSlugs(role));
    const overrides = this.roleOverrides.get(role);
    if (overrides) {
      for (const [slug, granted] of overrides.entries()) {
        if (granted) base.add(slug);
        else base.delete(slug);
      }
    }
    return Array.from(base);
  }

  async getAllRolePermissions(): Promise<Record<UserRole, string[]>> {
    const roles: UserRole[] = ["client", "agent", "tax_office", "admin", "super_admin"];
    const out = {} as Record<UserRole, string[]>;
    for (const r of roles) out[r] = await this.getRolePermissions(r);
    return out;
  }

  async hasPermission(role: UserRole, permissionSlug: string): Promise<boolean> {
    if (role === "admin" || role === "super_admin") return true;
    const perms = await this.getRolePermissions(role);
    return perms.includes(permissionSlug);
  }

  async setRolePermission(role: UserRole, permissionSlug: string, granted: boolean): Promise<void> {
    const map = this.roleOverrides.get(role) || new Map<string, boolean>();
    map.set(permissionSlug, granted);
    this.roleOverrides.set(role, map);
  }

  async updateRolePermissions(role: UserRole, permissions: Record<string, boolean>): Promise<void> {
    for (const [slug, granted] of Object.entries(permissions || {})) {
      await this.setRolePermission(role, slug, !!granted);
    }
  }

  async getRolePermissionMatrix(): Promise<{ permissions: Permission[]; matrix: Record<UserRole, Record<string, boolean>>; }> {
    const perms = await this.getPermissions();
    const roles: UserRole[] = ["client", "agent", "tax_office", "admin", "super_admin"];
    const matrix = {} as Record<UserRole, Record<string, boolean>>;
    for (const r of roles) {
      const slugs = new Set(await this.getRolePermissions(r));
      matrix[r] = {};
      for (const p of perms) matrix[r][p.slug] = slugs.has(p.slug);
    }
    return { permissions: perms, matrix };
  }

  // -------------------------
  // Offices / Branding
  // -------------------------
  async getOffice(id: string): Promise<Office | undefined> {
    return this.offices.get(id);
  }

  async getOfficeBySlug(slug: string): Promise<Office | undefined> {
    const needle = (slug || "").toLowerCase().trim();
    for (const o of this.offices.values()) {
      if ((o.slug || "").toLowerCase().trim() === needle) return o;
    }
    return undefined;
  }

  async getOffices(): Promise<Office[]> {
    return Array.from(this.offices.values());
  }

  async createOffice(office: InsertOffice): Promise<Office> {
    const now = new Date();
    const o: Office = {
      id: randomUUID(),
      name: office.name,
      slug: office.slug || null,
      address: (office as any).address || null,
      city: (office as any).city || null,
      state: (office as any).state || null,
      zipCode: (office as any).zipCode || null,
      phone: (office as any).phone || null,
      email: (office as any).email || null,
      defaultTaxYear: (office as any).defaultTaxYear || 2024,
      isActive: (office as any).isActive ?? true,
      createdAt: now,
      updatedAt: now,
    } as any;
    this.offices.set(o.id, o);
    return o;
  }

  async updateOffice(id: string, office: Partial<InsertOffice>): Promise<Office | undefined> {
    const o = this.offices.get(id);
    if (!o) return undefined;
    const updated = { ...o, ...office, updatedAt: new Date() } as Office;
    this.offices.set(id, updated);
    return updated;
  }

  async getOfficeBranding(officeId: string): Promise<OfficeBranding | undefined> {
    return this.branding.get(officeId);
  }

  async createOfficeBranding(branding: InsertOfficeBranding): Promise<OfficeBranding> {
    const now = new Date();
    const b: OfficeBranding = {
      id: randomUUID(),
      officeId: branding.officeId,
      companyName: branding.companyName || null,
      logoUrl: branding.logoUrl || null,
      logoObjectKey: (branding as any).logoObjectKey || null,
      primaryColor: branding.primaryColor || "#1a4d2e",
      secondaryColor: branding.secondaryColor || "#4CAF50",
      accentColor: branding.accentColor || "#22c55e",
      defaultTheme: (branding.defaultTheme || "light") as any,
      replyToEmail: branding.replyToEmail || null,
      replyToName: branding.replyToName || null,
      updatedByUserId: branding.updatedByUserId || null,
      createdAt: now,
      updatedAt: now,
    } as any;
    this.branding.set(b.officeId, b);
    return b;
  }

  async updateOfficeBranding(officeId: string, branding: Partial<InsertOfficeBranding>): Promise<OfficeBranding | undefined> {
    const existing = this.branding.get(officeId);
    if (!existing) return undefined;
    const updated = { ...existing, ...branding, updatedAt: new Date() } as OfficeBranding;
    this.branding.set(officeId, updated);
    return updated;
  }

  async deleteOfficeBranding(officeId: string): Promise<boolean> {
    return this.branding.delete(officeId);
  }

  // -------------------------
  // Email verification / password reset (minimal)
  // -------------------------
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const t: PasswordResetToken = {
      id: randomUUID(),
      userId,
      token,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    } as any;
    this.passwordResetTokens.set(token, t);
    return t;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const t = this.passwordResetTokens.get(token);
    if (!t) return undefined;
    if (t.usedAt) return t;
    if (t.expiresAt && new Date(t.expiresAt).getTime() < Date.now()) return t;
    return t;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    const t = this.passwordResetTokens.get(token);
    if (!t) return;
    this.passwordResetTokens.set(token, { ...t, usedAt: new Date() } as any);
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    const now = Date.now();
    for (const [k, v] of this.passwordResetTokens.entries()) {
      const exp = new Date(v.expiresAt as any).getTime();
      if (exp && exp < now) this.passwordResetTokens.delete(k);
    }
  }

  async createEmailVerificationToken(userId: string, email: string, token: string, expiresAt: Date): Promise<EmailVerificationToken> {
    const t: EmailVerificationToken = {
      id: randomUUID(),
      userId,
      email,
      token,
      expiresAt,
      usedAt: null,
      resendCount: 0,
      createdAt: new Date(),
    } as any;
    this.emailVerificationTokens.set(token, t);
    return t;
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    return this.emailVerificationTokens.get(token);
  }

  async getEmailVerificationTokenByUserId(userId: string): Promise<EmailVerificationToken | undefined> {
    for (const t of this.emailVerificationTokens.values()) {
      if (t.userId === userId && !t.usedAt) return t;
    }
    return undefined;
  }

  async markEmailVerificationTokenUsed(token: string): Promise<void> {
    const t = this.emailVerificationTokens.get(token);
    if (!t) return;
    this.emailVerificationTokens.set(token, { ...t, usedAt: new Date() } as any);
  }

  async incrementEmailVerificationResendCount(token: string): Promise<void> {
    const t = this.emailVerificationTokens.get(token);
    if (!t) return;
    this.emailVerificationTokens.set(token, { ...t, resendCount: (t.resendCount || 0) + 1 } as any);
  }

  async deleteExpiredEmailVerificationTokens(): Promise<void> {
    const now = Date.now();
    for (const [k, v] of this.emailVerificationTokens.entries()) {
      const exp = new Date(v.expiresAt as any).getTime();
      if (exp && exp < now) this.emailVerificationTokens.delete(k);
    }
  }

  async markUserEmailVerified(userId: string): Promise<void> {
    const u = this.users.get(userId);
    if (!u) return;
    this.users.set(userId, { ...u, emailVerifiedAt: new Date(), updatedAt: new Date() } as any);
  }

  // -------------------------
  // Theme preference
  // -------------------------
  async updateUserThemePreference(userId: string, theme: ThemePreference): Promise<User | undefined> {
    const u = this.users.get(userId);
    if (!u) return undefined;
    const updated = { ...u, themePreference: theme, updatedAt: new Date() } as User;
    this.users.set(userId, updated);
    return updated;
  }

  // -------------------------
  // Everything below: layout-only defaults
  // -------------------------

  async getAppointments(): Promise<Appointment[]> { return []; }
  async getAppointment(): Promise<Appointment | undefined> { return undefined; }
  async getAppointmentsByClient(): Promise<Appointment[]> { return []; }
  async getAppointmentsByDateRange(): Promise<Appointment[]> { return []; }
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const now = new Date();
    return { ...(appointment as any), id: randomUUID(), createdAt: now } as any;
  }
  async updateAppointment(): Promise<Appointment | undefined> { return undefined; }
  async deleteAppointment(): Promise<boolean> { return false; }

  async getPayments(): Promise<Payment[]> { return []; }
  async getPaymentsByClient(): Promise<Payment[]> { return []; }
  async createPayment(payment: InsertPayment): Promise<Payment> { return { ...(payment as any), id: randomUUID() } as any; }
  async updatePayment(): Promise<Payment | undefined> { return undefined; }
  async deletePayment(): Promise<boolean> { return false; }

  async getDocumentVersions(): Promise<DocumentVersion[]> { return []; }
  async getDocumentVersion(): Promise<DocumentVersion | undefined> { return undefined; }
  async getDocumentVersionsByType(): Promise<DocumentVersion[]> { return []; }
  async getAllDocuments(): Promise<DocumentVersion[]> { return []; }
  async createDocumentVersion(document: InsertDocumentVersion): Promise<DocumentVersion> { return { ...(document as any), id: randomUUID() } as any; }
  async deleteDocumentVersion(): Promise<boolean> { return false; }

  async getESignatures(): Promise<ESignature[]> { return []; }
  async getESignaturesByClient(): Promise<ESignature[]> { return []; }
  async getESignature(): Promise<ESignature | undefined> { return undefined; }
  async createESignature(signature: any): Promise<ESignature> { return { ...(signature as any), id: randomUUID() } as any; }
  async updateESignature(): Promise<ESignature | undefined> { return undefined; }
  async deleteESignature(): Promise<boolean> { return false; }

  async getEmailLogs(): Promise<EmailLog[]> { return []; }
  async getEmailLogsByClient(): Promise<EmailLog[]> { return []; }
  async createEmailLog(email: InsertEmailLog): Promise<EmailLog> { return { ...(email as any), id: randomUUID() } as any; }

  async getDocumentRequestTemplates(): Promise<any[]> { return []; }
  async createDocumentRequestTemplate(template: InsertDocumentRequestTemplate): Promise<any> { return { ...(template as any), id: randomUUID() } as any; }
  async updateDocumentRequestTemplate(): Promise<any | undefined> { return undefined; }
  async deleteDocumentRequestTemplate(): Promise<boolean> { return false; }

  async getTasks(): Promise<Task[]> { return []; }
  async getTasksByAssignee(): Promise<Task[]> { return []; }
  async getTasksByStatus(): Promise<Task[]> { return []; }
  async createTask(task: InsertTask): Promise<Task> { return { ...(task as any), id: randomUUID() } as any; }
  async updateTask(): Promise<Task | undefined> { return undefined; }
  async deleteTask(): Promise<boolean> { return false; }

  async getLeads(): Promise<Lead[]> { return []; }
  async getLeadsByStatus(): Promise<Lead[]> { return []; }
  async getLeadsByAssignee(): Promise<Lead[]> { return []; }
  async getLead(): Promise<Lead | undefined> { return undefined; }
  async createLead(lead: InsertLead): Promise<Lead> { return { ...(lead as any), id: randomUUID(), status: (lead as any).status as LeadStatus } as any; }
  async updateLead(): Promise<Lead | undefined> { return undefined; }
  async deleteLead(): Promise<boolean> { return false; }
  async convertLeadToClient(): Promise<Lead | undefined> { return undefined; }

  async getStaffMembers(): Promise<StaffMember[]> { return []; }
  async getStaffMember(): Promise<StaffMember | undefined> { return undefined; }
  async createStaffMember(member: InsertStaffMember): Promise<StaffMember> { return { ...(member as any), id: randomUUID() } as any; }
  async updateStaffMember(): Promise<StaffMember | undefined> { return undefined; }
  async deleteStaffMember(): Promise<boolean> { return false; }

  async getRoleAuditLogs(): Promise<RoleAuditLog[]> { return []; }
  async getRoleAuditLogsByUser(): Promise<RoleAuditLog[]> { return []; }
  async createRoleAuditLog(log: InsertRoleAuditLog): Promise<RoleAuditLog> { return { ...(log as any), id: randomUUID() } as any; }

  async getStaffInvites(): Promise<StaffInvite[]> { return []; }
  async getStaffInviteByCode(): Promise<StaffInvite | undefined> { return undefined; }
  async createStaffInvite(invite: InsertStaffInvite): Promise<StaffInvite> { return { ...(invite as any), id: randomUUID() } as any; }
  async useStaffInvite(): Promise<StaffInvite | undefined> { return undefined; }
  async markStaffInviteUsed(): Promise<boolean> { return false; }
  async deleteStaffInvite(): Promise<boolean> { return false; }

  async getTaxFilings(): Promise<TaxFiling[]> { return []; }
  async getTaxFilingsByYear(): Promise<TaxFiling[]> { return []; }
  async getTaxFilingsByClient(): Promise<TaxFiling[]> { return []; }
  async getTaxFilingByClientYear(): Promise<TaxFiling | undefined> { return undefined; }
  async getTaxFilingsByStatus(): Promise<TaxFiling[]> { return []; }
  async getTaxFilingsByYearAndStatus(): Promise<TaxFiling[]> { return []; }
  async createTaxFiling(filing: InsertTaxFiling): Promise<TaxFiling> { return { ...(filing as any), id: randomUUID() } as any; }
  async updateTaxFiling(): Promise<TaxFiling | undefined> { return undefined; }
  async updateTaxFilingStatus(): Promise<TaxFiling | undefined> { return undefined; }
  async deleteTaxFiling(): Promise<boolean> { return false; }
  async getTaxFilingMetrics(): Promise<any> {
    return { total: 0, byStatus: {}, totalEstimatedRefund: 0, totalActualRefund: 0 };
  }

  async getTickets(): Promise<Ticket[]> { return []; }
  async getTicketsByClient(): Promise<Ticket[]> { return []; }
  async getTicketsByAssignee(): Promise<Ticket[]> { return []; }
  async getTicket(): Promise<Ticket | undefined> { return undefined; }
  async createTicket(ticket: any): Promise<Ticket> { return { ...(ticket as any), id: randomUUID() } as any; }
  async updateTicket(): Promise<Ticket | undefined> { return undefined; }
  async deleteTicket(): Promise<boolean> { return false; }

  async getKnowledgeBaseArticles(): Promise<KnowledgeBase[]> { return []; }
  async getKnowledgeBaseByCategory(): Promise<KnowledgeBase[]> { return []; }
  async getKnowledgeBaseArticle(): Promise<KnowledgeBase | undefined> { return undefined; }
  async createKnowledgeBaseArticle(article: InsertKnowledgeBase): Promise<KnowledgeBase> { return { ...(article as any), id: randomUUID() } as any; }
  async updateKnowledgeBaseArticle(): Promise<KnowledgeBase | undefined> { return undefined; }
  async deleteKnowledgeBaseArticle(): Promise<boolean> { return false; }

  async getNotificationPreferences(): Promise<NotificationPreferences | undefined> { return undefined; }
  async upsertNotificationPreferences(prefs: InsertNotificationPreferences): Promise<NotificationPreferences> { return { ...(prefs as any), id: randomUUID() } as any; }
  async createNotification(notification: InsertNotification): Promise<Notification> { return { ...(notification as any), id: randomUUID() } as any; }

  // Agent scopes (used by authorization)
  async getAgentAssignedClientIds(): Promise<string[]> {
    return [];
  }

  // ============================================================================
  // Homepage Agents (public agents on homepage)
  // ============================================================================

  async getHomePageAgents(): Promise<HomePageAgent[]> {
    return Array.from(this.homePageAgents.values())
      .filter((a) => a.isActive !== false)
      .sort((a, b) => {
        const ao = a.sortOrder ?? 0;
        const bo = b.sortOrder ?? 0;
        if (ao !== bo) return ao - bo;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }

  async getHomePageAgentById(id: string): Promise<HomePageAgent | null> {
    return this.homePageAgents.get(id) || null;
  }

  async createHomePageAgent(data: InsertHomePageAgent): Promise<HomePageAgent> {
    const id = randomUUID();
    const now = new Date();

    const maxOrder =
      Math.max(
        -1,
        ...Array.from(this.homePageAgents.values()).map((a) => a.sortOrder ?? 0),
      ) + 1;

    const agent: HomePageAgent = {
      id,
      name: data.name,
      title: data.title,
      phone: data.phone,
      email: data.email,
      address: data.address ?? null,
      imageUrl: (data as any).imageUrl ?? null,
      rating: (data as any).rating ?? 5,
      sortOrder: (data as any).sortOrder ?? maxOrder,
      isActive: (data as any).isActive ?? true,
      createdAt: now,
      updatedAt: now,
    } as any;

    this.homePageAgents.set(id, agent);
    return agent;
  }

  async updateHomePageAgent(
    id: string,
    data: Partial<InsertHomePageAgent>,
  ): Promise<HomePageAgent | null> {
    const existing = this.homePageAgents.get(id);
    if (!existing) return null;

    const updated: HomePageAgent = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    } as any;

    this.homePageAgents.set(id, updated);
    return updated;
  }

  async deleteHomePageAgent(id: string): Promise<boolean> {
    return this.homePageAgents.delete(id);
  }

  async reorderHomePageAgents(agentIds: string[]): Promise<void> {
    const now = new Date();
    for (let i = 0; i < agentIds.length; i++) {
      const id = agentIds[i];
      const existing = this.homePageAgents.get(id);
      if (!existing) continue;
      this.homePageAgents.set(id, {
        ...existing,
        sortOrder: i,
        updatedAt: now,
      });
    }
  }

  // Methods not required for demo but referenced by types in some modules
  async createPermission(_: InsertPermission): Promise<Permission> { throw new Error("Not supported"); }
  async createRolePermission(_: InsertRolePermission): Promise<any> { throw new Error("Not supported"); }

  // Marketing Campaigns
  async getMarketingCampaigns(): Promise<MarketingCampaign[]> { return []; }
  async createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign> {
    return { ...campaign, id: randomUUID(), createdAt: new Date() } as any;
  }
  async getMarketingStats(): Promise<any> {
    return { totalSent: 0, emailSent: 0, smsSent: 0, errorCount: 0 };
  }
}

