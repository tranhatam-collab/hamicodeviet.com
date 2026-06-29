const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({ connectionString: process.env.DATABASE_URL });

(async () => {
  await client.connect();

  // Check which migrations are already run
  const { rows: ran } = await client.query("SELECT name FROM pgmigrations ORDER BY name");
  const ranSet = new Set(ran.map(r => r.name));

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.cjs')).sort();

  const toRun = files.filter(f => !ranSet.has(f.replace('.cjs', '')) && !ranSet.has(f));
  console.log('Migrations to run:', toRun);

  for (const file of toRun) {
    console.log('Running:', file);
    const migration = require(path.join(migrationsDir, file));
    const pgm = {
      func: (s) => s,
      createTable: async (name, cols) => {
        // Skip if table exists
        const { rows } = await client.query("SELECT to_regclass($1) as exists", [`public.${name}`]);
        if (rows[0].exists) { console.log('  Table', name, 'already exists, skipping'); return; }
        const colDefs = Object.entries(cols).map(([col, def]) => {
          let s = `"${col}" ${def.type}`;
          if (def.primaryKey) s += ' PRIMARY KEY';
          if (def.notNull) s += ' NOT NULL';
          if (def.default) s += ` DEFAULT ${def.default}`;
          if (def.references) s += ` REFERENCES ${def.references}`;
          if (def.onDelete) s += ` ON DELETE ${def.onDelete}`;
          if (def.unique) s += ' UNIQUE';
          return s;
        }).join(', ');
        await client.query(`CREATE TABLE IF NOT EXISTS "${name}" (${colDefs})`);
        console.log('  Created table', name);
      },
      addColumns: async (table, cols) => {
        for (const [col, def] of Object.entries(cols)) {
          try {
            await client.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${col}" ${def.type}`);
            console.log('  Added column', col, 'to', table);
          } catch (e) { console.log('  Column', col, 'may already exist:', e.message); }
        }
      },
      createIndex: async (table, col) => {
        try { await client.query(`CREATE INDEX IF NOT EXISTS "idx_${table}_${col}" ON "${table}" ("${col}")`); } catch (e) {}
      },
      addConstraint: async (table, name, def) => {
        try { await client.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${name}" ${def}`); } catch (e) {}
      },
      dropTable: async (t) => {},
      dropColumns: async (t, c) => {},
    };
    try {
      await migration.up(pgm);
      // Mark as run
      const name = file.replace('.cjs', '');
      await client.query("INSERT INTO pgmigrations (name) VALUES ($1) ON CONFLICT DO NOTHING", [name]);
      console.log('  Marked as run:', name);
    } catch (e) {
      console.error('  ERROR:', e.message);
    }
  }

  console.log('Done.');
  await client.end();
})();
