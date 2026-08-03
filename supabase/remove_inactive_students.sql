-- IRREVERSIBLE. Run supabase/preview_inactive_students.sql FIRST and read
-- the list — do not run this blind.
--
-- Hard-deletes every enrolled-but-not-active student in the current
-- open/active cohort who has NEVER submitted anything (individual or
-- team) — their students row, their access_codes row(s) for this cohort,
-- and their profile (only if that profile isn't also enrolled in some
-- other cohort, so a person taking a second cohort under the same code
-- doesn't lose their account entirely).
--
-- Anyone with a submission is skipped automatically, even if they're
-- still 'enrolled' — that means real work exists and they likely just
-- need a group assigned, not removal. (An earlier version of this script
-- didn't skip these and hit the submissions_check constraint trying to
-- delete a student with a submitted individual task.)

DO $$
DECLARE
  cid uuid;
  r   RECORD;
BEGIN
  SELECT id INTO cid FROM cohorts WHERE status IN ('open', 'active') ORDER BY created_at DESC LIMIT 1;
  IF cid IS NULL THEN
    RAISE EXCEPTION 'No open/active cohort found.';
  END IF;

  FOR r IN
    SELECT s.id AS student_id, s.profile_id, p.email
    FROM   students s
    JOIN   profiles p ON p.id = s.profile_id
    WHERE  s.cohort_id = cid
    AND    s.status = 'enrolled'
    AND    NOT EXISTS (SELECT 1 FROM submissions sub WHERE sub.student_id = s.id)
  LOOP
    -- 1. Remove their enrollment in this cohort
    DELETE FROM students WHERE id = r.student_id;

    -- 2. Remove their access code(s) tied to this cohort
    DELETE FROM access_codes WHERE cohort_id = cid AND lower(email) = lower(r.email);

    -- 3. Remove the profile only if it isn't enrolled anywhere else
    IF NOT EXISTS (SELECT 1 FROM students WHERE profile_id = r.profile_id) THEN
      DELETE FROM profiles WHERE id = r.profile_id;
    END IF;

    RAISE NOTICE 'Removed: % (student_id %)', r.email, r.student_id;
  END LOOP;
END $$;
