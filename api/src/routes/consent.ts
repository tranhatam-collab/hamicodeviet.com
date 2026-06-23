import { Hono } from 'hono';
import { verifyJwt, hashToken } from '../lib/jwt';
import { getDb } from '../lib/db';

const consent = new Hono<AppBindings>();

// Middleware: require auth
consent.use('*', async (c, next) => {
  const auth = c.req.header('authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const token = auth.substring(7);
  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const sql = getDb(c.env);
  const [user] = await sql`SELECT id, email, status FROM users WHERE id = ${payload.sub}`;
  if (!user || user.status !== 'active') {
    return c.json({ error: 'unauthorized' }, 401);
  }

  c.set('user', user as AuthUser);
  await next();
});

// GET /consent — list all consents for current user
consent.get('/', async (c) => {
  const user = c.get('user');
  const sql = getDb(c.env);

  const consents = await sql`
    SELECT id, policy_type, policy_version, consent_state, timestamp, withdrawal_timestamp, reason
    FROM consents WHERE user_id = ${user.id}
    ORDER BY timestamp DESC
  `;

  const policies = await sql`
    SELECT policy_type, version, effective_date, locale, status
    FROM policy_versions WHERE status = 'active'
    ORDER BY policy_type, locale
  `;

  return c.json({ consents, activePolicies: policies });
});

// POST /consent — grant or withdraw consent
consent.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { policyType, policyVersion, action, reason } = body;

  if (!policyType || !policyVersion) {
    return c.json({ error: 'missing_fields' }, 400);
  }

  const sql = getDb(c.env);
  const consentState = action === 'withdraw' ? 'withdrawn' : 'granted';

  if (action === 'withdraw') {
    // Mark existing granted consent as withdrawn
    await sql`
      UPDATE consents SET consent_state = 'withdrawn', withdrawal_timestamp = now(), reason = ${reason || null}
      WHERE user_id = ${user.id} AND policy_type = ${policyType} AND consent_state = 'granted'
    `;
  } else {
    // Insert new consent
    await sql`
      INSERT INTO consents (user_id, policy_type, policy_version, consent_state, source, ip)
      VALUES (${user.id}, ${policyType}, ${policyVersion}, 'granted', 'web', ${c.req.header('cf-connecting-ip') || null})
    `;
  }

  return c.json({ success: true });
});

export default consent;
