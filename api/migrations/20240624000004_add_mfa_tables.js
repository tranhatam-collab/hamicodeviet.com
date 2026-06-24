/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // MFA secrets table for TOTP
  pgm.createTable('mfa_secrets', {
    user_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'cascade',
    },
    secret: {
      type: 'text',
      notNull: true,
    },
    enabled: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    verified: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    backup_codes: {
      type: 'text[]',
      notNull: true,
      default: '{}',
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

  // MFA verification attempts log
  pgm.createTable('mfa_attempts', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'cascade',
    },
    code: {
      type: 'text',
    },
    success: {
      type: 'boolean',
      notNull: true,
    },
    ip: {
      type: 'text',
    },
    user_agent: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('mfa_attempts', 'user_id');
};

/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('mfa_attempts');
  pgm.dropTable('mfa_secrets');
};
