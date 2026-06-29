import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { logAuditEvent } from '../lib/audit';

const notifications = new Hono<AppBindings>();

notifications.use('*', async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);
  c.set('user', { id: payload.sub, email: payload.email });
  c.set('requestId', c.req.header('x-request-id') || 'unknown');
  await next();
});

// GET /notifications — list user's notifications
notifications.get('/', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const page = Number(c.req.query('page')) || 1;
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100);
  const offset = (page - 1) * limit;
  const unreadOnly = c.req.query('unread') === 'true';

  const items = await sql`
    SELECT * FROM notifications
    WHERE user_id = ${user.id} ${unreadOnly ? sql`AND read = false` : sql``}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const [count] = await sql`
    SELECT count(*) as total,
           count(*) FILTER (WHERE read = false) as unread
    FROM notifications WHERE user_id = ${user.id}
  `;
  return c.json({ notifications: items, total: count.total, unread: count.unread, page, limit });
});

// GET /notifications/unread-count — quick unread count
notifications.get('/unread-count', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const [count] = await sql`
    SELECT count(*) as cnt FROM notifications
    WHERE user_id = ${user.id} AND read = false
  `;
  return c.json({ unread: Number(count.cnt) });
});

// POST /notifications/:id/read — mark as read
notifications.post('/:id/read', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const [updated] = await sql`
    UPDATE notifications SET read = true, read_at = now()
    WHERE id = ${id} AND user_id = ${user.id} AND read = false
    RETURNING *
  `;
  if (!updated) return c.json({ error: 'notification_not_found' }, 404);
  return c.json({ notification: updated });
});

// POST /notifications/read-all — mark all as read
notifications.post('/read-all', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  await sql`
    UPDATE notifications SET read = true, read_at = now()
    WHERE user_id = ${user.id} AND read = false
  `;
  return c.json({ success: true });
});

// DELETE /notifications/:id — delete notification
notifications.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const [deleted] = await sql`
    DELETE FROM notifications WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id
  `;
  if (!deleted) return c.json({ error: 'notification_not_found' }, 404);
  return c.json({ success: true });
});

// Internal helper — create notification (not exposed as public route, used by other routes)
export async function createNotification(env: Env, userId: string, type: string, title: string, body: string, data: any = {}) {
  const sql = getDb(env);
  await sql`
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (${userId}, ${type}, ${title}, ${body}, ${JSON.stringify(data)}::jsonb)
  `;
}

export default notifications;
