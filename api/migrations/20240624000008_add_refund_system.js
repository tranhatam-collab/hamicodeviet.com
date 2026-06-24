/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Refunds table
  pgm.createTable('refunds', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    payment_id: {
      type: 'uuid',
      notNull: true,
      references: 'payments(id)',
      onDelete: 'cascade',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'cascade',
    },
    amount_cents: {
      type: 'integer',
      notNull: true,
    },
    currency: {
      type: 'text',
      notNull: true,
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'pending',
    },
    reason: {
      type: 'text',
    },
    paypal_refund_id: {
      type: 'text',
    },
    processed_by: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'set null',
    },
    processed_at: {
      type: 'timestamp',
    },
    metadata: {
      type: 'jsonb',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('refunds', 'payment_id');
  pgm.createIndex('refunds', 'user_id');
  pgm.createIndex('refunds', 'status');
  pgm.createIndex('refunds', 'paypal_refund_id');
};

/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('refunds');
};
