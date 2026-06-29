const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await client.connect();

  // Notifications table
  console.log('Creating notifications table...');
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type text NOT NULL,
        title text NOT NULL,
        body text,
        data jsonb DEFAULT '{}',
        read boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now(),
        read_at timestamp
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = false');
    console.log('  notifications table OK');
  } catch (e) { console.log('  notifications:', e.message); }

  // Feature flags table
  console.log('Creating feature_flags table...');
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        key text NOT NULL UNIQUE,
        description text,
        enabled boolean NOT NULL DEFAULT false,
        rollout_percentage integer NOT NULL DEFAULT 0,
        target_users jsonb DEFAULT '[]',
        metadata jsonb DEFAULT '{}',
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key)');
    console.log('  feature_flags table OK');
  } catch (e) { console.log('  feature_flags:', e.message); }

  // Seed default feature flags
  const defaultFlags = [
    ['codelab', 'CodeLab code runner', true, 100],
    ['marketplace', 'Marketplace listings', true, 100],
    ['marketplace_payments', 'Marketplace payment processing', false, 0],
    ['school_portals', 'School portal access', true, 100],
    ['ai_chat', 'AI Chat with 11 agents', true, 100],
    ['ai_quota', 'AI daily quota enforcement', true, 100],
    ['portfolio', 'Portfolio feature', true, 100],
    ['certificates', 'Certificate issuance', true, 100],
    ['gdpr_tools', 'GDPR self-service tools', true, 100],
    ['notifications', 'In-app notifications', true, 100],
  ];
  for (const [key, desc, enabled, pct] of defaultFlags) {
    await client.query(
      `INSERT INTO feature_flags (key, description, enabled, rollout_percentage)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO NOTHING`,
      [key, desc, enabled, pct]
    );
  }
  console.log('  seeded', defaultFlags.length, 'default flags');

  // Mark migrations
  await client.query("INSERT INTO pgmigrations (name, run_on) VALUES ('20240624000018_add_notifications', now()) ON CONFLICT DO NOTHING");
  await client.query("INSERT INTO pgmigrations (name, run_on) VALUES ('20240624000019_add_feature_flags', now()) ON CONFLICT DO NOTHING");

  const r = await client.query("SELECT count(*) as cnt FROM pg_tables WHERE schemaname='public'");
  console.log('Total tables:', r.rows[0].cnt);
  await client.end();
})();
