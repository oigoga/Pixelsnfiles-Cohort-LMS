-- ============================================================
-- PixelsnFiles Cohort LMS – Access Codes
-- Run this AFTER schema.sql and rls.sql
-- ============================================================

-- Access codes table
create table access_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  full_name   text not null,
  email       text not null,
  cohort_id   uuid references cohorts(id) on delete set null,
  role        user_role not null default 'student',
  created_at  timestamptz not null default now()
);

-- Only coach can read/write the codes table
alter table access_codes enable row level security;
create policy "coach_all_codes" on access_codes
  for all using ((current_profile()).role = 'coach');

-- ----------------------------------------------------------------
-- PUBLIC function: validate a code and return what we need to auth
-- (security definer so it can read access_codes without a session)
-- ----------------------------------------------------------------
create or replace function validate_access_code(p_code text)
returns json language plpgsql security definer as $$
declare
  v record;
begin
  select * into v from access_codes
  where upper(trim(p_code)) = upper(code)
  limit 1;

  if not found then
    return json_build_object('valid', false, 'error', 'Invalid access code. Check your code and try again.');
  end if;

  return json_build_object(
    'valid',     true,
    'email',     v.email,
    'full_name', v.full_name,
    'role',      v.role::text,
    'cohort_id', v.cohort_id::text
  );
end;
$$;

-- ----------------------------------------------------------------
-- AUTO-ENROL: called after first login to link student to cohort
-- ----------------------------------------------------------------
create or replace function enroll_with_code(p_code text, p_profile_id uuid)
returns void language plpgsql security definer as $$
declare
  v access_codes%rowtype;
begin
  select * into v from access_codes where upper(code) = upper(p_code) limit 1;
  if found and v.cohort_id is not null and v.role = 'student' then
    insert into students (profile_id, cohort_id, status)
    values (p_profile_id, v.cohort_id, 'enrolled')
    on conflict (profile_id, cohort_id) do nothing;
  end if;
end;
$$;

-- ----------------------------------------------------------------
-- UPDATE handle_new_user trigger to honour role from metadata
-- ----------------------------------------------------------------
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles(id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, profiles.full_name),
        email     = coalesce(excluded.email, profiles.email);
  return new;
end;
$$;
