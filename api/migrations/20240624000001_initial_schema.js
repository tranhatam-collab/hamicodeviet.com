/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Core User Tables
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'text',
      notNull: true,
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'active',
    },
    email_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
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

  pgm.createTable('profiles', {
    user_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'cascade',
    },
    display_name: {
      type: 'text',
    },
    birth_year: {
      type: 'integer',
    },
    country: {
      type: 'text',
    },
    language: {
      type: 'text',
      default: 'vi',
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

  pgm.createTable('roles', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    name: {
      type: 'text',
      notNull: true,
    },
    description: {
      type: 'text',
    },
  });

  pgm.createTable('user_roles', {
    user_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'cascade',
    },
    role_id: {
      type: 'text',
      primaryKey: true,
      references: 'roles(id)',
      onDelete: 'cascade',
    },
  });

  pgm.createTable('sessions', {
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
    token_hash: {
      type: 'text',
      notNull: true,
    },
    expires_at: {
      type: 'timestamp',
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

  pgm.createIndex('sessions', 'token_hash');
  pgm.createIndex('sessions', 'user_id');

  // Authentication Tables
  pgm.createTable('email_verifications', {
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
    token_hash: {
      type: 'text',
      notNull: true,
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('email_verifications', 'token_hash');
  pgm.createIndex('email_verifications', 'user_id');

  pgm.createTable('password_resets', {
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
    token_hash: {
      type: 'text',
      notNull: true,
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    ip: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('password_resets', 'token_hash');
  pgm.createIndex('password_resets', 'user_id');

  // Guardian & Consent Tables
  pgm.createTable('guardians', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'cascade',
    },
    email: {
      type: 'text',
      notNull: true,
    },
    display_name: {
      type: 'text',
    },
    relationship: {
      type: 'text',
    },
    verification_method: {
      type: 'text',
    },
    verification_status: {
      type: 'text',
      default: 'pending',
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

  pgm.createIndex('guardians', 'user_id');
  pgm.createIndex('guardians', 'email');

  pgm.createTable('guardian_links', {
    guardian_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'guardians(id)',
      onDelete: 'cascade',
    },
    learner_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'cascade',
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'pending',
    },
    invitation_token: {
      type: 'text',
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

  pgm.createTable('policy_versions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    policy_type: {
      type: 'text',
      notNull: true,
    },
    version: {
      type: 'text',
      notNull: true,
    },
    content: {
      type: 'text',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createTable('consents', {
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
    policy_type: {
      type: 'text',
      notNull: true,
    },
    policy_version: {
      type: 'text',
      notNull: true,
    },
    consent_state: {
      type: 'text',
      notNull: true,
    },
    source: {
      type: 'text',
      notNull: true,
    },
    ip: {
      type: 'text',
    },
    country_code: {
      type: 'text',
    },
    policy_content_hash: {
      type: 'text',
    },
    acceptance_method: {
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
    withdrawn_at: {
      type: 'timestamp',
    },
  });

  pgm.createIndex('consents', 'user_id');

  pgm.createTable('consent_types', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    name: {
      type: 'text',
      notNull: true,
    },
    description: {
      type: 'text',
    },
  });

  pgm.createTable('country_policies', {
    country_code: {
      type: 'text',
      primaryKey: true,
    },
    policy_type: {
      type: 'text',
      primaryKey: true,
    },
    requirements: {
      type: 'jsonb',
      notNull: true,
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

  // Learning Tables
  pgm.createTable('courses', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    slug: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    track_id: {
      type: 'text',
    },
    title_vi: {
      type: 'text',
      notNull: true,
    },
    title_en: {
      type: 'text',
      notNull: true,
    },
    description_vi: {
      type: 'text',
    },
    description_en: {
      type: 'text',
    },
    level: {
      type: 'text',
      default: 'beginner',
    },
    duration_hours: {
      type: 'integer',
      default: 0,
    },
    price_cents: {
      type: 'integer',
      default: 0,
    },
    currency: {
      type: 'text',
      default: 'VND',
    },
    status: {
      type: 'text',
      default: 'draft',
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

  pgm.createTable('lessons_db', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    course_id: {
      type: 'uuid',
      notNull: true,
      references: 'courses(id)',
      onDelete: 'cascade',
    },
    title_vi: {
      type: 'text',
      notNull: true,
    },
    title_en: {
      type: 'text',
      notNull: true,
    },
    content_vi: {
      type: 'text',
    },
    content_en: {
      type: 'text',
    },
    objectives: {
      type: 'jsonb',
    },
    age_range: {
      type: 'text',
    },
    level: {
      type: 'text',
    },
    duration_minutes: {
      type: 'integer',
    },
    order: {
      type: 'integer',
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

  pgm.createIndex('lessons_db', 'course_id');

  pgm.createTable('enrollments', {
    user_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'cascade',
    },
    course_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'courses(id)',
      onDelete: 'cascade',
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'active',
    },
    enrolled_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    completed_at: {
      type: 'timestamp',
    },
  });

  pgm.createTable('lesson_progress', {
    user_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'cascade',
    },
    lesson_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'lessons_db(id)',
      onDelete: 'cascade',
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'not_started',
    },
    started_at: {
      type: 'timestamp',
    },
    completed_at: {
      type: 'timestamp',
    },
    time_spent_sec: {
      type: 'integer',
      default: 0,
    },
  });

  // Payment Tables
  pgm.createTable('subscriptions', {
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
    plan_id: {
      type: 'text',
      notNull: true,
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'active',
    },
    stripe_customer_id: {
      type: 'text',
    },
    stripe_subscription_id: {
      type: 'text',
    },
    current_period_start: {
      type: 'timestamp',
    },
    current_period_end: {
      type: 'timestamp',
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

  pgm.createIndex('subscriptions', 'user_id');
  pgm.createIndex('subscriptions', 'stripe_subscription_id');

  pgm.createTable('payments', {
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
    },
    provider: {
      type: 'text',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    stripe_checkout_session_id: {
      type: 'text',
    },
    metadata: {
      type: 'jsonb',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('payments', 'user_id');
  pgm.createIndex('payments', 'stripe_checkout_session_id');

  // Certificate Tables
  pgm.createTable('certificates', {
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
    course_id: {
      type: 'uuid',
      notNull: true,
      references: 'courses(id)',
      onDelete: 'cascade',
    },
    certificate_number: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('certificates', 'user_id');
  pgm.createIndex('certificates', 'course_id');

  // Insert default roles
  pgm.sql(`
    INSERT INTO roles (id, name, description) VALUES
    ('learner', 'Learner', 'Regular learner account'),
    ('guardian', 'Guardian', 'Parent/guardian account'),
    ('teacher', 'Teacher', 'Teacher account'),
    ('admin', 'Admin', 'Administrator account')
  `);
};

/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  // Drop tables in reverse order due to foreign key constraints
  pgm.dropTable('certificates');
  pgm.dropTable('payments');
  pgm.dropTable('subscriptions');
  pgm.dropTable('lesson_progress');
  pgm.dropTable('enrollments');
  pgm.dropTable('lessons_db');
  pgm.dropTable('courses');
  pgm.dropTable('country_policies');
  pgm.dropTable('consent_types');
  pgm.dropTable('consents');
  pgm.dropTable('policy_versions');
  pgm.dropTable('guardian_links');
  pgm.dropTable('guardians');
  pgm.dropTable('password_resets');
  pgm.dropTable('email_verifications');
  pgm.dropTable('sessions');
  pgm.dropTable('user_roles');
  pgm.dropTable('roles');
  pgm.dropTable('profiles');
  pgm.dropTable('users');
};
