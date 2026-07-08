-- ============================================================
-- PixelsnFiles Cohort LMS – Code-Only Auth (no Supabase Auth)
-- Run AFTER schema.sql → rls.sql → access_codes.sql
-- ============================================================

-- 1. Drop the auth.users FK so profiles can exist without auth users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Disable RLS on all tables for Phase 1 MVP
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

-- ----------------------------------------------------------------
-- login_with_code
-- Checks hardcoded coach codes first, then the access_codes table.
-- Creates/updates the profile and enrols students automatically.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION login_with_code(p_code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v          access_codes%ROWTYPE;
  pid        uuid;
  coach_name text;
  coach_email text;
BEGIN
  -- ── Hardcoded coach codes (invisible to students) ──────────
  CASE upper(trim(p_code))
    WHEN 'PNF-COACH'  THEN coach_name := 'Pnf Admin'; coach_email := 'admin@pixelsnfiles.com';
    WHEN 'COACH-GOGA' THEN coach_name := 'Goga';       coach_email := 'gogaelisabeth21@gmail.com';
    ELSE coach_name := NULL;
  END CASE;

  IF coach_name IS NOT NULL THEN
    pid := md5(upper(trim(p_code)))::uuid;
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (pid, coach_email, coach_name, 'coach')
    ON CONFLICT (id) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          role      = 'coach';
    RETURN json_build_object(
      'valid',     true,
      'id',        pid::text,
      'full_name', coach_name,
      'email',     coach_email,
      'role',      'coach',
      'cohort_id', null
    );
  END IF;

  -- ── Student codes from access_codes table ──────────────────
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

  pid := md5(upper(trim(p_code)))::uuid;

  INSERT INTO profiles (id, email, full_name, role)
  VALUES (pid, v.email, v.full_name, v.role)
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        email     = COALESCE(EXCLUDED.email,     profiles.email),
        role      = EXCLUDED.role;

  IF v.role = 'student' AND v.cohort_id IS NOT NULL THEN
    INSERT INTO students (profile_id, cohort_id, status)
    VALUES (pid, v.cohort_id, 'enrolled')
    ON CONFLICT (profile_id, cohort_id) DO NOTHING;
  END IF;

  RETURN json_build_object(
    'valid',     true,
    'id',        pid::text,
    'full_name', v.full_name,
    'email',     v.email,
    'role',      v.role::text,
    'cohort_id', v.cohort_id::text
  );
END;
$$;

-- ----------------------------------------------------------------
-- create_student_code
-- Called when a new student signs up on the login page.
-- Generates their record and enrols them in the active cohort.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_student_code(
  p_name  text,
  p_email text,
  p_code  text
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  pid           uuid;
  cohort_id_val uuid;
BEGIN
  -- Block reserved coach codes
  IF upper(trim(p_code)) IN ('PNF-COACH', 'COACH-GOGA') THEN
    RETURN json_build_object('success', false, 'error', 'That code is reserved. Please try again.');
  END IF;

  -- Block duplicates
  IF EXISTS(SELECT 1 FROM access_codes WHERE upper(code) = upper(trim(p_code))) THEN
    RETURN json_build_object('success', false, 'error', 'Code clash — refreshing your code. Please try again.');
  END IF;

  -- Find the most recent open or active cohort
  SELECT id INTO cohort_id_val
  FROM   cohorts
  WHERE  status IN ('open', 'active')
  ORDER  BY created_at DESC
  LIMIT  1;

  -- Save to access_codes
  INSERT INTO access_codes (code, full_name, email, role, cohort_id)
  VALUES (upper(trim(p_code)), trim(p_name), lower(trim(p_email)), 'student', cohort_id_val);

  -- Create profile (deterministic UUID from code)
  pid := md5(upper(trim(p_code)))::uuid;

  INSERT INTO profiles (id, email, full_name, role)
  VALUES (pid, lower(trim(p_email)), trim(p_name), 'student')
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email     = EXCLUDED.email;

  -- Enrol in cohort
  IF cohort_id_val IS NOT NULL THEN
    INSERT INTO students (profile_id, cohort_id, status)
    VALUES (pid, cohort_id_val, 'enrolled')
    ON CONFLICT (profile_id, cohort_id) DO NOTHING;
  END IF;

  RETURN json_build_object(
    'success',   true,
    'id',        pid::text,
    'code',      upper(trim(p_code)),
    'full_name', trim(p_name),
    'email',     lower(trim(p_email)),
    'role',      'student',
    'cohort_id', cohort_id_val::text
  );
END;
$$;

GRANT EXECUTE ON FUNCTION login_with_code(text)                TO anon;
GRANT EXECUTE ON FUNCTION create_student_code(text, text, text) TO anon;
