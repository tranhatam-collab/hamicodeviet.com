/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Products table
  pgm.createTable('products', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'text',
      notNull: true,
    },
    name_vi: {
      type: 'text',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    description_vi: {
      type: 'text',
    },
    active: {
      type: 'boolean',
      notNull: true,
      default: true,
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

  // Prices table
  pgm.createTable('prices', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    product_id: {
      type: 'uuid',
      notNull: true,
      references: 'products(id)',
      onDelete: 'cascade',
    },
    stripe_price_id: {
      type: 'text',
      unique: true,
    },
    currency: {
      type: 'text',
      notNull: true,
      default: 'VND',
    },
    unit_amount: {
      type: 'integer',
      notNull: true,
    },
    recurring_interval: {
      type: 'text',
    },
    recurring_interval_count: {
      type: 'integer',
    },
    trial_period_days: {
      type: 'integer',
    },
    active: {
      type: 'boolean',
      notNull: true,
      default: true,
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

  pgm.createIndex('prices', 'product_id');
  pgm.createIndex('prices', 'stripe_price_id');

  // Plans table (simplified pricing plans)
  pgm.createTable('plans', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    name: {
      type: 'text',
      notNull: true,
    },
    name_vi: {
      type: 'text',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    description_vi: {
      type: 'text',
    },
    features: {
      type: 'jsonb',
      notNull: true,
    },
    price_id: {
      type: 'uuid',
      references: 'prices(id)',
      onDelete: 'set null',
    },
    active: {
      type: 'boolean',
      notNull: true,
      default: true,
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

  pgm.createIndex('plans', 'price_id');

  // Insert default product (Learning Platform)
  pgm.sql`
    INSERT INTO products (id, name, name_vi, description, description_vi, active)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'Learning Platform',
      'Nền tảng học tập',
      'Access to all courses and learning materials',
      'Truy cập tất cả khóa học và tài liệu học tập',
      true
    )
  `;

  // Insert default prices (will be updated with Stripe price IDs)
  pgm.sql`
    INSERT INTO prices (id, product_id, currency, unit_amount, recurring_interval, recurring_interval_count, active)
    VALUES
      ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'VND', 299000, 'month', 1, true),
      ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'VND', 499000, 'month', 1, true),
      ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'VND', 799000, 'month', 1, true)
  `;

  // Insert default plans
  pgm.sql`
    INSERT INTO plans (id, name, name_vi, description, description_vi, features, price_id, active)
    VALUES
      ('starter', 'Starter', 'Cơ bản', 'Perfect for beginners', 'Hoàn hảo cho người mới bắt đầu', '["Access to 3 courses", "Basic support", "Community access"]'::jsonb, '00000000-0000-0000-0000-000000000001', true),
      ('pro', 'Pro', 'Chuyên nghiệp', 'For serious learners', 'Dành cho người học nghiêm túc', '["Access to all courses", "Priority support", "Certificate", "Community access"]'::jsonb, '00000000-0000-0000-0000-000000000002', true),
      ('premium', 'Premium', 'Cao cấp', 'Full access with extras', 'Truy cập đầy đủ với tính năng bổ sung', '["Access to all courses", "24/7 support", "Certificate", "Mentorship", "Priority course access"]'::jsonb, '00000000-0000-0000-0000-000000000003', true)
  `;
};

/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('plans');
  pgm.dropTable('prices');
  pgm.dropTable('products');
};
