import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { requireAdmin } from '../lib/permissions';
import { logAuditEvent } from '../lib/audit';
import {
  grantEntitlement,
  revokeEntitlement,
  hasEntitlement,
  getUserEntitlements,
  grantSubscriptionEntitlements,
  revokeSubscriptionEntitlements,
} from '../lib/entitlement';

const entitlements = new Hono<AppBindings>();

// Admin middleware
entitlements.use('*', async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  c.set('user', { id: payload.sub, email: payload.email });
  c.set('requestId', c.req.header('x-request-id') || 'unknown');

  await next();
});

// GET /entitlements — list all entitlements (admin only)
entitlements.get('/', requireAdmin, async (c) => {
  const sql = getDb(c.env);
  const entitlementList = await sql`
    SELECT * FROM entitlements ORDER BY created_at DESC
  `;
  return c.json({ entitlements: entitlementList });
});

// GET /entitlements/me — get current user's entitlements
entitlements.get('/me', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const entitlements = await getUserEntitlements(c.env, payload.sub);
  return c.json({ entitlements });
});

// GET /entitlements/definitions — list entitlement definitions
entitlements.get('/definitions', async (c) => {
  const sql = getDb(c.env);
  const definitions = await sql`
    SELECT * FROM entitlement_definitions WHERE active = true ORDER BY created_at DESC
  `;
  return c.json({ definitions });
});

// POST /entitlements/grant — grant entitlement to user (admin only)
entitlements.post('/grant', requireAdmin, async (c) => {
  const body = await c.req.json();
  const user = c.get('user') as any;

  await grantEntitlement(
    c.env,
    body.userId,
    body.entitlementType,
    body.resourceType,
    body.resourceId,
    user.id,
    body.reason,
    body.expiresAt ? new Date(body.expiresAt) : undefined
  );

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'entitlement.grant',
    resource_type: 'entitlement',
    resource_id: body.userId,
    changes: body,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({ success: true });
});

// POST /entitlements/revoke — revoke entitlement from user (admin only)
entitlements.post('/revoke', requireAdmin, async (c) => {
  const body = await c.req.json();
  const user = c.get('user') as any;

  await revokeEntitlement(
    c.env,
    body.userId,
    body.entitlementType,
    body.resourceType,
    body.resourceId,
    body.reason
  );

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'entitlement.revoke',
    resource_type: 'entitlement',
    resource_id: body.userId,
    changes: body,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({ success: true });
});

// POST /entitlements/subscription/:planId/grant — grant subscription entitlements (admin only)
entitlements.post('/subscription/:planId/grant', requireAdmin, async (c) => {
  const planId = c.req.param('planId');
  if (!planId) return c.json({ error: 'missing_plan_id' }, 400);
  const body = await c.req.json();
  const user = c.get('user') as any;

  await grantSubscriptionEntitlements(c.env, body.userId, planId);

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'entitlement.subscription_grant',
    resource_type: 'entitlement',
    resource_id: body.userId,
    changes: { planId },
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({ success: true });
});

// POST /entitlements/subscription/:planId/revoke — revoke subscription entitlements (admin only)
entitlements.post('/subscription/:planId/revoke', requireAdmin, async (c) => {
  const planId = c.req.param('planId');
  if (!planId) return c.json({ error: 'missing_plan_id' }, 400);
  const body = await c.req.json();
  const user = c.get('user') as any;

  await revokeSubscriptionEntitlements(c.env, body.userId, planId);

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'entitlement.subscription_revoke',
    resource_type: 'entitlement',
    resource_id: body.userId,
    changes: { planId },
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({ success: true });
});

export default entitlements;
