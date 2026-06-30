const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await client.connect();

  // Total tables
  const r1 = await client.query("SELECT count(*) as cnt FROM pg_tables WHERE schemaname='public'");
  console.log('=== DATABASE EVIDENCE ===');
  console.log('Total tables:', r1.rows[0].cnt);

  // List all tables
  const r2 = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  console.log('\nTables:');
  r2.rows.forEach((r, i) => console.log(`  ${i+1}. ${r.tablename}`));

  // Row counts for key tables
  const keyTables = ['users', 'profiles', 'roles', 'sessions', 'guardians', 'consents', 'courses', 'lessons', 'ai_agents', 'ai_conversations', 'codelab_exercises', 'marketplace_listings', 'schools', 'portfolios', 'certificates', 'notifications', 'feature_flags', 'audit_logs'];
  console.log('\nRow counts:');
  for (const t of keyTables) {
    try {
      const r = await client.query(`SELECT count(*) as cnt FROM ${t}`);
      console.log(`  ${t}: ${r.rows[0].cnt}`);
    } catch (e) {
      console.log(`  ${t}: ERROR (${e.message})`);
    }
  }

  // Migrations
  const r3 = await client.query("SELECT count(*) as cnt FROM pgmigrations");
  console.log('\nMigrations applied:', r3.rows[0].cnt);

  // RLS status
  const r4 = await client.query(`
    SELECT relname, relrowsecurity
    FROM pg_class
    WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
    ORDER BY relname
  `);
  const rlsEnabled = r4.rows.filter(r => r.relrowsecurity).map(r => r.relname);
  console.log('\nRLS enabled tables:', rlsEnabled.length);
  rlsEnabled.forEach(t => console.log(`  ${t}`));

  await client.end();
})();
