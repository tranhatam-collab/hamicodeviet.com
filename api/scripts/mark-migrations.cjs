// Mark all existing migrations as already run (DB schema was created manually before migrations existed)
const { Client } = require('pg');

const MIGRATIONS = [
  '20240624000001_initial_schema',
  '20240624000002_add_audit_tables',
  '20240624000003_add_permissions_system',
  '20240624000004_add_mfa_tables',
  '20240624000005_add_child_safety',
  '20240624000006_add_product_system',
  '20240624000007_add_entitlement_system',
  '20240624000008_add_refund_system',
  '20240624000009_add_ai_system',
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Create pgmigrations table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS pgmigrations (
      id serial PRIMARY KEY,
      name varchar(255) NOT NULL,
      run_on timestamp NOT NULL DEFAULT now()
    )
  `);

  for (const name of MIGRATIONS) {
    const res = await client.query('SELECT 1 FROM pgmigrations WHERE name = $1', [name]);
    if (res.rows.length === 0) {
      await client.query('INSERT INTO pgmigrations (name, run_on) VALUES ($1, now())', [name]);
      console.log('MARKED: ' + name);
    } else {
      console.log('EXISTS: ' + name);
    }
  }

  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
