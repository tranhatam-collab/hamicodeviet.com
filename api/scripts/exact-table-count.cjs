const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await client.connect();
  const r = await client.query("SELECT count(*) as cnt FROM pg_tables WHERE schemaname='public'");
  console.log('EXACT count: ' + r.rows[0].cnt);
  const r2 = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  r2.rows.forEach((row, i) => console.log((i+1) + '. ' + row.tablename));
  await client.end();
})();
