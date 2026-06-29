const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

(async () => {
  await client.connect();

  // Get first user to be school admin + teacher
  const { rows: users } = await client.query("SELECT id, email FROM users LIMIT 1");
  if (users.length === 0) {
    console.error('No users found.');
    process.exit(1);
  }
  const adminId = users[0].id;

  // Create a sample school
  const { rows: schoolRows } = await client.query(
    `INSERT INTO schools (name, name_vi, admin_id, plan, status, country)
     VALUES ('HaMi Demo School', 'Trường Demo Hà Mi', $1, 'free', 'active', 'VN')
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [adminId]
  );
  let schoolId;
  if (schoolRows.length === 0) {
    const { rows } = await client.query("SELECT id FROM schools WHERE admin_id = $1 LIMIT 1", [adminId]);
    schoolId = rows[0]?.id;
  } else {
    schoolId = schoolRows[0].id;
  }
  console.log('School ID:', schoolId);

  if (!schoolId) {
    console.error('Failed to create/find school');
    process.exit(1);
  }

  // Add admin as school member
  await client.query(
    `INSERT INTO school_members (school_id, user_id, role, status, joined_at)
     VALUES ($1, $2, 'admin', 'active', now())
     ON CONFLICT (school_id, user_id) DO NOTHING`,
    [schoolId, adminId]
  );

  // Create 2 classes (teacher_id is required)
  const { rows: class1Rows } = await client.query(
    `INSERT INTO school_classes (school_id, name, teacher_id, grade_level, subject, status)
     VALUES ($1, 'Lớp Python Cơ Bản 8A', $2, 'grade_8', 'programming', 'active')
     RETURNING id`,
    [schoolId, adminId]
  );
  const class1Id = class1Rows[0].id;

  const { rows: class2Rows } = await client.query(
    `INSERT INTO school_classes (school_id, name, teacher_id, grade_level, subject, status)
     VALUES ($1, 'Lớp Web Development 9B', $2, 'grade_9', 'web', 'active')
     RETURNING id`,
    [schoolId, adminId]
  );
  const class2Id = class2Rows[0].id;

  console.log('Classes created:', class1Id, class2Id);

  // Create assignments (points_possible, not max_score; no title_vi)
  await client.query(
    `INSERT INTO school_assignments (class_id, teacher_id, title, description, due_date, points_possible, status)
     VALUES ($1, $2, 'Python Variables Exercise', 'Create a program that declares and prints 5 variables of different types.', now() + interval '7 days', 100, 'active')`,
    [class1Id, adminId]
  );

  await client.query(
    `INSERT INTO school_assignments (class_id, teacher_id, title, description, due_date, points_possible, status)
     VALUES ($1, $2, 'Build a Simple Webpage', 'Create a simple HTML page with CSS styling about your favorite hobby.', now() + interval '14 days', 100, 'active')`,
    [class2Id, adminId]
  );

  await client.query(
    `INSERT INTO school_assignments (class_id, teacher_id, title, description, due_date, points_possible, status)
     VALUES ($1, $2, 'Python Loops Practice', 'Write 3 programs using for loops, while loops, and nested loops.', now() + interval '10 days', 100, 'active')`,
    [class1Id, adminId]
  );

  console.log('Assignments created.');
  console.log('School seed complete.');
  await client.end();
})();
