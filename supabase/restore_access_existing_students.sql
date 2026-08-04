-- For people who are STILL enrolled/in-group but whose access_codes row
-- got deleted (so they can't log back in): find their existing profile by
-- email, generate a fresh code, and re-point their EXISTING students row
-- at a new profile tied to that code — preserving peer_group_id, track,
-- status, and submission history.
--
-- The now-deleted reissue_codes_after_dedup.sql already ran and created
-- 4 leftover access_codes rows for these emails, but nobody has logged in
-- with them yet — Step 0 below clears those out first so they don't get
-- mistaken for "already fixed."

-- ── Step 0: clear the unused leftover codes from the earlier script ──
DELETE FROM access_codes
WHERE lower(email) IN (
  'prevailamah09@gmail.com',
  'calebayeni16@gmail.com',
  'eriesirifav@gmail.com',
  'iokonye24@gmail.com'
);

-- ── Step 1: verify they actually still have an enrollment ──────
select
  p.id as old_profile_id, p.full_name, p.email,
  s.id as student_id, s.peer_group_id, s.track, s.status, s.cohort_id
from profiles p
left join students s on s.profile_id = p.id
where lower(p.email) in (
  'prevailamah09@gmail.com',
  'calebayeni16@gmail.com',
  'eriesirifav@gmail.com',
  'iokonye24@gmail.com'
);

-- ── Step 2: only run this after checking Step 1's output ────────
DO $$
DECLARE
  cid uuid;
  r RECORD;
  new_code text;
  new_pid  uuid;
  first_nm text;
  target_emails text[] := ARRAY[
    'prevailamah09@gmail.com',
    'calebayeni16@gmail.com',
    'eriesirifav@gmail.com',
    'iokonye24@gmail.com'
  ];
BEGIN
  SELECT id INTO cid FROM cohorts WHERE status IN ('open', 'active') ORDER BY created_at DESC LIMIT 1;
  IF cid IS NULL THEN
    RAISE EXCEPTION 'No open/active cohort found.';
  END IF;

  FOR r IN
    SELECT p.id AS old_pid, p.full_name, p.email
    FROM profiles p
    WHERE lower(p.email) = ANY(target_emails)
    -- Only ever target a profile that actually has an enrollment. Without
    -- this, a leftover orphaned profile (no students row — e.g. left
    -- behind by an earlier incomplete duplicate cleanup) can get migrated
    -- instead of the real one, which is exactly what happened the first
    -- time this ran for Caleb/Thelma/Prevail.
    AND EXISTS (SELECT 1 FROM students s WHERE s.profile_id = p.id)
  LOOP
    IF EXISTS (SELECT 1 FROM access_codes WHERE lower(email) = lower(r.email)) THEN
      RAISE NOTICE 'Skipped % (%) — already has a code', r.full_name, r.email;
      CONTINUE;
    END IF;

    first_nm := upper(regexp_replace(split_part(trim(r.full_name), ' ', 1), '[^A-Za-z]', '', 'g'));

    LOOP
      new_code := first_nm || '-' || lpad((floor(random() * 10000))::int::text, 4, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM access_codes WHERE upper(code) = upper(new_code));
    END LOOP;

    new_pid := md5(upper(trim(new_code)))::uuid;

    INSERT INTO access_codes (code, full_name, email, role, cohort_id)
    VALUES (new_code, r.full_name, lower(r.email), 'student', cid);

    INSERT INTO profiles (id, full_name, email, role)
    VALUES (new_pid, r.full_name, lower(r.email), 'student');

    -- Re-point their EXISTING students row(s) — id stays the same, so
    -- peer_group_id / track / status / submissions all carry over.
    UPDATE students SET profile_id = new_pid WHERE profile_id = r.old_pid;

    DELETE FROM profiles WHERE id = r.old_pid;

    RAISE NOTICE 'Re-issued % for % (%)', new_code, r.full_name, r.email;
  END LOOP;
END $$;

-- ── Step 3: codes to send out ────────────────────────────────────
SELECT full_name, email, code
FROM access_codes
WHERE lower(email) IN (
  'prevailamah09@gmail.com',
  'calebayeni16@gmail.com',
  'eriesirifav@gmail.com',
  'iokonye24@gmail.com'
)
ORDER BY full_name;
