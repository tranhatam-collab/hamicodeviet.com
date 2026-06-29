const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await c.connect();
  await c.query("INSERT INTO pgmigrations (name, run_on) VALUES ('20240624000013_add_guardian_verify_columns', now()) ON CONFLICT DO NOTHING");
  await c.query("INSERT INTO pgmigrations (name, run_on) VALUES ('20240624000014_add_ai_usage', now()) ON CONFLICT DO NOTHING");
  console.log('Marked');
  await c.end();
})();
