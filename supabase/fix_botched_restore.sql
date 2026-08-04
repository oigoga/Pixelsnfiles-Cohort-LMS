-- Fixes the fallout from restore_access_existing_students.sql, which
-- non-deterministically migrated the WRONG profile for anyone who had a
-- leftover orphaned profile row (no students attached) sitting under the
-- same email from the earlier incomplete dedup.

-- ── Part 1: Thelma + Prevail — haven't logged in with the wrong code yet.
-- Delete the wrongly-issued code + the empty orphan profile it pointed
-- to, then redo the migration correctly against their REAL profile.
DO $$
DECLARE
  cid uuid;
  new_code text;
  new_pid  uuid;
  first_nm text;
  t jsonb;
  targets jsonb := '[
    {"real_profile_id": "924b50a9-1c9f-12c0-8311-3919d630803c", "wrong_profile_id": "81c6de68-d656-5deb-e37e-e0d8508ca00e", "wrong_code": "ISHIOMA-3223", "full_name": "Ishioma Thelma Okonye", "email": "iokonye24@gmail.com"},
    {"real_profile_id": "9b304177-3d9b-5f03-3f0e-e6a6400e1348", "wrong_profile_id": "fa19f775-4c4d-9f32-f472-e0f0089cbc2b", "wrong_code": "PREVAIL-5846",  "full_name": "Prevail",                 "email": "prevailamah09@gmail.com"}
  ]'::jsonb;
BEGIN
  SELECT id INTO cid FROM cohorts WHERE status IN ('open', 'active') ORDER BY created_at DESC LIMIT 1;

  FOR t IN SELECT * FROM jsonb_array_elements(targets)
  LOOP
    DELETE FROM access_codes WHERE upper(code) = upper(t->>'wrong_code');
    DELETE FROM profiles WHERE id = (t->>'wrong_profile_id')::uuid;

    first_nm := upper(regexp_replace(split_part(trim(t->>'full_name'), ' ', 1), '[^A-Za-z]', '', 'g'));
    LOOP
      new_code := first_nm || '-' || lpad((floor(random() * 10000))::int::text, 4, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM access_codes WHERE upper(code) = upper(new_code));
    END LOOP;
    new_pid := md5(upper(trim(new_code)))::uuid;

    INSERT INTO access_codes (code, full_name, email, role, cohort_id)
    VALUES (new_code, t->>'full_name', lower(t->>'email'), 'student', cid);

    INSERT INTO profiles (id, full_name, email, role)
    VALUES (new_pid, t->>'full_name', lower(t->>'email'), 'student');

    UPDATE students SET profile_id = new_pid WHERE profile_id = (t->>'real_profile_id')::uuid;

    DELETE FROM profiles WHERE id = (t->>'real_profile_id')::uuid;

    RAISE NOTICE 'Fixed % -> new code %', t->>'full_name', new_code;
  END LOOP;
END $$;

-- ── Part 2: Caleb — already logged in with CALEB-2376, creating a real
-- second student row. Keep that row (it's the one tied to the code he
-- now has), move his real history/track onto it, delete the orphaned
-- original.
DO $$
DECLARE
  old_student_id uuid := 'c2f506db-4451-44f9-8fb8-d70d8928499c';
  new_student_id uuid := 'df2786ec-caac-4f92-8c40-35e1e6d93053';
  old_profile_id uuid := 'f396c52a-3841-66a2-5221-a521ce899cf6';
BEGIN
  UPDATE submissions  SET student_id          = new_student_id WHERE student_id          = old_student_id;
  UPDATE peer_reviews SET reviewer_student_id = new_student_id WHERE reviewer_student_id = old_student_id;

  UPDATE students SET track = 'marketing' WHERE id = new_student_id;

  DELETE FROM students WHERE id = old_student_id;
  DELETE FROM profiles WHERE id = old_profile_id;

  RAISE NOTICE 'Merged Caleb — keeping student % under code CALEB-2376', new_student_id;
END $$;

-- ── Verify — re-run and confirm exactly ONE row per person, correct group/track.
select
  p.id as profile_id, p.full_name, p.email,
  s.id as student_id, s.peer_group_id, s.track, s.status
from profiles p
left join students s on s.profile_id = p.id
where lower(p.email) in (
  'prevailamah09@gmail.com',
  'calebayeni16@gmail.com',
  'eriesirifav@gmail.com',
  'iokonye24@gmail.com'
)
order by p.email;
