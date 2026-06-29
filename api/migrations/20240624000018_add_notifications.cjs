/**
 * GĐ7: Notifications system — in-app notifications for users
 */
module.exports = {
  up(pgm) {
    pgm.createTable('notifications', {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
      type: { type: 'text', notNull: true },
      title: { type: 'text', notNull: true },
      body: { type: 'text' },
      data: { type: 'jsonb', default: '{}' },
      read: { type: 'boolean', notNull: true, default: false },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
      read_at: { type: 'timestamp' },
    });
    pgm.createIndex('notifications', 'user_id');
    pgm.createIndex('notifications', 'read', { where: 'read = false' });
  },
  down(pgm) { pgm.dropTable('notifications'); },
};
