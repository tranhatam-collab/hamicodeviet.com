import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';

const features = new Hono<AppBindings>();

// Public endpoint — GET /features — list all enabled features (no auth required for read)
features.get('/', async (c) => {
  const sql = getDb(c.env);
  const flags = await sql`
    SELECT key, description, enabled, rollout_percentage, metadata
    FROM feature_flags
    ORDER BY key
  `;
  return c.json({ features: flags });
});

// GET /features/:key — check single feature flag
features.get('/:key', async (c) => {
  const key = c.req.param('key');
  const sql = getDb(c.env);
  const [flag] = await sql`
    SELECT key, description, enabled, rollout_percentage, target_users, metadata
    FROM feature_flags WHERE key = ${key}
  `;
  if (!flag) return c.json({ key, enabled: false, exists: false });
  return c.json({ ...flag, exists: true });
});

// Admin endpoints — require auth
features.use('/admin/*', async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);
  c.set('user', { id: payload.sub, email: payload.email });
  await next();
});

// GET /features/admin/all — list all flags (including disabled) for admin
features.get('/admin/all', async (c) => {
  const sql = getDb(c.env);
  const flags = await sql`SELECT * FROM feature_flags ORDER BY key`;
  return c.json({ features: flags });
});

// PUT /features/admin/:key — update a feature flag
features.put('/admin/:key', async (c) => {
  const key = c.req.param('key');
  const body = await c.req.json();
  const sql = getDb(c.env);
  const [updated] = await sql`
    UPDATE feature_flags SET
      enabled = COALESCE(${body.enabled}, enabled),
      rollout_percentage = COALESCE(${body.rolloutPercentage}, rollout_percentage),
      description = COALESCE(${body.description}, description),
      updated_at = now()
    WHERE key = ${key}
    RETURNING *
  `;
  if (!updated) return c.json({ error: 'flag_not_found' }, 404);
  return c.json({ feature: updated });
});

export default features;
