/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Audit logs table
  pgm.createTable('audit_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    actor_id: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'set null',
    },
    actor_type: {
      type: 'text',
      notNull: true,
    },
    action: {
      type: 'text',
      notNull: true,
    },
    resource_type: {
      type: 'text',
      notNull: true,
    },
    resource_id: {
      type: 'text',
    },
    permission: {
      type: 'text',
    },
    reason: {
      type: 'text',
    },
    changes: {
      type: 'jsonb',
    },
    ip: {
      type: 'text',
    },
    user_agent: {
      type: 'text',
    },
    request_id: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('audit_logs', 'actor_id');
  pgm.createIndex('audit_logs', 'resource_type');
  pgm.createIndex('audit_logs', 'resource_id');
  pgm.createIndex('audit_logs', 'created_at');

  // Security events table
  pgm.createTable('security_events', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    event_type: {
      type: 'text',
      notNull: true,
    },
    severity: {
      type: 'text',
      notNull: true,
    },
    user_id: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'set null',
    },
    ip: {
      type: 'text',
    },
    user_agent: {
      type: 'text',
    },
    details: {
      type: 'jsonb',
    },
    request_id: {
      type: 'text',
    },
    resolved: {
      type: 'boolean',
      default: false,
    },
    resolved_at: {
      type: 'timestamp',
    },
    resolved_by: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'set null',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('security_events', 'event_type');
  pgm.createIndex('security_events', 'severity');
  pgm.createIndex('security_events', 'user_id');
  pgm.createIndex('security_events', 'created_at');
  pgm.createIndex('security_events', 'resolved');
};

/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('security_events');
  pgm.dropTable('audit_logs');
};
