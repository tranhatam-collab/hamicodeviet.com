/**
 * Entitlement system
 * Manages user entitlements and access control
 */

import { Context } from 'hono';
import { createLogger } from './observability';

const entitlementLogger = createLogger('entitlement');

export interface Entitlement {
  id: string;
  user_id: string;
  entitlement_type: string;
  resource_type: string;
  resource_id?: string;
  expires_at?: Date;
  active: boolean;
}

/**
 * Grant entitlement to user
 */
export async function grantEntitlement(
  env: any,
  userId: string,
  entitlementType: string,
  resourceType: string,
  resourceId?: string,
  grantedBy?: string,
  reason?: string,
  expiresAt?: Date
): Promise<void> {
  try {
    const sql = env.DB;
    
    await sql`
      INSERT INTO entitlements (user_id, entitlement_type, resource_type, resource_id, granted_by, reason, expires_at, active)
      VALUES (${userId}, ${entitlementType}, ${resourceType}, ${resourceId || null}, ${grantedBy || null}, ${reason || null}, ${expiresAt || null}, true)
      ON CONFLICT (user_id, entitlement_type, resource_type, resource_id) DO UPDATE SET
        active = true,
        expires_at = ${expiresAt || null},
        updated_at = now()
    `;

    entitlementLogger.info('Entitlement granted', {
      userId,
      entitlementType,
      resourceType,
      resourceId,
    });
  } catch (error) {
    entitlementLogger.error('Failed to grant entitlement', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      entitlementType,
    });
    throw error;
  }
}

/**
 * Revoke entitlement from user
 */
export async function revokeEntitlement(
  env: any,
  userId: string,
  entitlementType: string,
  resourceType: string,
  resourceId?: string,
  reason?: string
): Promise<void> {
  try {
    const sql = env.DB;
    
    await sql`
      UPDATE entitlements
      SET active = false, updated_at = now()
      WHERE user_id = ${userId}
      AND entitlement_type = ${entitlementType}
      AND resource_type = ${resourceType}
      AND (resource_id = ${resourceId || null} OR resource_id IS NULL)
    `;

    entitlementLogger.info('Entitlement revoked', {
      userId,
      entitlementType,
      resourceType,
      resourceId,
      reason,
    });
  } catch (error) {
    entitlementLogger.error('Failed to revoke entitlement', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      entitlementType,
    });
    throw error;
  }
}

/**
 * Check if user has entitlement
 */
export async function hasEntitlement(
  env: any,
  userId: string,
  entitlementType: string,
  resourceType: string,
  resourceId?: string
): Promise<boolean> {
  try {
    const sql = env.DB;
    
    const [result] = await sql`
      SELECT EXISTS(
        SELECT 1
        FROM entitlements
        WHERE user_id = ${userId}
        AND entitlement_type = ${entitlementType}
        AND resource_type = ${resourceType}
        AND (resource_id = ${resourceId || null} OR resource_id IS NULL)
        AND active = true
        AND (expires_at IS NULL OR expires_at > now())
      ) as has_entitlement
    `;

    return result.has_entitlement;
  } catch (error) {
    entitlementLogger.error('Failed to check entitlement', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      entitlementType,
    });
    return false;
  }
}

/**
 * Get all entitlements for user
 */
export async function getUserEntitlements(
  env: any,
  userId: string
): Promise<Entitlement[]> {
  try {
    const sql = env.DB;
    
    const entitlements = await sql`
      SELECT * FROM entitlements
      WHERE user_id = ${userId}
      AND active = true
      AND (expires_at IS NULL OR expires_at > now())
      ORDER BY created_at DESC
    `;

    return entitlements;
  } catch (error) {
    entitlementLogger.error('Failed to get user entitlements', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return [];
  }
}

/**
 * Grant entitlements based on subscription
 */
export async function grantSubscriptionEntitlements(
  env: any,
  userId: string,
  planId: string
): Promise<void> {
  try {
    const sql = env.DB;
    
    // Get entitlement definitions that auto-grant for this plan
    const definitions = await sql`
      SELECT * FROM entitlement_definitions
      WHERE auto_grant_on_subscription = ${planId}
      AND active = true
    `;

    for (const def of definitions) {
      await grantEntitlement(
        env,
        userId,
        def.entitlement_type,
        def.resource_type,
        undefined,
        'subscription',
        `Auto-granted for ${planId} subscription`
      );
    }

    entitlementLogger.info('Subscription entitlements granted', {
      userId,
      planId,
      count: definitions.length,
    });
  } catch (error) {
    entitlementLogger.error('Failed to grant subscription entitlements', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      planId,
    });
    throw error;
  }
}

/**
 * Revoke entitlements based on subscription cancellation
 */
export async function revokeSubscriptionEntitlements(
  env: any,
  userId: string,
  planId: string
): Promise<void> {
  try {
    const sql = env.DB;
    
    // Get entitlement definitions that auto-revoke for this plan
    const definitions = await sql`
      SELECT * FROM entitlement_definitions
      WHERE auto_grant_on_subscription = ${planId}
      AND auto_revoke_on_subscription = true
      AND active = true
    `;

    for (const def of definitions) {
      await revokeEntitlement(
        env,
        userId,
        def.entitlement_type,
        def.resource_type,
        undefined,
        `Auto-revoked for ${planId} subscription cancellation`
      );
    }

    entitlementLogger.info('Subscription entitlements revoked', {
      userId,
      planId,
      count: definitions.length,
    });
  } catch (error) {
    entitlementLogger.error('Failed to revoke subscription entitlements', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      planId,
    });
    throw error;
  }
}

/**
 * Entitlement middleware
 */
export function requireEntitlement(entitlementType: string, resourceType: string) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as any;
    
    if (!user) {
      return c.json({ error: 'unauthorized' }, 401);
    }

    const resourceId = c.req.param('id') || c.req.param('slug');
    const entitled = await hasEntitlement(c.env, user.id, entitlementType, resourceType, resourceId);
    
    if (!entitled) {
      entitlementLogger.warn('Entitlement required', {
        userId: user.id,
        entitlementType,
        resourceType,
        resourceId,
      });
      return c.json({ 
        error: 'forbidden', 
        message: 'This feature requires an active subscription' 
      }, 403);
    }

    await next();
  };
}

/**
 * Check if user can access course
 */
export async function canAccessCourse(env: any, userId: string, courseId?: string): Promise<boolean> {
  // Check if user has specific course access
  const hasCourseAccess = await hasEntitlement(env, userId, 'access', 'course', courseId);
  if (hasCourseAccess) return true;

  // Check if user has all courses entitlement
  const hasAllCourses = await hasEntitlement(env, userId, 'access', 'course');
  if (hasAllCourses) return true;

  // Check if course is free
  const sql = env.DB;
  const [course] = await sql`
    SELECT price_cents FROM courses WHERE id = ${courseId}
  `;
  if (course && course.price_cents === 0) return true;

  return false;
}

/**
 * Course access middleware
 */
export function requireCourseAccess() {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as any;
    
    if (!user) {
      return c.json({ error: 'unauthorized' }, 401);
    }

    const courseId = c.req.param('id') || c.req.param('slug');
    const canAccess = await canAccessCourse(c.env, user.id, courseId);
    
    if (!canAccess) {
      return c.json({ 
        error: 'forbidden', 
        message: 'This course requires an active subscription' 
      }, 403);
    }

    await next();
  };
}
