import { Hono } from 'hono';
import { verifyJwt } from '../lib/jwt';
import { getDb } from '../lib/db';

const guardian = new Hono<AppBindings>();

// Middleware: require auth
guardian.use('*', async (c, next) => {
  const auth = c.req.header('authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const token = auth.substring(7);
  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const sql = getDb(c.env);
  const [user] = await sql`SELECT id, email, email_verified, status FROM users WHERE id = ${payload.sub}`;
  if (!user || user.status !== 'active') {
    return c.json({ error: 'unauthorized' }, 401);
  }

  c.set('user', user as AuthUser);
  await next();
});

// GET /guardian/links — list guardian links for current user
guardian.get('/links', async (c) => {
  const user = c.get('user');
  const sql = getDb(c.env);

  // Links where user is the learner
  const asLearner = await sql`
    SELECT gl.id, gl.status, gl.created_at, gl.approved_at,
           g.email as guardian_email
    FROM guardian_links gl
    JOIN guardians g ON g.id = gl.guardian_id
    WHERE gl.learner_id = ${user.id}
  `;

  // Links where user is the guardian (if they have guardian role)
  const guardianRecord = await sql`SELECT id FROM guardians WHERE user_id = ${user.id}`;
  let asGuardian: any[] = [];
  if (guardianRecord.length > 0) {
    asGuardian = await sql`
      SELECT gl.id, gl.status, gl.created_at, gl.approved_at,
             u.email as learner_email,
             p.display_name as learner_name
      FROM guardian_links gl
      JOIN users u ON u.id = gl.learner_id
      LEFT JOIN profiles p ON p.user_id = gl.learner_id
      WHERE gl.guardian_id = ${guardianRecord[0].id}
    `;
  }

  return c.json({ asLearner, asGuardian });
});

// POST /guardian/approve/:linkId — guardian approves a learner link
guardian.post('/approve/:linkId', async (c) => {
  const user = c.get('user');
  const linkId = c.req.param('linkId');
  const sql = getDb(c.env);

  const guardianRecord = await sql`SELECT id FROM guardians WHERE user_id = ${user.id}`;
  if (guardianRecord.length === 0) {
    return c.json({ error: 'not_a_guardian' }, 403);
  }

  const [link] = await sql`
    SELECT id, status FROM guardian_links
    WHERE id = ${linkId} AND guardian_id = ${guardianRecord[0].id} AND status = 'pending'
  `;
  if (!link) return c.json({ error: 'link_not_found' }, 404);

  await sql`UPDATE guardian_links SET status = 'approved', approved_at = now() WHERE id = ${linkId}`;
  return c.json({ success: true });
});

// POST /guardian/revoke/:linkId — guardian revokes a learner link
guardian.post('/revoke/:linkId', async (c) => {
  const user = c.get('user');
  const linkId = c.req.param('linkId');
  const sql = getDb(c.env);

  const guardianRecord = await sql`SELECT id FROM guardians WHERE user_id = ${user.id}`;
  if (guardianRecord.length === 0) {
    return c.json({ error: 'not_a_guardian' }, 403);
  }

  await sql`UPDATE guardian_links SET status = 'revoked', revoked_at = now() WHERE id = ${linkId} AND guardian_id = ${guardianRecord[0].id}`;
  return c.json({ success: true });
});

export default guardian;
