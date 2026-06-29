const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await client.connect();
  // Check if certificates table exists
  const { rows } = await client.query("SELECT to_regclass('public.certificates') as exists");
  if (rows[0].exists) {
    // Add missing columns
    const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='certificates'");
    const colSet = new Set(cols.rows.map(r => r.column_name));
    const needed = ['certificate_id','course_id','course_title','recipient_name','recipient_email','issue_date','expiry_date','score','evidence_ids','status','issued_by','qr_code_url','metadata'];
    for (const col of needed) {
      if (!colSet.has(col)) {
        try {
          let type = 'text';
          if (col === 'course_id' || col === 'issued_by') type = 'uuid';
          if (col === 'issue_date' || col === 'expiry_date') type = 'timestamp';
          if (col === 'score') type = 'integer';
          if (col === 'evidence_ids' || col === 'metadata') type = 'jsonb DEFAULT \'{}\'';
          if (col === 'certificate_id') type = 'text NOT NULL';
          if (col === 'recipient_name' || col === 'recipient_email') type = 'text NOT NULL';
          if (col === 'status') type = "text NOT NULL DEFAULT 'active'";
          await client.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS ${col} ${type}`);
          console.log('  Added column:', col);
        } catch (e) { console.log('  Column', col, ':', e.message); }
      }
    }
    // Add unique constraint on certificate_id
    try { await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_certificate_id ON certificates(certificate_id)'); } catch (e) {}
  } else {
    console.log('certificates table does not exist, creating...');
    await client.query(`
      CREATE TABLE certificates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        certificate_id text NOT NULL UNIQUE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id uuid REFERENCES courses(id),
        course_title text,
        recipient_name text NOT NULL,
        recipient_email text NOT NULL,
        issue_date timestamp NOT NULL DEFAULT now(),
        expiry_date timestamp,
        score integer,
        evidence_ids jsonb DEFAULT '[]',
        status text NOT NULL DEFAULT 'active',
        issued_by uuid REFERENCES users(id),
        qr_code_url text,
        metadata jsonb DEFAULT '{}',
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
  }
  await client.query('CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON certificates(certificate_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status)');
  console.log('certificates table fixed.');
  await client.end();
})();
