import { useQuery } from "@tanstack/react-query";

interface PermissionsResponse {
  role: string;
  permissions: string[];
}

export function usePermissions() {
  const { data, isLoading, error } = useQuery<PermissionsResponse>({
    queryKey: ['/api/auth/permissions'],
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: true,
  });

  const hasPermission = (permission: string): boolean => {
    if (!data?.permissions) return false;
    // Admin and Super Admin always have all permissions
    if (data.role === 'admin' || data.role === 'super_admin') return true;
    return data.permissions.includes(permission);
  };

  const hasAnyPermission = (...permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (...permissions: string[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  return {
    permissions: data?.permissions || [],
    role: data?.role || 'client',
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

// Permission slugs for easy reference - must match DefaultPermissions in mysql-schema.ts
// IMPORTANT: Agent permissions are SCOPED to assigned clients only (enforced at API level)
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_STATS: 'dashboard.stats',
  
  // Clients (Agent: scoped to assigned clients only)
  CLIENTS_VIEW: 'clients.view',
  CLIENTS_VIEW_ALL: 'clients.view_all',
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_EDIT: 'clients.edit',
  CLIENTS_DELETE: 'clients.delete',
  CLIENTS_ASSIGN: 'clients.assign',
  
  // Leads (Agent: scoped to assigned leads only)
  LEADS_VIEW: 'leads.view',
  LEADS_CREATE: 'leads.create',
  LEADS_EDIT: 'leads.edit',
  LEADS_CONVERT: 'leads.convert',
  
  // Documents (Agent: scoped to assigned clients only)
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_UPLOAD: 'documents.upload',
  DOCUMENTS_DOWNLOAD: 'documents.download',
  DOCUMENTS_DELETE: 'documents.delete',
  DOCUMENTS_REQUEST: 'documents.request',
  
  // E-Signatures (Split: Client signs as client, Staff signs as preparer)
  SIGNATURES_VIEW: 'signatures.view',
  SIGNATURES_CREATE: 'signatures.create',
  SIGNATURES_SIGN_AS_CLIENT: 'signatures.sign_as_client',
  SIGNATURES_SIGN_AS_PREPARER: 'signatures.sign_as_preparer',
  SIGNATURES_DOWNLOAD_PDF: 'signatures.download_pdf',
  
  // Payments (Agent: READ-ONLY for assigned clients, request only - no create/approve)
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_REQUEST: 'payments.request',
  PAYMENTS_CREATE: 'payments.create',
  PAYMENTS_APPROVE: 'payments.approve',
  PAYMENTS_EDIT: 'payments.edit',
  PAYMENTS_DELETE: 'payments.delete',
  
  // Appointments
  APPOINTMENTS_VIEW: 'appointments.view',
  APPOINTMENTS_CREATE: 'appointments.create',
  APPOINTMENTS_EDIT: 'appointments.edit',
  APPOINTMENTS_DELETE: 'appointments.delete',
  
  // Tax Deadlines
  DEADLINES_VIEW: 'deadlines.view',
  DEADLINES_CREATE: 'deadlines.create',
  DEADLINES_EDIT: 'deadlines.edit',
  
  // Tasks (Agent: scoped to assigned tasks and clients)
  TASKS_VIEW: 'tasks.view',
  TASKS_CREATE: 'tasks.create',
  TASKS_EDIT: 'tasks.edit',
  TASKS_ASSIGN: 'tasks.assign',
  
  // Support (Agent: scoped to assigned clients' tickets)
  SUPPORT_VIEW: 'support.view',
  SUPPORT_CREATE: 'support.create',
  SUPPORT_RESPOND: 'support.respond',
  SUPPORT_CLOSE: 'support.close',
  SUPPORT_INTERNAL_NOTES: 'support.internal_notes',
  
  // Knowledge Base
  KNOWLEDGE_VIEW: 'knowledge.view',
  KNOWLEDGE_CREATE: 'knowledge.create',
  KNOWLEDGE_EDIT: 'knowledge.edit',
  
  // AI Assistant
  AI_ASSISTANT_ACCESS: 'ai.assistant_access',
  
  // Reports (Agent: scoped to assigned clients only, no export)
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  
  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  
  // Branding (Tax Office: white-label customization)
  BRANDING_MANAGE: 'branding.manage',
  BRANDING_PERSONAL_THEME: 'branding.personal_theme',
  
  // Agent Management (Tax Office: office-scoped)
  AGENTS_VIEW: 'agents.view',
  AGENTS_CREATE: 'agents.create',
  AGENTS_EDIT: 'agents.edit',
  AGENTS_DISABLE: 'agents.disable',
  
  // Admin (Tax Office has office-scoped access to audit and invites)
  ADMIN_USERS: 'admin.users',
  ADMIN_PERMISSIONS: 'admin.permissions',
  ADMIN_AUDIT: 'admin.audit',
  ADMIN_INVITES: 'admin.invites',
  ADMIN_SYSTEM: 'admin.system',
} as const;
