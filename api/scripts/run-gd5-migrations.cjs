const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({ connectionString: process.env.DATABASE_URL });

(async () => {
  await client.connect();

  // Run portfolio migration
  console.log('Running portfolio migration...');
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title text NOT NULL,
        description text,
        project_url text,
        repo_url text,
        thumbnail_url text,
        tech_stack jsonb DEFAULT '{}',
        evidence jsonb DEFAULT '[]',
        privacy_level text NOT NULL DEFAULT 'private',
        status text NOT NULL DEFAULT 'draft',
        review_score integer,
        review_feedback text,
        reviewed_by uuid REFERENCES users(id),
        reviewed_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_portfolios_privacy_level ON portfolios(privacy_level)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_portfolios_status ON portfolios(status)');
    console.log('  portfolios table created');
  } catch (e) { console.log('  portfolios:', e.message); }

  // Run certificates migration
  console.log('Running certificates migration...');
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        certificate_id text NOT NULL UNIQUE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id uuid REFERENCES courses(id),
        course_title text,
        recipient_name text NOT NULL,
        recipient_email text NOT NULL,
        issue_date timestamp NOT NULL DEFAULT now(),
        expiry_date timestamp,
        score integer,
        evidence_ids jsonb DEFAULT '[]',
        status text NOT NULL DEFAULT 'active',
        issued_by uuid REFERENCES users(id),
        qr_code_url text,
        metadata jsonb DEFAULT '{}',
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON certificates(certificate_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status)');
    console.log('  certificates table created');
  } catch (e) { console.log('  certificates:', e.message); }

  // Mark migrations
  await client.query("INSERT INTO pgmigrations (name, run_on) VALUES ('20240624000016_add_portfolio', now()) ON CONFLICT DO NOTHING");
  await client.query("INSERT INTO pgmigrations (name, run_on) VALUES ('20240624000017_add_certificates', now()) ON CONFLICT DO NOTHING");
  console.log('Marked as run.');

  // Count tables
  const r = await client.query("SELECT count(*) as cnt FROM pg_tables WHERE schemaname='public'");
  console.log('Total tables:', r.rows[0].cnt);

  await client.end();
})();
