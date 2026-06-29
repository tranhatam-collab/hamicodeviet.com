/**
 * GĐ5: Portfolio system — evidence-based projects with privacy levels
 */
module.exports = {
  up(pgm) {
    pgm.createTable('portfolios', {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
      title: { type: 'text', notNull: true },
      description: { type: 'text' },
      project_url: { type: 'text' },
      repo_url: { type: 'text' },
      thumbnail_url: { type: 'text' },
      tech_stack: { type: 'jsonb', default: '{}' },
      evidence: { type: 'jsonb', default: '[]' },
      privacy_level: { type: 'text', notNull: true, default: 'private' }, // private, guardian_only, link_only, public
      status: { type: 'text', notNull: true, default: 'draft' }, // draft, submitted, reviewed, published
      review_score: { type: 'integer' },
      review_feedback: { type: 'text' },
      reviewed_by: { type: 'uuid', references: 'users(id)' },
      reviewed_at: { type: 'timestamp' },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
      updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    });
    pgm.createIndex('portfolios', 'user_id');
    pgm.createIndex('portfolios', 'privacy_level');
    pgm.createIndex('portfolios', 'status');
  },
  down(pgm) {
    pgm.dropTable('portfolios');
  },
};
