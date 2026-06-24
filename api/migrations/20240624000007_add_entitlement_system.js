/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Entitlements table
  pgm.createTable('entitlements', {
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
    entitlement_type: {
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
    granted_by: {
      type: 'text',
    },
    reason: {
      type: 'text',
    },
    expires_at: {
      type: 'timestamp',
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

  pgm.createIndex('entitlements', 'user_id');
  pgm.createIndex('entitlements', 'entitlement_type');
  pgm.createIndex('entitlements', 'resource_type');
  pgm.createIndex('entitlements', 'expires_at');
  pgm.createIndex('entitlements', 'active');

  // Entitlement definitions table
  pgm.createTable('entitlement_definitions', {
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
    entitlement_type: {
      type: 'text',
      notNull: true,
    },
    resource_type: {
      type: 'text',
      notNull: true,
    },
    auto_grant_on_subscription: {
      type: 'text',
    },
    auto_revoke_on_subscription: {
      type: 'boolean',
      default: false,
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

  // Insert default entitlement definitions
  pgm.sql`
    INSERT INTO entitlement_definitions (id, name, name_vi, description, description_vi, entitlement_type, resource_type, auto_grant_on_subscription, auto_revoke_on_subscription)
    VALUES
      ('course_access', 'Course Access', 'Truy cập khóa học', 'Access to specific courses', 'Truy cập các khóa học cụ thể', 'access', 'course', null, false),
      ('all_courses', 'All Courses', 'Tất cả khóa học', 'Access to all courses', 'Truy cập tất cả khóa học', 'access', 'course', 'pro,premium', true),
      ('certificate', 'Certificate', 'Chứng chỉ', 'Generate certificates', 'Tạo chứng chỉ', 'feature', 'certificate', 'pro,premium', true),
      ('mentorship', 'Mentorship', 'Hướng dẫn', 'Access to mentorship', 'Truy cập hướng dẫn', 'feature', 'mentorship', 'premium', true),
      ('priority_support', 'Priority Support', 'Hỗ trợ ưu tiên', 'Priority customer support', 'Hỗ trợ khách hàng ưu tiên', 'feature', 'support', 'pro,premium', true),
      ('ai_tutor', 'AI Tutor', 'AI gia sư', 'Access to AI tutoring', 'Truy cập AI gia sư', 'feature', 'ai', 'premium', true),
      ('community_access', 'Community Access', 'Truy cập cộng đồng', 'Access to community forums', 'Truy cập diễn đàn cộng đồng', 'access', 'community', 'learner,pro,premium', true)
  `;
};

/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('entitlement_definitions');
  pgm.dropTable('entitlements');
};
