// Fix audit_logs and security_events schema to match code expectations
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // Check audit_logs columns
  const auditCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='audit_logs' ORDER BY ordinal_position");
  const auditColNames = auditCols.rows.map(r => r.column_name);
  console.log('audit_logs columns: ' + auditColNames.join(', '));

  // Add missing columns
  const auditMissing = [
    ['permission', 'text'],
    ['reason', 'text'],
  ];
  for (const [col, type] of auditMissing) {
    if (!auditColNames.includes(col)) {
      await client.query(`ALTER TABLE audit_logs ADD COLUMN ${col} ${type}`);
      console.log('Added audit_logs.' + col);
    } else {
      console.log('EXISTS audit_logs.' + col);
    }
  }

  // Check security_events table
  const secCheck = await client.query("SELECT 1 FROM pg_tables WHERE tablename='security_events'");
  if (secCheck.rows.length === 0) {
    await client.query(`
      CREATE TABLE security_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type text NOT NULL,
        severity text NOT NULL DEFAULT 'medium',
        user_id uuid,
        ip text,
        user_agent text,
        details jsonb,
        request_id text,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    console.log('Created security_events table');
  } else {
    console.log('EXISTS security_events table');
  }

  // Verify
  const finalCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='audit_logs' ORDER BY ordinal_position");
  console.log('\nFinal audit_logs columns: ' + finalCols.rows.map(r => r.column_name).join(', '));

  await client.end();
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
