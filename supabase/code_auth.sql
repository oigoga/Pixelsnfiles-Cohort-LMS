-- ============================================================
-- PixelsnFiles Cohort LMS – Code-Only Auth (no Supabase Auth)
-- Run AFTER schema.sql → rls.sql → access_codes.sql
-- ============================================================

-- 1. Drop the auth.users FK so profiles can exist without auth users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Disable RLS on all tables for Phase 1 MVP
--    (re-enable in Phase 2 once auth is stable)
ALTER TABLE profiles             DISABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts              DISABLE ROW LEVEL SECURITY;
ALTER TABLE peer_groups          DISABLE ROW LEVEL SECURITY;
ALTER TABLE students             DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules              DISABLE ROW LEVEL SECURITY;
ALTER TABLE resources            DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions          DISABLE ROW LEVEL SECURITY;
ALTER TABLE peer_reviews         DISABLE ROW LEVEL SECURITY;
ALTER TABLE coach_verifications  DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements        DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes         DISABLE ROW LEVEL SECURITY;

-- 3. login_with_code
--    Validates the code, creates/updates the profile record,
--    enrols the student in their cohort, and returns the profile
--    as JSON for the frontend to store in localStorage.
--
--    The profile UUID is deterministic: md5(UPPER(code))::uuid
--    so the same code always maps to the same row.
CREATE OR REPLACE FUNCTION login_with_code(p_code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v   access_codes%ROWTYPE;
  pid uuid;
BEGIN
  SELECT * INTO v
  FROM   access_codes
  WHERE  upper(trim(p_code)) = upper(code)
  LIMIT  1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Invalid access code. Check your code and try again.'
    );
  END IF;

  -- Deterministic UUID: same code → same profile row, forever
  pid := md5(upper(trim(p_code)))::uuid;

  INSERT INTO profiles (id, email, full_name, role)
  VALUES (pid, v.email, v.full_name, v.role)
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        email     = COALESCE(EXCLUDED.email,     profiles.email),
        role      = EXCLUDED.role;

  -- Auto-enrol students
  IF v.role = 'student' AND v.cohort_id IS NOT NULL THEN
    INSERT INTO students (profile_id, cohort_id, status)
    VALUES (pid, v.cohort_id, 'enrolled')
    ON CONFLICT (profile_id, cohort_id) DO NOTHING;
  END IF;

  RETURN json_build_object(
    'valid',     true,
    'id',        pid::text,
    'email',     v.email,
    'full_name', v.full_name,
    'role',      v.role::text,
    'cohort_id', v.cohort_id::text
  );
END;
$$;

-- Let the anon (client-side) key call this function
GRANT EXECUTE ON FUNCTION login_with_code(text) TO anon;
