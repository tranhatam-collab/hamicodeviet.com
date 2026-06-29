import { Hono } from 'hono';
import { verifyJwt } from '../lib/jwt';
import { getDb } from '../lib/db';
import { enqueueEmail } from '../lib/email';

function generate6DigitCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1000000).padStart(6, '0');
}

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

// POST /guardian/declare — adult declares guardianship over a child account
// Body: { childEmail, relationship, verificationMethod, declarations: { authority, readNotice, explainedToChild, understandsWithdrawal, paysIfPurchase, noCardToChild, notifyOnChange } }
guardian.post('/declare', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const {
    childEmail,
    relationship,
    verificationMethod,
    declarations,
  } = body;

  if (!childEmail || !relationship || !declarations) {
    return c.json({ error: 'missing_fields', required: ['childEmail', 'relationship', 'declarations'] }, 400);
  }

  // All mandatory guardian declarations must be true (Điều 11)
  const requiredDeclarations = [
    'authority',
    'readNotice',
    'explainedToChild',
    'understandsWithdrawal',
    'paysIfPurchase',
    'noCardToChild',
    'notifyOnChange',
  ];
  for (const key of requiredDeclarations) {
    if (!declarations[key]) {
      return c.json({
        error: 'declaration_required',
        field: key,
        message: `Guardian declaration "${key}" must be confirmed.`,
      }, 400);
    }
  }

  const sql = getDb(c.env);

  // Find the child user by email
  const [child] = await sql`SELECT id, email, status FROM users WHERE email = ${childEmail}`;
  if (!child) {
    return c.json({ error: 'child_not_found', message: 'Tài khoản trẻ chưa tồn tại. Hãy để trẻ đăng ký trước.' }, 404);
  }

  // Cannot declare guardianship over yourself
  if (child.id === user.id) {
    return c.json({ error: 'cannot_self_guardian' }, 400);
  }

  // Check if user already has a guardian record
  let [guardianRec] = await sql`SELECT id FROM guardians WHERE user_id = ${user.id}`;
  if (!guardianRec) {
    [guardianRec] = await sql`
      INSERT INTO guardians (user_id, email, display_name, relationship, verification_method, verification_status)
      VALUES (${user.id}, ${user.email}, null, ${relationship}, ${verificationMethod || 'email'}, 'pending')
      RETURNING id
    `;
  }

  // Check if link already exists
  const [existingLink] = await sql`
    SELECT id, status FROM guardian_links
    WHERE guardian_id = ${guardianRec.id} AND learner_id = ${child.id}
  `;
  if (existingLink) {
    return c.json({
      error: 'link_exists',
      status: existingLink.status,
      linkId: existingLink.id,
    }, 409);
  }

  // Create guardian link (pending until verified) with verification code
  const verificationCode = generate6DigitCode();
  const codeExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min expiry

  const [link] = await sql`
    INSERT INTO guardian_links (guardian_id, learner_id, status, invitation_token)
    VALUES (${guardianRec.id}, ${child.id}, 'pending', ${verificationCode})
    RETURNING id, status
  `;

  // Send verification code to guardian's email
  await enqueueEmail({
    type: 'guardian_verification',
    to: user.email,
    token: '',
    lang: 'vi',
    guardianCode: verificationCode,
    guardianName: user.email,
    childEmail: child.email,
  }, c.env);

  return c.json({
    success: true,
    linkId: link.id,
    status: link.status,
    message: 'Guardian declaration submitted. A 6-digit verification code has been sent to your email.',
  });
});

// POST /guardian/verify — guardian verifies identity via email confirmation
// Body: { linkId, verificationCode }
guardian.post('/verify', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { linkId, verificationCode } = body;

  if (!linkId || !verificationCode) {
    return c.json({ error: 'missing_fields', required: ['linkId', 'verificationCode'] }, 400);
  }

  const sql = getDb(c.env);

  const guardianRecord = await sql`SELECT id FROM guardians WHERE user_id = ${user.id}`;
  if (guardianRecord.length === 0) {
    return c.json({ error: 'not_a_guardian' }, 403);
  }

  const [link] = await sql`
    SELECT id, status FROM guardian_links
    WHERE id = ${linkId} AND guardian_id = ${guardianRecord[0].id}
  `;
  if (!link) return c.json({ error: 'link_not_found' }, 404);
  if (link.status === 'approved') return c.json({ error: 'already_approved' }, 400);

  // Verify against stored verification code in DB
  if (!/^\d{6}$/.test(verificationCode)) {
    return c.json({ error: 'invalid_code_format', message: 'Mã xác nhận phải có 6 chữ số.' }, 400);
  }

  const [linkWithCode] = await sql`
    SELECT id, status, invitation_token FROM guardian_links
    WHERE id = ${linkId} AND guardian_id = ${guardianRecord[0].id}
  `;
  if (!linkWithCode) return c.json({ error: 'link_not_found' }, 404);
  if (linkWithCode.status === 'approved') return c.json({ error: 'already_approved' }, 400);

  if (!linkWithCode.invitation_token) {
    return c.json({ error: 'no_code_sent', message: 'Chưa có mã xác nhận nào được gửi. Vui lòng khai báo lại.' }, 400);
  }

  if (linkWithCode.invitation_token !== verificationCode) {
    return c.json({ error: 'invalid_code', message: 'Mã xác nhận không đúng.' }, 400);
  }

  // Approve the link
  await sql`
    UPDATE guardian_links SET status = 'approved', approved_at = now()
    WHERE id = ${linkId}
  `;

  // Mark guardian as verified
  await sql`
    UPDATE guardians SET verification_status = 'verified', verified_at = now()
    WHERE id = ${guardianRecord[0].id}
  `;

  return c.json({ success: true, message: 'Guardian verified and link approved.' });
});

// GET /guardian/declarations — list guardian declarations made by current user
guardian.get('/declarations', async (c) => {
  const user = c.get('user');
  const sql = getDb(c.env);

  const guardianRecord = await sql`SELECT id, relationship, verification_method, verification_status FROM guardians WHERE user_id = ${user.id}`;
  if (guardianRecord.length === 0) {
    return c.json({ declarations: [], isGuardian: false });
  }

  const links = await sql`
    SELECT gl.id, gl.status, gl.created_at, gl.approved_at,
           u.email as learner_email,
           p.display_name as learner_name
    FROM guardian_links gl
    JOIN users u ON u.id = gl.learner_id
    LEFT JOIN profiles p ON p.user_id = gl.learner_id
    WHERE gl.guardian_id = ${guardianRecord[0].id}
    ORDER BY gl.created_at DESC
  `;

  return c.json({
    isGuardian: true,
    guardianInfo: guardianRecord[0],
    declarations: links,
  });
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
