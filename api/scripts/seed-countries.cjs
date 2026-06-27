// Seed country policies with correct column names
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  const countries = [
    // [code, name, status, age_majority, age_digital_consent, guardian_free, guardian_paid, child_assent, teacher_auth, school_auth, portfolio, ai, marketplace, payout, cooling_off, currency, payment_methods, terms, privacy]
    ['US', 'United States', 'ACTIVE', 18, 13, true, true, 13, true, true, true, true, true, true, 14, 'USD', '{paypal}', '1.0', '1.0'],
    ['GB', 'United Kingdom', 'ACTIVE', 18, 13, true, true, 13, true, true, true, true, true, true, 14, 'GBP', '{paypal}', '1.0', '1.0'],
    ['SG', 'Singapore', 'ACTIVE', 18, 13, true, true, 13, true, true, true, true, true, true, 14, 'SGD', '{paypal}', '1.0', '1.0'],
    ['AU', 'Australia', 'ACTIVE', 18, 13, true, true, 13, true, true, true, true, true, true, 14, 'AUD', '{paypal}', '1.0', '1.0'],
    ['CA', 'Canada', 'ACTIVE', 18, 13, true, true, 13, true, true, true, true, true, true, 14, 'CAD', '{paypal}', '1.0', '1.0'],
    ['KR', 'South Korea', 'ACTIVE', 19, 14, true, true, 14, true, true, true, true, true, true, 14, 'KRW', '{paypal}', '1.0', '1.0'],
    ['JP', 'Japan', 'ACTIVE', 18, 13, true, true, 13, true, true, true, true, true, true, 14, 'JPY', '{paypal}', '1.0', '1.0'],
    ['DE', 'Germany', 'ACTIVE', 18, 16, true, true, 16, true, true, true, true, true, true, 14, 'EUR', '{paypal}', '1.0', '1.0'],
    ['FR', 'France', 'ACTIVE', 18, 15, true, true, 15, true, true, true, true, true, true, 14, 'EUR', '{paypal}', '1.0', '1.0'],
    ['PH', 'Philippines', 'ACTIVE', 18, 13, false, true, 13, true, true, true, true, true, true, 14, 'PHP', '{paypal}', '1.0', '1.0'],
    ['TH', 'Thailand', 'ACTIVE', 18, 13, false, true, 13, true, true, true, true, true, true, 14, 'THB', '{paypal}', '1.0', '1.0'],
    ['MY', 'Malaysia', 'ACTIVE', 18, 13, true, true, 13, true, true, true, true, true, true, 14, 'MYR', '{paypal}', '1.0', '1.0'],
    ['ID', 'Indonesia', 'ACTIVE', 18, 13, false, true, 13, true, true, true, true, true, true, 14, 'IDR', '{paypal}', '1.0', '1.0'],
  ];

  for (const c of countries) {
    const existing = await client.query('SELECT 1 FROM country_policies WHERE country_code = $1', [c[0]]);
    if (existing.rows.length > 0) {
      console.log('EXISTS: ' + c[0]);
      continue;
    }
    await client.query(
      `INSERT INTO country_policies (
        country_code, country_name, service_status, age_of_majority, age_of_digital_consent,
        guardian_required_for_free_account, guardian_required_for_paid_account, child_assent_age,
        teacher_may_authorize, school_may_authorize,
        public_portfolio_allowed, ai_features_allowed, marketplace_allowed, payout_allowed,
        cooling_off_days, currency, payment_methods, terms_version, privacy_version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT (country_code) DO NOTHING`,
      c
    );
    console.log('INSERTED: ' + c[0]);
  }

  const count = await client.query('SELECT count(*) as cnt, string_agg(country_code, \', \') as codes FROM country_policies');
  console.log('\nTotal: ' + count.rows[0].cnt + ' countries: ' + count.rows[0].codes);

  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
