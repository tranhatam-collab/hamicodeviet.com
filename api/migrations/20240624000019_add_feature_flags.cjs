/**
 * GĐ7: Feature flags — runtime feature toggles
 */
module.exports = {
  up(pgm) {
    pgm.createTable('feature_flags', {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      key: { type: 'text', notNull: true, unique: true },
      description: { type: 'text' },
      enabled: { type: 'boolean', notNull: true, default: false },
      rollout_percentage: { type: 'integer', notNull: true, default: 0 },
      target_users: { type: 'jsonb', default: '[]' },
      metadata: { type: 'jsonb', default: '{}' },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
      updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    });
    pgm.createIndex('feature_flags', 'key');
  },
  down(pgm) { pgm.dropTable('feature_flags'); },
};
