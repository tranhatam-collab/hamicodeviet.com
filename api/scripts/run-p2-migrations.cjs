// Run P2 migrations with raw SQL (simpler, more reliable)
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // === 010: CodeLab ===
  console.log('--- 010: CodeLab ---');
  await client.query(`CREATE TABLE IF NOT EXISTS codelab_exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    title_vi text NOT NULL,
    description text,
    description_vi text,
    language text NOT NULL DEFAULT 'python',
    difficulty text NOT NULL DEFAULT 'beginner',
    category text NOT NULL DEFAULT 'basics',
    starter_code text,
    solution_code text,
    test_cases jsonb NOT NULL,
    hints jsonb,
    time_limit_ms integer DEFAULT 5000,
    memory_limit_mb integer DEFAULT 128,
    points integer NOT NULL DEFAULT 10,
    age_restriction integer DEFAULT 8,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`);
  await client.query('CREATE INDEX IF NOT EXISTS idx_codelab_exercises_slug ON codelab_exercises(slug)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_codelab_exercises_lang_diff ON codelab_exercises(language, difficulty)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_codelab_exercises_category ON codelab_exercises(category)');
  console.log('OK: codelab_exercises');

  await client.query(`CREATE TABLE IF NOT EXISTS codelab_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id uuid NOT NULL REFERENCES codelab_exercises(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code text NOT NULL,
    language text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    test_results jsonb,
    execution_time_ms integer,
    memory_used_mb integer,
    points_earned integer DEFAULT 0,
    created_at timestamp NOT NULL DEFAULT now()
  )`);
  await client.query('CREATE INDEX IF NOT EXISTS idx_codelab_submissions_user_ex ON codelab_submissions(user_id, exercise_id)');
  console.log('OK: codelab_submissions');

  await client.query(`CREATE TABLE IF NOT EXISTS codelab_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES codelab_exercises(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'not_started',
    attempts integer NOT NULL DEFAULT 0,
    best_score integer DEFAULT 0,
    first_completed_at timestamp,
    last_attempt_at timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    UNIQUE(user_id, exercise_id)
  )`);
  console.log('OK: codelab_progress');

  // === 011: Marketplace ===
  console.log('\n--- 011: Marketplace ---');
  await client.query(`CREATE TABLE IF NOT EXISTS marketplace_listings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type text NOT NULL DEFAULT 'course',
    title text NOT NULL,
    title_vi text,
    description text,
    description_vi text,
    price_cents integer NOT NULL DEFAULT 0,
    currency text NOT NULL DEFAULT 'USD',
    category text NOT NULL DEFAULT 'programming',
    tags jsonb DEFAULT '{}',
    thumbnail_url text,
    preview_url text,
    content_metadata jsonb,
    status text NOT NULL DEFAULT 'draft',
    review_status text NOT NULL DEFAULT 'pending',
    review_notes text,
    reviewed_by uuid REFERENCES users(id),
    reviewed_at timestamp,
    age_restriction integer DEFAULT 8,
    language text DEFAULT 'vi',
    sales_count integer NOT NULL DEFAULT 0,
    rating_avg numeric DEFAULT 0,
    rating_count integer NOT NULL DEFAULT 0,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`);
  await client.query('CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON marketplace_listings(seller_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status, review_status)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings(category)');
  console.log('OK: marketplace_listings');

  await client.query(`CREATE TABLE IF NOT EXISTS marketplace_purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_id uuid REFERENCES payments(id),
    price_cents integer NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    status text NOT NULL DEFAULT 'completed',
    refunded_at timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    UNIQUE(listing_id, buyer_id)
  )`);
  await client.query('CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer ON marketplace_purchases(buyer_id)');
  console.log('OK: marketplace_purchases');

  await client.query(`CREATE TABLE IF NOT EXISTS marketplace_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating integer NOT NULL,
    review_text text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    UNIQUE(listing_id, user_id)
  )`);
  console.log('OK: marketplace_reviews');

  // === 012: School ===
  console.log('\n--- 012: School ---');
  await client.query(`CREATE TABLE IF NOT EXISTS schools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    name_vi text,
    type text NOT NULL DEFAULT 'school',
    country text NOT NULL DEFAULT 'VN',
    address text,
    website text,
    logo_url text,
    admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan text NOT NULL DEFAULT 'free',
    max_students integer DEFAULT 50,
    status text NOT NULL DEFAULT 'active',
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`);
  await client.query('CREATE INDEX IF NOT EXISTS idx_schools_admin ON schools(admin_id)');
  console.log('OK: schools');

  await client.query(`CREATE TABLE IF NOT EXISTS school_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'student',
    invited_by uuid REFERENCES users(id),
    status text NOT NULL DEFAULT 'pending',
    joined_at timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    UNIQUE(school_id, user_id)
  )`);
  await client.query('CREATE INDEX IF NOT EXISTS idx_school_members_user ON school_members(user_id)');
  console.log('OK: school_members');

  await client.query(`CREATE TABLE IF NOT EXISTS school_classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grade_level text,
    subject text,
    enrollment_code text UNIQUE,
    max_students integer DEFAULT 30,
    status text NOT NULL DEFAULT 'active',
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`);
  await client.query('CREATE INDEX IF NOT EXISTS idx_school_classes_school ON school_classes(school_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_school_classes_teacher ON school_classes(teacher_id)');
  console.log('OK: school_classes');

  await client.query(`CREATE TABLE IF NOT EXISTS class_enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'active',
    enrolled_at timestamp NOT NULL DEFAULT now(),
    UNIQUE(class_id, student_id)
  )`);
  console.log('OK: class_enrollments');

  await client.query(`CREATE TABLE IF NOT EXISTS school_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    type text NOT NULL DEFAULT 'exercise',
    exercise_id uuid REFERENCES codelab_exercises(id),
    due_date timestamp,
    points_possible integer DEFAULT 100,
    status text NOT NULL DEFAULT 'active',
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`);
  await client.query('CREATE INDEX IF NOT EXISTS idx_school_assignments_class ON school_assignments(class_id)');
  console.log('OK: school_assignments');

  await client.query(`CREATE TABLE IF NOT EXISTS assignment_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id uuid NOT NULL REFERENCES school_assignments(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content text,
    submission_data jsonb,
    status text NOT NULL DEFAULT 'submitted',
    grade integer,
    feedback text,
    graded_by uuid REFERENCES users(id),
    graded_at timestamp,
    submitted_at timestamp NOT NULL DEFAULT now(),
    UNIQUE(assignment_id, student_id)
  )`);
  console.log('OK: assignment_submissions');

  // Mark migrations as run
  for (const m of ['20240624000010_add_codelab', '20240624000011_add_marketplace', '20240624000012_add_school']) {
    const r = await client.query('SELECT 1 FROM pgmigrations WHERE name = $1', [m]);
    if (r.rows.length === 0) {
      await client.query('INSERT INTO pgmigrations (name, run_on) VALUES ($1, now())', [m]);
      console.log('MARKED: ' + m);
    }
  }

  // Final count
  const count = await client.query("SELECT count(*) as cnt FROM pg_tables WHERE schemaname='public'");
  console.log('\nTotal tables: ' + count.rows[0].cnt);

  await client.end();
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
