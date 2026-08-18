-- Merge Favour's duplicate: she's already logged in with FAVOUR-2398,
-- creating a real second student row (ungrouped, status 'enrolled').
-- Keep that row (it's the one tied to the code she now has), restore her
-- real group/status onto it, move any history over, delete the orphaned
-- original.
DO $$
DECLARE
  old_student_id uuid := '0a9de004-9e9e-43e9-b5f6-41b245f5827f';
  new_student_id uuid := '8985d9f7-e927-4dbc-bf69-ef37dbe4b977';
  old_profile_id uuid := 'df076e6e-8ea0-694e-6465-bf59030b8349';
  real_peer_group_id uuid := '3a1e40ea-8263-4a65-81d2-671533c5e4ec';
BEGIN
  UPDATE submissions  SET student_id          = new_student_id WHERE student_id          = old_student_id;
  UPDATE peer_reviews SET reviewer_student_id = new_student_id WHERE reviewer_student_id = old_student_id;

  UPDATE students SET peer_group_id = real_peer_group_id, status = 'active' WHERE id = new_student_id;

  DELETE FROM students WHERE id = old_student_id;
  DELETE FROM profiles WHERE id = old_profile_id;

  RAISE NOTICE 'Merged Favour — keeping student % under code FAVOUR-2398', new_student_id;
END $$;

-- Verify: should be exactly one row now.
select
  p.id as profile_id, p.full_name, s.id as student_id,
  s.peer_group_id, s.track, s.status
from profiles p
left join students s on s.profile_id = p.id
where lower(p.email) = 'eriesirifav@gmail.com';
