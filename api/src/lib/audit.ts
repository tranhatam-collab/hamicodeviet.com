/**
 * Audit logging middleware
 * Logs all sensitive actions for compliance and security
 */

import { Context } from 'hono';
import { createLogger } from './observability';

const auditLogger = createLogger('audit');

export interface AuditLogData {
  actor_id?: string;
  actor_type: 'user' | 'system' | 'admin';
  action: string;
  resource_type: string;
  resource_id?: string;
  permission?: string;
  reason?: string;
  changes?: Record<string, unknown>;
  ip?: string;
  user_agent?: string;
  request_id?: string;
}

/**
 * Log audit event
 */
export async function logAuditEvent(
  env: any,
  data: AuditLogData
): Promise<void> {
  try {
    const sql = env.DB;
    await sql`
      INSERT INTO audit_logs (
        actor_id,
        actor_type,
        action,
        resource_type,
        resource_id,
        permission,
        reason,
        changes,
        ip,
        user_agent,
        request_id
      )
      VALUES (
        ${data.actor_id || null},
        ${data.actor_type},
        ${data.action},
        ${data.resource_type},
        ${data.resource_id || null},
        ${data.permission || null},
        ${data.reason || null},
        ${data.changes ? JSON.stringify(data.changes) : null}::jsonb,
        ${data.ip || null},
        ${data.user_agent || null},
        ${data.request_id || null}
      )
    `;

    auditLogger.info('Audit event logged', {
      action: data.action,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      actor_id: data.actor_id,
    });
  } catch (error) {
    auditLogger.error('Failed to log audit event', {
      error: error instanceof Error ? error.message : String(error),
      data,
    });
  }
}

export interface SecurityEventData {
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  ip?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
  request_id?: string;
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  env: any,
  data: SecurityEventData
): Promise<void> {
  try {
    const sql = env.DB;
    await sql`
      INSERT INTO security_events (
        event_type,
        severity,
        user_id,
        ip,
        user_agent,
        details,
        request_id
      )
      VALUES (
        ${data.event_type},
        ${data.severity},
        ${data.user_id || null},
        ${data.ip || null},
        ${data.user_agent || null},
        ${data.details ? JSON.stringify(data.details) : null}::jsonb,
        ${data.request_id || null}
      )
    `;

    auditLogger.warn('Security event logged', {
      event_type: data.event_type,
      severity: data.severity,
      user_id: data.user_id,
    });

    // For critical events, also log to console for immediate visibility
    if (data.severity === 'critical') {
      console.error(`[SECURITY CRITICAL] ${data.event_type}`, data);
    }
  } catch (error) {
    auditLogger.error('Failed to log security event', {
      error: error instanceof Error ? error.message : String(error),
      data,
    });
  }
}

/**
 * Audit logging middleware
 * Automatically logs all write operations
 */
export function auditLoggingMiddleware(action: string, resourceType: string) {
  return async (c: Context, next: () => Promise<void>) => {
    await next();

    // Only log write operations (POST, PUT, DELETE, PATCH)
    const method = c.req.method;
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return;
    }

    const user = c.get('user') as any;
    const requestId = c.get('requestId');

    await logAuditEvent(c.env, {
      actor_id: user?.id,
      actor_type: user ? 'user' : 'system',
      action,
      resource_type: resourceType,
      resource_id: c.req.param('id') || c.req.param('slug'),
      ip: c.req.header('cf-connecting-ip'),
      user_agent: c.req.header('user-agent'),
      request_id: requestId,
    });
  };
}
