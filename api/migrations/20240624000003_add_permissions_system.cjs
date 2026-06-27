/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Permissions table
  pgm.createTable('permissions', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    name: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    description: {
      type: 'text',
    },
    resource_type: {
      type: 'text',
      notNull: true,
    },
    action: {
      type: 'text',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Role permissions table
  pgm.createTable('role_permissions', {
    role_id: {
      type: 'text',
      primaryKey: true,
      references: 'roles(id)',
      onDelete: 'cascade',
    },
    permission_id: {
      type: 'text',
      primaryKey: true,
      references: 'permissions(id)',
      onDelete: 'cascade',
    },
    granted_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Insert default permissions
  pgm.sql(`
    INSERT INTO permissions (id, name, description, resource_type, action) VALUES
    ('user.read', 'Read User', 'Can read user information', 'user', 'read'),
    ('user.write', 'Write User', 'Can modify user information', 'user', 'write'),
    ('user.delete', 'Delete User', 'Can delete users', 'user', 'delete'),
    ('course.read', 'Read Course', 'Can read course information', 'course', 'read'),
    ('course.write', 'Write Course', 'Can modify course information', 'course', 'write'),
    ('course.delete', 'Delete Course', 'Can delete courses', 'course', 'delete'),
    ('payment.read', 'Read Payment', 'Can read payment information', 'payment', 'read'),
    ('payment.write', 'Write Payment', 'Can modify payment information', 'payment', 'write'),
    ('payment.delete', 'Delete Payment', 'Can delete payments', 'payment', 'delete'),
    ('admin.read', 'Read Admin', 'Can read admin information', 'admin', 'read'),
    ('admin.write', 'Write Admin', 'Can modify admin settings', 'admin', 'write'),
    ('admin.delete', 'Delete Admin', 'Can delete admin data', 'admin', 'delete'),
    ('content.moderate', 'Moderate Content', 'Can moderate user content', 'content', 'moderate'),
    ('content.publish', 'Publish Content', 'Can publish content', 'content', 'publish'),
    ('security.view', 'View Security', 'Can view security events', 'security', 'read'),
    ('security.manage', 'Manage Security', 'Can manage security settings', 'security', 'write')
  `);

  // Grant permissions to roles
  pgm.sql(`
    -- Admin permissions (all permissions)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'admin', id FROM permissions;

    -- Teacher permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'teacher', id FROM permissions 
    WHERE id IN ('user.read', 'course.read', 'course.write', 'content.moderate');

    -- Guardian permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'guardian', id FROM permissions 
    WHERE id IN ('user.read', 'course.read');

    -- Learner permissions (read-only)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'learner', id FROM permissions 
    WHERE id IN ('user.read', 'course.read');
  `);
};

/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('role_permissions');
  pgm.dropTable('permissions');
};
