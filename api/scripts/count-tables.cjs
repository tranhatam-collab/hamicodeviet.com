const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await client.connect();
  const r = await client.query("SELECT count(*) as cnt FROM pg_tables WHERE schemaname='public'");
  console.log('Exact count: ' + r.rows[0].cnt);
  const r2 = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  r2.rows.forEach(x => console.log(x.tablename));

  // Also check country_policies data
  const r3 = await client.query('SELECT * FROM country_policies');
  console.log('\n--- country_policies data ---');
  console.log('Rows: ' + r3.rows.length);
  r3.rows.forEach(x => console.log(JSON.stringify(x)));

  await client.end();
})();
