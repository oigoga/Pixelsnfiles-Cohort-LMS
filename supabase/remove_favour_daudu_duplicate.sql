-- Remove the confirmed empty duplicate: Favour Daudu (favourdaudu55@gmail.com).
-- 0 submissions, no peer group, no access_codes row (already lost).
-- The real account — Favour Hunu Daudu / FAVOUR-4208, 4 submissions,
-- grouped — is untouched by this script.
DO $$
DECLARE
  target_student_id uuid := '79d059c8-f953-4b1c-ba83-fa96f06f920a';
  target_profile_id uuid := 'c6bf37e2-2cc6-a9db-b0e6-7ffc457609b9';
BEGIN
  IF EXISTS (SELECT 1 FROM submissions WHERE student_id = target_student_id)
     OR EXISTS (SELECT 1 FROM peer_reviews WHERE reviewer_student_id = target_student_id) THEN
    RAISE EXCEPTION 'This account has submissions or reviews — refusing to delete. Investigate manually.';
  END IF;

  DELETE FROM students WHERE id = target_student_id;
  DELETE FROM profiles WHERE id = target_profile_id;

  RAISE NOTICE 'Removed duplicate Favour Daudu (favourdaudu55@gmail.com) completely';
END $$;

-- Verify: should return zero rows.
select * from profiles where lower(email) = 'favourdaudu55@gmail.com';
