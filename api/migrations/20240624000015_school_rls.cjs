/**
 * School RLS (Row Level Security) setup
 * Ensures data isolation between schools at the DB level.
 */
module.exports = {
  up(pgm) {
    // Enable RLS on school-related tables
    pgm.sql('ALTER TABLE schools ENABLE ROW LEVEL SECURITY;');
    pgm.sql('ALTER TABLE school_members ENABLE ROW LEVEL SECURITY;');
    pgm.sql('ALTER TABLE school_classes ENABLE ROW LEVEL SECURITY;');
    pgm.sql('ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;');
    pgm.sql('ALTER TABLE school_assignments ENABLE ROW LEVEL SECURITY;');
    pgm.sql('ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;');

    // Policies for schools
    pgm.sql(`CREATE POLICY school_select_member ON schools
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM school_members sm
          WHERE sm.school_id = schools.id
          AND sm.user_id = current_setting('app.current_user_id', true)::uuid
        )
      );`);

    pgm.sql(`CREATE POLICY school_members_select ON school_members
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM school_members sm2
          WHERE sm2.school_id = school_members.school_id
          AND sm2.user_id = current_setting('app.current_user_id', true)::uuid
        )
      );`);

    pgm.sql(`CREATE POLICY school_classes_select ON school_classes
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM school_members sm
          WHERE sm.school_id = school_classes.school_id
          AND sm.user_id = current_setting('app.current_user_id', true)::uuid
        )
      );`);

    pgm.sql(`CREATE POLICY class_enrollments_select ON class_enrollments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM school_classes sc
          JOIN school_members sm ON sm.school_id = sc.school_id
          WHERE sc.id = class_enrollments.class_id
          AND sm.user_id = current_setting('app.current_user_id', true)::uuid
        )
      );`);

    pgm.sql(`CREATE POLICY school_assignments_select ON school_assignments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM school_classes sc
          JOIN school_members sm ON sm.school_id = sc.school_id
          WHERE sc.id = school_assignments.class_id
          AND sm.user_id = current_setting('app.current_user_id', true)::uuid
        )
      );`);

    pgm.sql(`CREATE POLICY assignment_submissions_select ON assignment_submissions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM school_assignments sa
          JOIN school_classes sc ON sc.id = sa.class_id
          JOIN school_members sm ON sm.school_id = sc.school_id
          WHERE sa.id = assignment_submissions.assignment_id
          AND sm.user_id = current_setting('app.current_user_id', true)::uuid
        )
      );`);
  },
  down(pgm) {
    pgm.sql('DROP POLICY IF EXISTS assignment_submissions_select ON assignment_submissions;');
    pgm.sql('DROP POLICY IF EXISTS school_assignments_select ON school_assignments;');
    pgm.sql('DROP POLICY IF EXISTS class_enrollments_select ON class_enrollments;');
    pgm.sql('DROP POLICY IF EXISTS school_classes_select ON school_classes;');
    pgm.sql('DROP POLICY IF EXISTS school_members_select ON school_members;');
    pgm.sql('DROP POLICY IF EXISTS school_select_member ON schools;');
    pgm.sql('ALTER TABLE assignment_submissions DISABLE ROW LEVEL SECURITY;');
    pgm.sql('ALTER TABLE school_assignments DISABLE ROW LEVEL SECURITY;');
    pgm.sql('ALTER TABLE class_enrollments DISABLE ROW LEVEL SECURITY;');
    pgm.sql('ALTER TABLE school_classes DISABLE ROW LEVEL SECURITY;');
    pgm.sql('ALTER TABLE school_members DISABLE ROW LEVEL SECURITY;');
    pgm.sql('ALTER TABLE schools DISABLE ROW LEVEL SECURITY;');
  },
};
