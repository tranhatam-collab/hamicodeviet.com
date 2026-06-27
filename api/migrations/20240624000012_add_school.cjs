/**
 * P2.3: School — institutional accounts, classes, teachers, assignments
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Schools — institutional accounts
  pgm.createTable('schools', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    name_vi: { type: 'text' },
    type: { type: 'text', notNull: true, default: 'school' },
    country: { type: 'text', notNull: true, default: 'VN' },
    address: { type: 'text' },
    website: { type: 'text' },
    logo_url: { type: 'text' },
    admin_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    plan: { type: 'text', notNull: true, default: 'free' },
    max_students: { type: 'integer', default: 50 },
    status: { type: 'text', notNull: true, default: 'active' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('schools', 'admin_id');

  // School members — teachers + students
  pgm.createTable('school_members', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    school_id: { type: 'uuid', notNull: true, references: 'schools(id)', onDelete: 'cascade' },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    role: { type: 'text', notNull: true, default: 'student' },
    invited_by: { type: 'uuid', references: 'users(id)' },
    status: { type: 'text', notNull: true, default: 'pending' },
    joined_at: { type: 'timestamp' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('school_members', 'uq_school_member', 'UNIQUE(school_id, user_id)');
  pgm.createIndex('school_members', 'user_id');

  // Classes — groups within a school
  pgm.createTable('school_classes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    school_id: { type: 'uuid', notNull: true, references: 'schools(id)', onDelete: 'cascade' },
    name: { type: 'text', notNull: true },
    description: { type: 'text' },
    teacher_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    grade_level: { type: 'text' },
    subject: { type: 'text' },
    enrollment_code: { type: 'text', unique: true },
    max_students: { type: 'integer', default: 30 },
    status: { type: 'text', notNull: true, default: 'active' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('school_classes', 'school_id');
  pgm.createIndex('school_classes', 'teacher_id');

  // Class enrollments
  pgm.createTable('class_enrollments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    class_id: { type: 'uuid', notNull: true, references: 'school_classes(id)', onDelete: 'cascade' },
    student_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    status: { type: 'text', notNull: true, default: 'active' },
    enrolled_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('class_enrollments', 'uq_class_enrollment', 'UNIQUE(class_id, student_id)');

  // Assignments — teacher-created tasks for classes
  pgm.createTable('school_assignments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    class_id: { type: 'uuid', notNull: true, references: 'school_classes(id)', onDelete: 'cascade' },
    teacher_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    title: { type: 'text', notNull: true },
    description: { type: 'text' },
    type: { type: 'text', notNull: true, default: 'exercise' },
    exercise_id: { type: 'uuid', references: 'codelab_exercises(id)' },
    due_date: { type: 'timestamp' },
    points_possible: { type: 'integer', default: 100 },
    status: { type: 'text', notNull: true, default: 'active' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('school_assignments', 'class_id');

  // Assignment submissions
  pgm.createTable('assignment_submissions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    assignment_id: { type: 'uuid', notNull: true, references: 'school_assignments(id)', onDelete: 'cascade' },
    student_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    content: { type: 'text' },
    submission_data: { type: 'jsonb' },
    status: { type: 'text', notNull: true, default: 'submitted' },
    grade: { type: 'integer' },
    feedback: { type: 'text' },
    graded_by: { type: 'uuid', references: 'users(id)' },
    graded_at: { type: 'timestamp' },
    submitted_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('assignment_submissions', 'uq_assignment_submission', 'UNIQUE(assignment_id, student_id)');
};

exports.down = (pgm) => {
  pgm.dropTable('assignment_submissions');
  pgm.dropTable('school_assignments');
  pgm.dropTable('class_enrollments');
  pgm.dropTable('school_classes');
  pgm.dropTable('school_members');
  pgm.dropTable('schools');
};
