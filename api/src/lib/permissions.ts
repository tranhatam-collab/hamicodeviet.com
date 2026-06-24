/**
 * Permission checking middleware
 * Enforces RBAC based on roles and permissions
 */

import { Context } from 'hono';
import { createLogger } from './observability';

const authLogger = createLogger('auth');

export interface PermissionCheck {
  resource: string;
  action: string;
}

/**
 * Check if user has permission
 */
export async function hasPermission(
  env: any,
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const sql = env.DB;
    
    const result = await sql`
      SELECT EXISTS(
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ${userId}
        AND p.resource_type = ${resource}
        AND p.action = ${action}
      ) as has_permission
    `;

    return result[0].has_permission;
  } catch (error) {
    authLogger.error('Permission check failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      resource,
      action,
    });
    return false;
  }
}

/**
 * Check if user has role
 */
export async function hasRole(
  env: any,
  userId: string,
  role: string
): Promise<boolean> {
  try {
    const sql = env.DB;
    
    const result = await sql`
      SELECT EXISTS(
        SELECT 1
        FROM user_roles
        WHERE user_id = ${userId}
        AND role_id = ${role}
      ) as has_role
    `;

    return result[0].has_role;
  } catch (error) {
    authLogger.error('Role check failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      role,
    });
    return false;
  }
}

/**
 * Require permission middleware
 */
export function requirePermission(resource: string, action: string) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as any;
    
    if (!user) {
      return c.json({ error: 'unauthorized' }, 401);
    }

    const allowed = await hasPermission(c.env, user.id, resource, action);
    
    if (!allowed) {
      authLogger.warn('Permission denied', {
        userId: user.id,
        resource,
        action,
      });
      return c.json({ error: 'forbidden', message: 'Permission denied' }, 403);
    }

    await next();
  };
}

/**
 * Require role middleware
 */
export function requireRole(role: string) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as any;
    
    if (!user) {
      return c.json({ error: 'unauthorized' }, 401);
    }

    const hasRequiredRole = await hasRole(c.env, user.id, role);
    
    if (!hasRequiredRole) {
      authLogger.warn('Role required', {
        userId: user.id,
        requiredRole: role,
      });
      return c.json({ error: 'forbidden', message: `Role ${role} required` }, 403);
    }

    await next();
  };
}

/**
 * Require admin middleware
 */
export const requireAdmin = requireRole('admin');

/**
 * Require any of multiple roles
 */
export function requireAnyRole(roles: string[]) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as any;
    
    if (!user) {
      return c.json({ error: 'unauthorized' }, 401);
    }

    for (const role of roles) {
      const hasRequiredRole = await hasRole(c.env, user.id, role);
      if (hasRequiredRole) {
        await next();
        return;
      }
    }

    authLogger.warn('None of required roles found', {
      userId: user.id,
      requiredRoles: roles,
    });
    return c.json({ error: 'forbidden', message: 'Permission denied' }, 403);
  };
}
