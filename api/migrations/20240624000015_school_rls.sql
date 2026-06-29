-- School RLS (Row Level Security) setup
-- Ensures data isolation between schools at the DB level.
-- Each query must be filtered through school_members to ensure the user belongs to the school.

-- Enable RLS on school-related tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for schools: users can only see schools they belong to
CREATE POLICY school_select_member ON schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM school_members sm
      WHERE sm.school_id = schools.id
      AND sm.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Policies for school_members: users can see members of their schools
CREATE POLICY school_members_select ON school_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM school_members sm2
      WHERE sm2.school_id = school_members.school_id
      AND sm2.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Policies for school_classes: users can see classes in their schools
CREATE POLICY school_classes_select ON school_classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM school_members sm
      WHERE sm.school_id = school_classes.school_id
      AND sm.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Policies for class_enrollments: users can see enrollments in their school's classes
CREATE POLICY class_enrollments_select ON class_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM school_classes sc
      JOIN school_members sm ON sm.school_id = sc.school_id
      WHERE sc.id = class_enrollments.class_id
      AND sm.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Policies for school_assignments
CREATE POLICY school_assignments_select ON school_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM school_classes sc
      JOIN school_members sm ON sm.school_id = sc.school_id
      WHERE sc.id = school_assignments.class_id
      AND sm.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Policies for assignment_submissions
CREATE POLICY assignment_submissions_select ON assignment_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM school_assignments sa
      JOIN school_classes sc ON sc.id = sa.class_id
      JOIN school_members sm ON sm.school_id = sc.school_id
      WHERE sa.id = assignment_submissions.assignment_id
      AND sm.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Note: The application must set app.current_user_id before each query:
-- SET LOCAL app.current_user_id = '<user_uuid>';
-- This is done in the db.ts connection wrapper.
