import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { requireAdmin, requirePermission } from '../lib/permissions';
import { logAuditEvent } from '../lib/audit';
import { logSecurityEvent } from '../lib/audit';

const admin = new Hono<AppBindings>();

// Admin middleware — require admin role
admin.use('*', async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  // Set user in context for permission checks
  c.set('user', { id: payload.sub, email: payload.email, email_verified: false, status: 'active' });
  c.set('requestId', c.req.header('x-request-id') || 'unknown');

  await next();
});

// Apply admin role requirement
admin.use('*', requireAdmin);

// GET /admin/stats — platform statistics
admin.get('/stats', async (c) => {
  const sql = getDb(c.env);
  const [stats] = await sql`
    SELECT
      (SELECT COUNT(*) FROM users WHERE status = 'active') as total_users,
      (SELECT COUNT(*) FROM users WHERE email_verified = true) as verified_users,
      (SELECT COUNT(*) FROM users WHERE created_at > now() - interval '7 days') as new_users_7d,
      (SELECT COUNT(*) FROM users WHERE created_at > now() - interval '30 days') as new_users_30d,
      (SELECT COUNT(*) FROM enrollments) as total_enrollments,
      (SELECT COUNT(*) FROM enrollments WHERE completed_at IS NOT NULL) as completed_courses,
      (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
      (SELECT COUNT(*) FROM payments WHERE status = 'succeeded') as successful_payments,
      (SELECT COALESCE(SUM(amount_cents), 0) FROM payments WHERE status = 'succeeded') as total_revenue_cents,
      (SELECT COUNT(*) FROM courses WHERE status = 'published') as published_courses,
      (SELECT COUNT(*) FROM certificates) as total_certificates
  `;

  const revenueByPlan = await sql`
    SELECT plan_id, COUNT(*) as count FROM subscriptions WHERE status = 'active' GROUP BY plan_id
  `;

  return c.json({ stats, revenueByPlan });
});

// GET /admin/users — list users with pagination
admin.get('/users', async (c) => {
  const page = Number(c.req.query('page')) || 1;
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100);
  const offset = (page - 1) * limit;
  const search = c.req.query('search') || '';

  const sql = getDb(c.env);
  let users;
  let count;
  if (search) {
    users = await sql`
      SELECT u.id, u.email, u.email_verified, u.status, u.created_at,
             p.display_name, p.language, p.country
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.email ILIKE ${'%' + search + '%'} OR p.display_name ILIKE ${'%' + search + '%'}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [c] = await sql`
      SELECT COUNT(*) as total FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.email ILIKE ${'%' + search + '%'} OR p.display_name ILIKE ${'%' + search + '%'}
    `;
    count = c.total;
  } else {
    users = await sql`
      SELECT u.id, u.email, u.email_verified, u.status, u.created_at,
             p.display_name, p.language, p.country
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [c] = await sql`SELECT COUNT(*) as total FROM users`;
    count = c.total;
  }

  return c.json({ users, total: count, page, limit, totalPages: Math.ceil(count / limit) });
});

// GET /admin/users/:id — get user detail
admin.get('/users/:id', async (c) => {
  const userId = c.req.param('id');
  const sql = getDb(c.env);

  const [user] = await sql`
    SELECT u.id, u.email, u.email_verified, u.status, u.created_at, u.updated_at,
           p.display_name, p.birth_year, p.country, p.language, p.avatar_url, p.bio
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.id = ${userId}
  `;
  if (!user) return c.json({ error: 'user_not_found' }, 404);

  const roles = await sql`
    SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ${userId}
  `;
  const enrollments = await sql`
    SELECT e.status, e.enrolled_at, e.completed_at, c.slug, c.title_vi
    FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ${userId}
  `;
  const subscriptions = await sql`
    SELECT plan_id, status, current_period_start, current_period_end FROM subscriptions WHERE user_id = ${userId}
  `;

  return c.json({ user, roles: roles.map((r: any) => r.name), enrollments, subscriptions });
});

// PUT /admin/users/:id/status — update user status (suspend/activate)
admin.put('/users/:id/status', async (c) => {
  const userId = c.req.param('id');
  const body = await c.req.json();
  const status = body.status;
  if (!['active', 'suspended', 'deleted'].includes(status)) {
    return c.json({ error: 'invalid_status' }, 400);
  }

  const sql = getDb(c.env);
  const user = c.get('user') as any;

  // Log audit event
  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'user.update_status',
    resource_type: 'user',
    resource_id: userId,
    changes: { status },
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  // Log security event for suspensions
  if (status === 'suspended') {
    await logSecurityEvent(c.env, {
      event_type: 'user_suspended',
      severity: 'high',
      user_id: userId,
      ip: c.req.header('cf-connecting-ip'),
      user_agent: c.req.header('user-agent'),
      details: { actor_id: user.id },
      request_id: c.get('requestId'),
    });
  }

  await sql`UPDATE users SET status = ${status}, updated_at = now() WHERE id = ${userId}`;

  // If suspended, revoke all sessions
  if (status === 'suspended') {
    await sql`UPDATE sessions SET revoked_at = now() WHERE user_id = ${userId} AND revoked_at IS NULL`;
  }

  return c.json({ success: true, status });
});

// GET /admin/courses — list all courses (including draft)
admin.get('/courses', async (c) => {
  const sql = getDb(c.env);
  const courses = await sql`
    SELECT c.*, COUNT(e.id) as enrollment_count
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;
  return c.json({ courses });
});

// POST /admin/courses — create a new course
admin.post('/courses', async (c) => {
  const body = await c.req.json();
  const sql = getDb(c.env);
  const user = c.get('user') as any;

  const [course] = await sql`
    INSERT INTO courses (slug, track_id, title_vi, title_en, description_vi, description_en, level, duration_hours, price_cents, currency, status)
    VALUES (${body.slug}, ${body.trackId || null}, ${body.titleVi}, ${body.titleEn}, ${body.descriptionVi || ''}, ${body.descriptionEn || ''}, ${body.level || 'beginner'}, ${body.durationHours || 0}, ${body.priceCents || 0}, ${body.currency || 'VND'}, ${body.status || 'draft'})
    RETURNING id, slug
  `;

  // Log audit event
  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'course.create',
    resource_type: 'course',
    resource_id: course.id,
    changes: body,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({ course }, 201);
});

// GET /admin/payments — list all payments
admin.get('/payments', async (c) => {
  const page = Number(c.req.query('page')) || 1;
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100);
  const offset = (page - 1) * limit;

  const sql = getDb(c.env);
  const payments = await sql`
    SELECT p.*, u.email as user_email
    FROM payments p
    JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const [count] = await sql`SELECT COUNT(*) as total FROM payments`;

  return c.json({ payments, total: count.total, page, limit });
});

export default admin;
