const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await c.connect();
  const r = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='pgmigrations' ORDER BY ordinal_position");
  console.log(JSON.stringify(r.rows));
  const r2 = await c.query("SELECT * FROM pgmigrations LIMIT 3");
  console.log(JSON.stringify(r2.rows));
  await c.end();
})();
