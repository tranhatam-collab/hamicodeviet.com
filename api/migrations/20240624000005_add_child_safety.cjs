/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Add age verification to profiles
  pgm.addColumns('profiles', {
    age_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    age_verification_method: {
      type: 'text',
    },
    age_verified_at: {
      type: 'timestamp',
    },
  });

  // Create child safety settings table
  pgm.createTable('child_safety_settings', {
    user_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'cascade',
    },
    portfolio_visibility: {
      type: 'text',
      notNull: true,
      default: 'private',
    },
    marketplace_access: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    ai_interactions_enabled: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    messaging_enabled: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    guardian_approval_required: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    guardian_approval_status: {
      type: 'text',
      default: 'not_required',
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

  pgm.createIndex('child_safety_settings', 'portfolio_visibility');
  pgm.createIndex('child_safety_settings', 'marketplace_access');

  // Update country policies to include age restrictions
  pgm.addColumns('country_policies', {
    minimum_age_for_payment: {
      type: 'integer',
      default: 18,
    },
    guardian_required_for_under: {
      type: 'integer',
      default: 13,
    },
    guardian_consent_required_for_under: {
      type: 'integer',
      default: 16,
    },
    ai_restrictions_for_under: {
      type: 'jsonb',
    },
  });
};

/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('child_safety_settings');
  pgm.dropColumns('profiles', ['age_verified', 'age_verification_method', 'age_verified_at']);
  pgm.dropColumns('country_policies', [
    'minimum_age_for_payment',
    'guardian_required_for_under',
    'guardian_consent_required_for_under',
    'ai_restrictions_for_under',
  ]);
};
