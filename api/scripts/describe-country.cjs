const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await client.connect();
  const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='country_policies' ORDER BY ordinal_position");
  console.log('country_policies columns:');
  cols.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ')'));

  const rows = await client.query('SELECT * FROM country_policies');
  console.log('\nRows: ' + rows.rows.length);
  rows.rows.forEach(r => console.log(JSON.stringify(r)));

  // Also check ai_agents
  const agents = await client.query('SELECT id, name, name_vi, agent_type, active FROM ai_agents ORDER BY id');
  console.log('\nAI agents: ' + agents.rows.length);
  agents.rows.forEach(r => console.log('  ' + r.id + ': ' + r.name + ' (' + r.agent_type + ') active=' + r.active));

  await client.end();
})();
