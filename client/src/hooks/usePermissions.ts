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
    // Admin always has all permissions
    if (data.role === 'admin') return true;
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
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_STATS: 'dashboard.stats',
  
  // Clients
  CLIENTS_VIEW: 'clients.view',
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_EDIT: 'clients.edit',
  CLIENTS_DELETE: 'clients.delete',
  
  // Leads
  LEADS_VIEW: 'leads.view',
  LEADS_CREATE: 'leads.create',
  LEADS_EDIT: 'leads.edit',
  LEADS_CONVERT: 'leads.convert',
  
  // Documents
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_UPLOAD: 'documents.upload',
  DOCUMENTS_DOWNLOAD: 'documents.download',
  DOCUMENTS_DELETE: 'documents.delete',
  DOCUMENTS_REQUEST: 'documents.request',
  
  // E-Signatures (matches DefaultPermissions: signatures.*)
  SIGNATURES_VIEW: 'signatures.view',
  SIGNATURES_CREATE: 'signatures.create',
  SIGNATURES_SIGN: 'signatures.sign',
  SIGNATURES_DOWNLOAD_PDF: 'signatures.download_pdf',
  
  // Payments
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_CREATE: 'payments.create',
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
  
  // Tasks
  TASKS_VIEW: 'tasks.view',
  TASKS_CREATE: 'tasks.create',
  TASKS_EDIT: 'tasks.edit',
  TASKS_ASSIGN: 'tasks.assign',
  
  // Support
  SUPPORT_VIEW: 'support.view',
  SUPPORT_CREATE: 'support.create',
  SUPPORT_RESPOND: 'support.respond',
  SUPPORT_CLOSE: 'support.close',
  
  // Knowledge Base
  KNOWLEDGE_VIEW: 'knowledge.view',
  KNOWLEDGE_CREATE: 'knowledge.create',
  KNOWLEDGE_EDIT: 'knowledge.edit',
  
  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  
  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
} as const;
