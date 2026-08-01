-- Migrate all PNF-XXXXXX codes to FIRSTNAME-DDDD format
-- Run in Supabase SQL Editor (project sjydqgfjifaaapheqxgq)
-- Safe to run multiple times — only touches codes that still start with 'PNF-'

DO $$
DECLARE
  r         RECORD;
  new_code  text;
  old_pid   uuid;
  new_pid   uuid;
  first_nm  text;
BEGIN
  FOR r IN
    SELECT ac.id AS ac_id, ac.code, ac.full_name
    FROM   access_codes ac
    WHERE  ac.code LIKE 'PNF-%'
    ORDER  BY ac.id
  LOOP
    first_nm := upper(split_part(trim(r.full_name), ' ', 1));

    -- Generate a unique code (retry if digits collide)
    LOOP
      new_code := first_nm || '-' || lpad((floor(random() * 10000))::int::text, 4, '0');
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM access_codes WHERE upper(code) = upper(new_code)
      );
    END LOOP;

    old_pid := md5(upper(trim(r.code)))::uuid;
    new_pid := md5(upper(trim(new_code)))::uuid;

    -- 1. Insert new profile with new_pid (copy from old row)
    --    Must exist before students FK can point to it
    INSERT INTO profiles (id, full_name, email, role)
    SELECT new_pid, full_name, email, role
    FROM   profiles
    WHERE  id = old_pid
    ON CONFLICT (id) DO NOTHING;

    -- 2. Update students FK now that new_pid exists in profiles
    UPDATE students SET profile_id = new_pid WHERE profile_id = old_pid;

    -- 3. Safe to delete the old profile (no references remain)
    DELETE FROM profiles WHERE id = old_pid;

    -- 4. Update the access code
    UPDATE access_codes SET code = new_code WHERE id = r.ac_id;

    RAISE NOTICE 'Migrated: % → %', r.code, new_code;
  END LOOP;
END $$;
