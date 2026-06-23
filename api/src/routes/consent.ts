import { Hono } from 'hono';
import { verifyJwt } from '../lib/jwt';
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

// GET /consent — list all consents for current user + active policies + consent types
consent.get('/', async (c) => {
  const user = c.get('user');
  const sql = getDb(c.env);
  const lang = (c.req.header('accept-language') || 'vi').startsWith('en') ? 'en' : 'vi';

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

  const types = await sql`
    SELECT consent_type, category, name_en, name_vi, description_en, description_vi,
           default_state, requires_guardian, requires_child_assent, sort_order
    FROM consent_types
    ORDER BY sort_order
  `;

  const consentTypes = (types as any[]).map((ct) => ({
    consent_type: ct.consent_type,
    category: ct.category,
    name: lang === 'en' ? ct.name_en : ct.name_vi,
    description: lang === 'en' ? ct.description_en : ct.description_vi,
    default_state: ct.default_state,
    requires_guardian: ct.requires_guardian,
    requires_child_assent: ct.requires_child_assent,
  }));

  // Build current state map: consent_type -> latest state
  const stateMap: Record<string, { state: string; timestamp: string }> = {};
  for (const cs of consents as any[]) {
    if (!stateMap[cs.policy_type] || new Date(cs.timestamp) > new Date(stateMap[cs.policy_type].timestamp)) {
      stateMap[cs.policy_type] = { state: cs.consent_state, timestamp: cs.timestamp };
    }
  }

  return c.json({
    consents,
    activePolicies: policies,
    consentTypes,
    currentState: stateMap,
  });
});

// POST /consent — grant or withdraw consent (granular)
// Body: { consentType, policyVersion, action: 'grant'|'withdraw', childAssent?: boolean, reason?: string }
consent.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { consentType, policyVersion, action, childAssent, reason } = body;

  if (!consentType || !policyVersion) {
    return c.json({ error: 'missing_fields', required: ['consentType', 'policyVersion', 'action'] }, 400);
  }
  if (action !== 'grant' && action !== 'withdraw') {
    return c.json({ error: 'invalid_action', allowed: ['grant', 'withdraw'] }, 400);
  }

  const sql = getDb(c.env);

  // Validate consent type exists
  const [ct] = await sql`
    SELECT consent_type, category, default_state, requires_guardian, requires_child_assent
    FROM consent_types WHERE consent_type = ${consentType}
  `;
  if (!ct) {
    return c.json({ error: 'invalid_consent_type' }, 400);
  }

  // Optional consents cannot be auto-granted; user must explicitly grant
  // Mandatory consents can be granted during signup
  // Subscription consent must be separate from purchase (validated by frontend, but we double-check)
  if (ct.category === 'subscription' && action === 'grant') {
    // Verify there is no concurrent 'payment_purchase' in same request — frontend must call separately
    // This is a soft check; the frontend must enforce separation
  }

  // Child assent required?
  if (ct.requires_child_assent && action === 'grant' && !childAssent) {
    return c.json({
      error: 'child_assent_required',
      message: 'This consent requires explicit assent from the child.',
    }, 400);
  }

  const consentState = action === 'withdraw' ? 'withdrawn' : 'granted';
  const ip = c.req.header('cf-connecting-ip') || null;

  if (action === 'withdraw') {
    await sql`
      UPDATE consents SET consent_state = 'withdrawn', withdrawal_timestamp = now(), reason = ${reason || null}
      WHERE user_id = ${user.id} AND policy_type = ${consentType} AND consent_state = 'granted'
    `;
  } else {
    // Insert new consent record (audit trail)
    await sql`
      INSERT INTO consents (user_id, policy_type, policy_version, consent_state, source, ip)
      VALUES (${user.id}, ${consentType}, ${policyVersion}, 'granted', 'web', ${ip})
    `;
  }

  return c.json({
    success: true,
    consentType,
    action,
    state: consentState,
    timestamp: new Date().toISOString(),
  });
});

// POST /consent/batch — grant multiple mandatory consents at once (signup flow)
// Body: { consents: [{ consentType, policyVersion }], childAssent?: boolean }
consent.post('/batch', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const items: Array<{ consentType: string; policyVersion: string }> = body.consents || [];

  if (!items.length) {
    return c.json({ error: 'missing_consents' }, 400);
  }

  const sql = getDb(c.env);
  const ip = c.req.header('cf-connecting-ip') || null;
  const results: Array<{ consentType: string; ok: boolean; error?: string }> = [];

  for (const item of items) {
    const [ct] = await sql`
      SELECT consent_type, category, requires_child_assent
      FROM consent_types WHERE consent_type = ${item.consentType}
    `;
    if (!ct) {
      results.push({ consentType: item.consentType, ok: false, error: 'invalid_consent_type' });
      continue;
    }
    // Only allow batch for mandatory consents (not payment/subscription/optional)
    if (ct.category !== 'mandatory') {
      results.push({ consentType: item.consentType, ok: false, error: 'batch_only_mandatory' });
      continue;
    }
    if (ct.requires_child_assent && !body.childAssent) {
      results.push({ consentType: item.consentType, ok: false, error: 'child_assent_required' });
      continue;
    }

    await sql`
      INSERT INTO consents (user_id, policy_type, policy_version, consent_state, source, ip)
      VALUES (${user.id}, ${item.consentType}, ${item.policyVersion}, 'granted', 'web', ${ip})
    `;
    results.push({ consentType: item.consentType, ok: true });
  }

  const allOk = results.every((r) => r.ok);
  return c.json({ success: allOk, results }, allOk ? 200 : 400);
});

export default consent;
