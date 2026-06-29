/**
 * GĐ5: Certificate system — evidence-based certificates with QR verify
 */
module.exports = {
  up(pgm) {
    pgm.createTable('certificates', {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      certificate_id: { type: 'text', notNull: true, unique: true }, // Human-readable: HAMI-XXXX-XXXX
      user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
      course_id: { type: 'uuid', references: 'courses(id)' },
      course_title: { type: 'text' },
      recipient_name: { type: 'text', notNull: true },
      recipient_email: { type: 'text', notNull: true },
      issue_date: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
      expiry_date: { type: 'timestamp' },
      score: { type: 'integer' },
      evidence_ids: { type: 'jsonb', default: '[]' }, // links to portfolio items
      status: { type: 'text', notNull: true, default: 'active' }, // active, revoked, expired
      issued_by: { type: 'uuid', references: 'users(id)' },
      qr_code_url: { type: 'text' },
      metadata: { type: 'jsonb', default: '{}' },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    });
    pgm.createIndex('certificates', 'certificate_id');
    pgm.createIndex('certificates', 'user_id');
    pgm.createIndex('certificates', 'status');
  },
  down(pgm) {
    pgm.dropTable('certificates');
  },
};
