-- Run this in the Supabase SQL Editor (project sjydqgfjifaaapheqxgq)
-- to add Rejoice as a coach and lock the login_with_code function.

CREATE OR REPLACE FUNCTION login_with_code(p_code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v          access_codes%ROWTYPE;
  pid        uuid;
  coach_name text;
  coach_email text;
BEGIN
  -- Hardcoded coach codes
  CASE upper(trim(p_code))
    WHEN 'PNF-COACH'     THEN coach_name := 'Pnf Admin'; coach_email := 'hello@pixelsnfiles.com';
    WHEN 'COACH-GOGA'    THEN coach_name := 'Goga';      coach_email := 'gogaelisabeth21@gmail.com';
    WHEN 'COACH-REJOICE' THEN coach_name := 'Rejoice';   coach_email := 'nguhert@gmail.com';
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

  -- Student codes from access_codes table
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
