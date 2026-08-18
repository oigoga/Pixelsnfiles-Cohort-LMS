-- Full removal of Ochoyo Aba (OCHOYO-7637) and Neriah (NERIAH-0812) —
-- not duplicates, just complete account removal. Each self-checks for
-- submissions/reviews before deleting and refuses if it finds any.
DO $$
DECLARE
  people jsonb := '[
    {"name": "Ochoyo Aba", "student_id": "23da20b1-5c97-462e-9060-212d750ce651", "profile_id": "06d95069-44ce-7920-f6ed-4cc3de35b6a2", "code": "OCHOYO-7637"},
    {"name": "Neriah",     "student_id": "da494d18-4bb3-4786-8e57-9226b72383ae", "profile_id": "4affa711-9efd-699c-47c6-e0c17e82dc56", "code": "NERIAH-0812"}
  ]'::jsonb;
  person jsonb;
  sid uuid;
  pid uuid;
BEGIN
  FOR person IN SELECT * FROM jsonb_array_elements(people)
  LOOP
    sid := (person->>'student_id')::uuid;
    pid := (person->>'profile_id')::uuid;

    IF EXISTS (SELECT 1 FROM submissions WHERE student_id = sid)
       OR EXISTS (SELECT 1 FROM peer_reviews WHERE reviewer_student_id = sid) THEN
      RAISE EXCEPTION '% has submissions or reviews — refusing to delete. Investigate manually.', person->>'name';
    END IF;

    DELETE FROM students WHERE id = sid;
    DELETE FROM access_codes WHERE upper(code) = upper(person->>'code');
    DELETE FROM profiles WHERE id = pid;

    RAISE NOTICE 'Removed % completely (code %)', person->>'name', person->>'code';
  END LOOP;
END $$;

-- Verify: should return zero rows.
select * from access_codes where code in ('OCHOYO-7637', 'NERIAH-0812');
