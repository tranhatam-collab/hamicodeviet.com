import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { logAuditEvent } from '../lib/audit';

const certificates = new Hono<AppBindings>();

// Auth middleware (except for public verify endpoint)
certificates.use('*', async (c, next) => {
  // Allow public verify without auth
  const path = new URL(c.req.url).pathname;
  if (path.includes('/verify/')) {
    return next();
  }
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);
  c.set('user', { id: payload.sub, email: payload.email });
  c.set('requestId', c.req.header('x-request-id') || 'unknown');
  await next();
});

function generateCertificateId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'HAMI-';
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  id += '-';
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// GET /certificates — list user's certificates
certificates.get('/', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const items = await sql`
    SELECT * FROM certificates WHERE user_id = ${user.id} AND status = 'active'
    ORDER BY issue_date DESC
  `;
  return c.json({ certificates: items });
});

// POST /certificates — issue a certificate (admin only — simplified: any user can self-issue for demo)
certificates.post('/', async (c) => {
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  if (!body.courseTitle || !body.recipientName) {
    return c.json({ error: 'missing_fields', required: ['courseTitle', 'recipientName'] }, 400);
  }

  const certId = generateCertificateId();
  const [cert] = await sql`
    INSERT INTO certificates (certificate_id, user_id, course_title, recipient_name, recipient_email, score, metadata)
    VALUES (
      ${certId}, ${user.id}, ${body.courseTitle}, ${body.recipientName},
      ${user.email}, ${body.score || null},
      ${JSON.stringify(body.metadata || {})}::jsonb
    )
    RETURNING *
  `;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'certificate.issue',
    resource_type: 'certificate',
    resource_id: cert.id,
  });

  return c.json({ certificate: cert }, 201);
});

// GET /certificates/verify/:certId — public verify endpoint (no auth required)
certificates.get('/verify/:certId', async (c) => {
  const certId = c.req.param('certId');
  const sql = getDb(c.env);
  const [cert] = await sql`
    SELECT certificate_id, recipient_name, recipient_email, course_title,
           issue_date, expiry_date, score, status
    FROM certificates WHERE certificate_id = ${certId}
  `;
  if (!cert) return c.json({ error: 'certificate_not_found' }, 404);
  if (cert.status === 'revoked') {
    return c.json({ valid: false, certificate: cert, message: 'Certificate has been revoked.' });
  }
  return c.json({ valid: true, certificate: cert });
});

// GET /certificates/:id — get single certificate
certificates.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const [cert] = await sql`
    SELECT * FROM certificates WHERE id = ${id} AND user_id = ${user.id}
  `;
  if (!cert) return c.json({ error: 'certificate_not_found' }, 404);
  return c.json({ certificate: cert });
});

export default certificates;
