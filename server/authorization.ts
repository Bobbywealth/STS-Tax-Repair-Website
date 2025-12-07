import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "@shared/mysql-schema";
import { mysqlStorage } from "./mysql-storage";

declare global {
  namespace Express {
    interface User {
      claims: {
        sub: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        profile_image?: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: Express.User;
  userRole?: UserRole;
  userId?: string;
  userPermissions?: Set<string>;
  assignedClientIds?: Set<string>;
  officeId?: string;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  client: 1,
  agent: 2,
  tax_office: 3,
  admin: 4,
};

// Cache for agent's assigned client IDs (with TTL)
const agentScopeCache = new Map<string, { clientIds: Set<string>; timestamp: number }>();
const SCOPE_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] || 0;
}

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check for both Replit Auth (req.user) and session-based auth (req.userId)
    if (!req.user && !req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.userRole as UserRole;
    
    if (!userRole) {
      return res.status(403).json({ error: "No role assigned" });
    }

    if (allowedRoles.includes(userRole) || userRole === 'admin') {
      return next();
    }

    return res.status(403).json({ 
      error: "Access denied",
      message: `Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`
    });
  };
}

export function requireMinRole(minimumRole: UserRole) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check for both Replit Auth (req.user) and session-based auth (req.userId)
    if (!req.user && !req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.userRole as UserRole;
    
    if (!userRole) {
      return res.status(403).json({ error: "No role assigned" });
    }

    if (hasMinimumRole(userRole, minimumRole)) {
      return next();
    }

    return res.status(403).json({ 
      error: "Access denied",
      message: `Minimum required role: ${minimumRole}. Your role: ${userRole}`
    });
  };
}

export function requireAdmin() {
  return requireRole('admin');
}

export function requireStaff() {
  return requireMinRole('agent');
}

export function isOwnResourceOrStaff(getResourceOwnerId: (req: Request) => string | undefined) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check for both Replit Auth (req.user) and session-based auth (req.userId)
    if (!req.user && !req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get userId from either auth method
    const userId = req.userId || req.user?.claims?.sub;
    const userRole = req.userRole as UserRole;
    const resourceOwnerId = getResourceOwnerId(req);

    if (userId === resourceOwnerId) {
      return next();
    }

    if (hasMinimumRole(userRole, 'agent')) {
      return next();
    }

    return res.status(403).json({ 
      error: "Access denied",
      message: "You can only access your own resources"
    });
  };
}

// Permission cache with TTL (5 minutes)
const permissionCache = new Map<string, { permissions: Set<string>; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadUserPermissions(role: UserRole): Promise<Set<string>> {
  const cacheKey = role;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }
  
  try {
    const permissions = await mysqlStorage.getRolePermissions(role);
    const permSet = new Set(permissions);
    permissionCache.set(cacheKey, { permissions: permSet, timestamp: Date.now() });
    return permSet;
  } catch (error) {
    console.error('Failed to load permissions:', error);
    return new Set();
  }
}

// Clear permission cache (call when permissions are updated)
export function clearPermissionCache(role?: UserRole) {
  if (role) {
    permissionCache.delete(role);
  } else {
    permissionCache.clear();
  }
}

// Middleware to require specific permission(s)
export function requirePermission(...requiredPermissions: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check for both Replit Auth (req.user) and session-based auth (req.userId)
    if (!req.user && !req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.userRole as UserRole;
    
    if (!userRole) {
      return res.status(403).json({ error: "No role assigned" });
    }

    // Admin always has all permissions
    if (userRole === 'admin') {
      return next();
    }

    // Load permissions if not already loaded
    if (!req.userPermissions) {
      req.userPermissions = await loadUserPermissions(userRole);
    }

    // Check if user has any of the required permissions
    const hasAnyPermission = requiredPermissions.some(perm => req.userPermissions?.has(perm));
    
    if (hasAnyPermission) {
      return next();
    }

    return res.status(403).json({ 
      error: "Access denied",
      message: `Missing required permission: ${requiredPermissions.join(' or ')}`
    });
  };
}

// Middleware to load user permissions into request
export function loadPermissions() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Support both Replit Auth (req.user) and session-based auth (req.userId)
    if ((req.user || req.userId) && req.userRole) {
      req.userPermissions = await loadUserPermissions(req.userRole);
    }
    next();
  };
}

export const roleDisplayNames: Record<UserRole, string> = {
  client: 'Client',
  agent: 'Agent',
  tax_office: 'Tax Office',
  admin: 'Administrator',
};

export const roleDescriptions: Record<UserRole, string> = {
  client: 'Can view their own documents, sign forms, and track refund status',
  agent: 'Can manage assigned clients, upload documents, and track tasks',
  tax_office: 'Full access to office clients, financials, and analytics',
  admin: 'Complete system access including user management and settings',
};

// ============================================================================
// SCOPE ENFORCEMENT - Critical Security Layer
// ============================================================================
// Agents can ONLY see data for clients explicitly assigned to them
// Tax Office users can ONLY see data for their office_id
// Admin has global access

// Load agent's assigned client IDs
async function loadAgentAssignedClients(agentId: string): Promise<Set<string>> {
  const cacheKey = agentId;
  const cached = agentScopeCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < SCOPE_CACHE_TTL) {
    return cached.clientIds;
  }
  
  try {
    const clientIds = await mysqlStorage.getAgentAssignedClientIds(agentId);
    const clientSet = new Set(clientIds);
    agentScopeCache.set(cacheKey, { clientIds: clientSet, timestamp: Date.now() });
    return clientSet;
  } catch (error) {
    console.error('Failed to load agent assigned clients:', error);
    return new Set();
  }
}

// Clear agent scope cache (call when assignments change)
export function clearAgentScopeCache(agentId?: string) {
  if (agentId) {
    agentScopeCache.delete(agentId);
  } else {
    agentScopeCache.clear();
  }
}

// Middleware to load scope context into request
// Must be called after authentication middleware
export function loadScopeContext() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.userId || req.user?.claims?.sub;
    const userRole = req.userRole as UserRole;
    
    if (!userId || !userRole) {
      return next();
    }
    
    try {
      // Load office ID from user record
      const user = await mysqlStorage.getUser(userId);
      if (user?.officeId) {
        req.officeId = user.officeId;
      }
      
      // Load assigned client IDs for agents
      if (userRole === 'agent') {
        req.assignedClientIds = await loadAgentAssignedClients(userId);
      }
    } catch (error) {
      console.error('Failed to load scope context:', error);
    }
    
    next();
  };
}

// Check if a client ID is within the user's scope
export function isClientInScope(req: AuthenticatedRequest, clientId: string): boolean {
  const userRole = req.userRole as UserRole;
  const userId = req.userId || req.user?.claims?.sub;
  
  // Admin has global access
  if (userRole === 'admin') {
    return true;
  }
  
  // Client can only access their own data
  if (userRole === 'client') {
    return userId === clientId;
  }
  
  // Agent can only access assigned clients
  if (userRole === 'agent') {
    return req.assignedClientIds?.has(clientId) || false;
  }
  
  // Tax Office: check if client belongs to same office
  // This requires client lookup - for performance, we check office_id match
  // when filtering queries instead
  if (userRole === 'tax_office') {
    return true; // Office scoping is done at query level with office_id filter
  }
  
  return false;
}

// Middleware to require client scope access
// Use this for endpoints that access a specific client's data
export function requireClientScope(getClientId: (req: Request) => string | undefined) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const clientId = getClientId(req);
    
    if (!clientId) {
      return res.status(400).json({ error: "Client ID required" });
    }
    
    const userRole = req.userRole as UserRole;
    const userId = req.userId || req.user?.claims?.sub;
    
    // Admin has global access
    if (userRole === 'admin') {
      return next();
    }
    
    // Client can only access their own data
    if (userRole === 'client') {
      if (userId === clientId) {
        return next();
      }
      return res.status(403).json({ 
        error: "Access denied",
        message: "You can only access your own data"
      });
    }
    
    // Agent can only access assigned clients
    if (userRole === 'agent') {
      if (!req.assignedClientIds) {
        req.assignedClientIds = await loadAgentAssignedClients(userId!);
      }
      
      if (req.assignedClientIds.has(clientId)) {
        return next();
      }
      
      return res.status(403).json({ 
        error: "Access denied",
        message: "Client not assigned to you"
      });
    }
    
    // Tax Office: verify client belongs to same office
    if (userRole === 'tax_office') {
      if (!req.officeId) {
        return res.status(403).json({ error: "No office assigned" });
      }
      
      try {
        const client = await mysqlStorage.getUser(clientId);
        if (client?.officeId === req.officeId) {
          return next();
        }
        return res.status(403).json({ 
          error: "Access denied",
          message: "Client not in your office"
        });
      } catch (error) {
        console.error('Failed to verify client scope:', error);
        return res.status(500).json({ error: "Scope verification failed" });
      }
    }
    
    return res.status(403).json({ error: "Access denied" });
  };
}

// Get scope filter for database queries
// Returns filter conditions based on user role
export function getScopeFilter(req: AuthenticatedRequest): {
  agentClientIds?: string[];
  officeId?: string;
  isGlobal: boolean;
} {
  const userRole = req.userRole as UserRole;
  
  // Admin has global access
  if (userRole === 'admin') {
    return { isGlobal: true };
  }
  
  // Agent: filter by assigned client IDs
  if (userRole === 'agent') {
    return {
      agentClientIds: Array.from(req.assignedClientIds || []),
      isGlobal: false,
    };
  }
  
  // Tax Office: filter by office ID
  if (userRole === 'tax_office') {
    return {
      officeId: req.officeId,
      isGlobal: false,
    };
  }
  
  // Client: typically filtered by their own ID in the route
  return { isGlobal: false };
}
