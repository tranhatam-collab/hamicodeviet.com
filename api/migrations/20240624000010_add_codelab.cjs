/**
 * P2.1: CodeLab — interactive coding exercises + sandbox
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // CodeLab exercises — interactive coding challenges
  pgm.createTable('codelab_exercises', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    slug: { type: 'text', notNull: true, unique: true },
    title: { type: 'text', notNull: true },
    title_vi: { type: 'text', notNull: true },
    description: { type: 'text' },
    description_vi: { type: 'text' },
    language: { type: 'text', notNull: true, default: 'python' },
    difficulty: { type: 'text', notNull: true, default: 'beginner' },
    category: { type: 'text', notNull: true, default: 'basics' },
    starter_code: { type: 'text' },
    solution_code: { type: 'text' },
    test_cases: { type: 'jsonb', notNull: true },
    hints: { type: 'jsonb' },
    time_limit_ms: { type: 'integer', default: 5000 },
    memory_limit_mb: { type: 'integer', default: 128 },
    points: { type: 'integer', notNull: true, default: 10 },
    age_restriction: { type: 'integer', default: 8 },
    active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('codelab_exercises', 'slug');
  pgm.createIndex('codelab_exercises', ['language', 'difficulty']);
  pgm.createIndex('codelab_exercises', 'category');

  // CodeLab submissions — user attempts
  pgm.createTable('codelab_submissions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    exercise_id: { type: 'uuid', notNull: true, references: 'codelab_exercises(id)', onDelete: 'cascade' },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    code: { type: 'text', notNull: true },
    language: { type: 'text', notNull: true },
    status: { type: 'text', notNull: true, default: 'pending' },
    test_results: { type: 'jsonb' },
    execution_time_ms: { type: 'integer' },
    memory_used_mb: { type: 'integer' },
    points_earned: { type: 'integer', default: 0 },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('codelab_submissions', ['user_id', 'exercise_id']);
  pgm.createIndex('codelab_submissions', 'status');

  // CodeLab progress — track completion per user
  pgm.createTable('codelab_progress', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    exercise_id: { type: 'uuid', notNull: true, references: 'codelab_exercises(id)', onDelete: 'cascade' },
    status: { type: 'text', notNull: true, default: 'not_started' },
    attempts: { type: 'integer', notNull: true, default: 0 },
    best_score: { type: 'integer', default: 0 },
    first_completed_at: { type: 'timestamp' },
    last_attempt_at: { type: 'timestamp' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('codelab_progress', 'uq_codelab_progress_user_exercise', 'UNIQUE(user_id, exercise_id)');
};

exports.down = (pgm) => {
  pgm.dropTable('codelab_progress');
  pgm.dropTable('codelab_submissions');
  pgm.dropTable('codelab_exercises');
};
