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
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  client: 1,
  agent: 2,
  tax_office: 3,
  admin: 4,
};

export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] || 0;
}

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
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
    if (!req.user) {
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
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user.claims.sub;
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
    if (!req.user) {
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
    if (req.user && req.userRole) {
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
  tax_office: 'Full access to all clients, financials, and analytics',
  admin: 'Complete system access including user management and settings',
};
