-- Remove duplicate account(s) for ONE specific email, keeping whichever
-- account(s) actually have submitted work — never picks by "oldest" or
-- "newest", since that's not a reliable signal (someone can register
-- twice but keep using their FIRST code for real work, like the
-- jesufemiewaoluwa@gmail.com case: the older signup had a submission,
-- the newer one didn't).
--
-- 1. Change target_email below.
-- 2. Run the SELECT first and check submission_count for each row.
-- 3. Only if exactly the ones you expect show 0, run the DO block.

-- ── Step 1: preview ──────────────────────────────────────────
select
  s.id          as student_id,
  p.full_name,
  p.email,
  ac.code,
  s.created_at,
  (select count(*) from submissions sub where sub.student_id = s.id) as submission_count
from students s
join profiles p on p.id = s.profile_id
left join access_codes ac on lower(ac.email) = lower(p.email)
where lower(p.email) = lower('jesufemiewaoluwa@gmail.com')  -- <-- change this
order by s.created_at;

-- ── Step 2: delete only the zero-submission duplicate(s) ───────
DO $$
DECLARE
  target_email text := 'jesufemiewaoluwa@gmail.com';  -- <-- change this
  r RECORD;
BEGIN
  FOR r IN
    SELECT s.id AS student_id, s.profile_id, s.cohort_id, p.email
    FROM   students s
    JOIN   profiles p ON p.id = s.profile_id
    WHERE  lower(p.email) = lower(target_email)
    AND    NOT EXISTS (SELECT 1 FROM submissions sub WHERE sub.student_id = s.id)
  LOOP
    DELETE FROM students WHERE id = r.student_id;
    DELETE FROM access_codes WHERE cohort_id = r.cohort_id AND lower(email) = lower(r.email);

    IF NOT EXISTS (SELECT 1 FROM students WHERE profile_id = r.profile_id) THEN
      DELETE FROM profiles WHERE id = r.profile_id;
    END IF;

    RAISE NOTICE 'Removed duplicate: student_id %', r.student_id;
  END LOOP;
END $$;
