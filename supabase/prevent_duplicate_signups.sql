-- Stop the same email from registering more than once.
-- Run in the Supabase SQL Editor, after code_auth.sql.
--
-- IMPORTANT: run supabase/find_duplicate_signups.sql FIRST. If it returns
-- any rows, resolve them (decide which account to keep, delete the
-- others' access_codes/profiles/students rows) before running the unique
-- index below — it will fail to create while duplicates still exist.

-- 1. Hard backstop at the DB level: one email, one access code, ever.
create unique index if not exists access_codes_email_unique_idx
  on access_codes (lower(email));

-- 2. Give create_student_code a clear, friendly error instead of a raw
--    constraint violation, and check *before* attempting the insert.
--    Note: the error message intentionally does NOT contain the word
--    "clash" — Login.jsx silently retries on that word (for code
--    collisions), which would be pointless here since the email is
--    what's blocking, not the generated code.
create or replace function create_student_code(
  p_name  text,
  p_email text,
  p_code  text
)
returns json language plpgsql security definer as $$
declare
  pid           uuid;
  cohort_id_val uuid;
begin
  if upper(trim(p_code)) in ('PNF-COACH', 'COACH-GOGA', 'COACH-REJOICE') then
    return json_build_object('success', false, 'error', 'That code is reserved. Please try again.');
  end if;

  if exists(select 1 from access_codes where upper(code) = upper(trim(p_code))) then
    return json_build_object('success', false, 'error', 'Code clash — refreshing your code. Please try again.');
  end if;

  if exists(select 1 from access_codes where lower(email) = lower(trim(p_email))) then
    return json_build_object(
      'success', false,
      'error', 'This email is already registered. Use your existing access code to log in — contact your coach if you lost it.'
    );
  end if;

  select id into cohort_id_val
  from cohorts
  where status in ('open', 'active')
  order by created_at desc
  limit 1;

  insert into access_codes (code, full_name, email, role, cohort_id)
  values (upper(trim(p_code)), trim(p_name), lower(trim(p_email)), 'student', cohort_id_val);

  pid := md5(upper(trim(p_code)))::uuid;

  insert into profiles (id, email, full_name, role)
  values (pid, lower(trim(p_email)), trim(p_name), 'student')
  on conflict (id) do update
    set full_name = excluded.full_name,
        email     = excluded.email;

  if cohort_id_val is not null then
    insert into students (profile_id, cohort_id, status)
    values (pid, cohort_id_val, 'enrolled')
    on conflict (profile_id, cohort_id) do nothing;
  end if;

  return json_build_object(
    'success',   true,
    'id',        pid::text,
    'code',      upper(trim(p_code)),
    'full_name', trim(p_name),
    'email',     lower(trim(p_email)),
    'role',      'student',
    'cohort_id', cohort_id_val::text
  );
end;
$$;

grant execute on function create_student_code(text, text, text) to anon;
