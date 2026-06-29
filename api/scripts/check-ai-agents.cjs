const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await client.connect();
  const r = await client.query('SELECT count(*) as cnt FROM ai_agents');
  console.log('ai_agents count:', r.rows[0].cnt);
  const r2 = await client.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_name='ai_agents' ORDER BY ordinal_position");
  console.log('columns:', r2.rows.map(x => x.column_name + ':' + x.data_type).join(', '));
  const r3 = await client.query('SELECT id, name, agent_type FROM ai_agents LIMIT 20');
  console.log('agents:', r3.rows.map(x => x.id + '/' + x.name + '/' + x.agent_type).join('\n  '));
  await client.end();
})();
