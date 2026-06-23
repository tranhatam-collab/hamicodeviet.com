import { Hono } from 'hono';
import { getDb } from '../lib/db';

const countryPolicy = new Hono<AppBindings>();

// GET /country-policy — list all configured countries
countryPolicy.get('/', async (c) => {
  const sql = getDb(c.env);

  const policies = await sql`
    SELECT country_code, country_name, service_status, age_of_majority,
           age_of_digital_consent, guardian_required_for_free_account,
           guardian_required_for_paid_account, child_assent_age,
           currency, payment_methods, terms_version, privacy_version
    FROM country_policies
    ORDER BY country_name
  `;

  return c.json({ policies });
});

// GET /country-policy/:code — get policy for a country
countryPolicy.get('/:code', async (c) => {
  const code = c.req.param('code').toUpperCase();
  const sql = getDb(c.env);

  const [policy] = await sql`
    SELECT * FROM country_policies WHERE country_code = ${code}
  `;

  if (!policy) {
    return c.json({ error: 'country_not_configured', service_status: 'BLOCKED' }, 404);
  }

  return c.json({ policy });
});

// GET /country-policy/:code/consent-checklist — return mandatory + optional consents for country
countryPolicy.get('/:code/consent-checklist', async (c) => {
  const code = c.req.param('code').toUpperCase();
  const sql = getDb(c.env);
  const lang = (c.req.header('accept-language') || 'vi').startsWith('en') ? 'en' : 'vi';

  const [policy] = await sql`
    SELECT * FROM country_policies WHERE country_code = ${code}
  `;

  if (!policy) {
    return c.json({ error: 'country_not_configured' }, 404);
  }

  const rows = await sql`
    SELECT consent_type, category, name_en, name_vi, description_en, description_vi,
           default_state, requires_guardian, requires_child_assent, sort_order
    FROM consent_types
    ORDER BY sort_order
  `;

  const consentTypes = (rows as any[]).map((ct) => ({
    consent_type: ct.consent_type,
    category: ct.category,
    name: lang === 'en' ? ct.name_en : ct.name_vi,
    description: lang === 'en' ? ct.description_en : ct.description_vi,
    default_state: ct.default_state,
    requires_guardian: ct.requires_guardian,
    requires_child_assent: ct.requires_child_assent,
    sort_order: ct.sort_order,
  }));

  // Filter based on country policy
  const filtered = consentTypes.filter((ct) => {
    if (ct.consent_type === 'marketplace' && !policy.marketplace_allowed) return false;
    if (ct.consent_type === 'creator_profile' && !policy.marketplace_allowed) return false;
    if (ct.consent_type === 'public_portfolio' && !policy.public_portfolio_allowed) return false;
    if (ct.consent_type === 'ai_training_contribution' && !policy.ai_features_allowed) return false;
    return true;
  });

  return c.json({
    country: code,
    service_status: policy.service_status,
    age_of_majority: policy.age_of_majority,
    age_of_digital_consent: policy.age_of_digital_consent,
    guardian_required_for_free: policy.guardian_required_for_free_account,
    guardian_required_for_paid: policy.guardian_required_for_paid_account,
    child_assent_age: policy.child_assent_age,
    consent_checklist: filtered,
  });
});

export default countryPolicy;
