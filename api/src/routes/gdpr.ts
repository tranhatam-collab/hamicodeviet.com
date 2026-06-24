import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { logAuditEvent } from '../lib/audit';

const gdpr = new Hono<AppBindings>();

// Auth middleware
gdpr.use('*', async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  c.set('user', { id: payload.sub, email: payload.email });
  c.set('requestId', c.req.header('x-request-id') || 'unknown');

  await next();
});

// GET /gdpr/export — export user data (GDPR right to data portability)
gdpr.get('/export', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  // Collect all user data
  const [userData] = await sql`
    SELECT id, email, email_verified, status, created_at, updated_at
    FROM users WHERE id = ${user.id}
  `;

  const [profileData] = await sql`
    SELECT * FROM profiles WHERE user_id = ${user.id}
  `;

  const roles = await sql`
    SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ${user.id}
  `;

  const sessions = await sql`
    SELECT id, created_at, expires_at, ip, user_agent
    FROM sessions WHERE user_id = ${user.id}
  `;

  const enrollments = await sql`
    SELECT e.*, c.title_vi, c.title_en
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.user_id = ${user.id}
  `;

  const subscriptions = await sql`
    SELECT * FROM subscriptions WHERE user_id = ${user.id}
  `;

  const payments = await sql`
    SELECT id, amount_cents, currency, status, provider, description, created_at
    FROM payments WHERE user_id = ${user.id}
  `;

  const entitlements = await sql`
    SELECT * FROM entitlements WHERE user_id = ${user.id}
  `;

  const certificates = await sql`
    SELECT * FROM certificates WHERE user_id = ${user.id}
  `;

  const consents = await sql`
    SELECT * FROM consents WHERE user_id = ${user.id}
  `;

  const guardianLinks = await sql`
    SELECT * FROM guardian_links WHERE learner_id = ${user.id}
  `;

  const childSafetySettings = await sql`
    SELECT * FROM child_safety_settings WHERE user_id = ${user.id}
  `;

  // Log audit event
  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'gdpr.export',
    resource_type: 'user',
    resource_id: user.id,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  // Return all data as JSON
  return c.json({
    user: userData,
    profile: profileData,
    roles: roles.map((r: any) => r.name),
    sessions,
    enrollments,
    subscriptions,
    payments,
    entitlements,
    certificates,
    consents,
    guardianLinks,
    childSafetySettings,
    exported_at: new Date().toISOString(),
  });
});

// POST /gdpr/deletion-request — request account deletion (GDPR right to be forgotten)
gdpr.post('/deletion-request', async (c) => {
  const user = c.get('user') as any;
  const body = await c.req.json();
  const sql = getDb(c.env);

  // Create deletion request
  const [request] = await sql`
    INSERT INTO audit_logs (actor_id, actor_type, action, resource_type, resource_id, reason, ip, user_agent, request_id)
    VALUES (${user.id}, 'user', 'gdpr.deletion_request', 'user', ${user.id}, ${body.reason || ''}, ${c.req.header('cf-connecting-ip')}, ${c.req.header('user-agent')}, ${c.get('requestId')})
    RETURNING *
  `;

  // Log audit event
  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'gdpr.deletion_request',
    resource_type: 'user',
    resource_id: user.id,
    reason: body.reason,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({
    success: true,
    message: 'Deletion request submitted. Your account will be deleted within 30 days.',
    request_id: request.id,
  });
});

// POST /gdpr/deletion-confirm — confirm and execute account deletion (requires email verification)
gdpr.post('/deletion-confirm', async (c) => {
  const user = c.get('user') as any;
  const body = await c.req.json();
  const sql = getDb(c.env);

  // Verify token (simplified - in production, use email verification)
  // For now, just check if user confirms
  if (!body.confirmed) {
    return c.json({ error: 'confirmation_required' }, 400);
  }

  // Soft delete user (mark as deleted)
  await sql`
    UPDATE users SET status = 'deleted', updated_at = now() WHERE id = ${user.id}
  `;

  // Revoke all sessions
  await sql`
    UPDATE sessions SET revoked_at = now() WHERE user_id = ${user.id} AND revoked_at IS NULL
  `;

  // Cancel all subscriptions
  await sql`
    UPDATE subscriptions SET status = 'canceled', updated_at = now() WHERE user_id = ${user.id} AND status = 'active'
  `;

  // Revoke all entitlements
  await sql`
    UPDATE entitlements SET active = false, updated_at = now() WHERE user_id = ${user.id} AND active = true
  `;

  // Log audit event
  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'gdpr.deletion_confirmed',
    resource_type: 'user',
    resource_id: user.id,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({
    success: true,
    message: 'Account deleted successfully',
  });
});

// GET /gdpr/status — get GDPR request status
gdpr.get('/status', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [status] = await sql`
    SELECT status FROM users WHERE id = ${user.id}
  `;

  return c.json({
    status: status.status,
    can_delete: status.status !== 'deleted',
  });
});

export default gdpr;
