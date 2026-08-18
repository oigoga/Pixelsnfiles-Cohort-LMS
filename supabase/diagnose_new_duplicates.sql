-- Diagnostic only — no changes. Paste back both result sets.
-- Covers: Favour Daudu (favourdaudu55@gmail.com), code NERIAH-0812,
-- code FAVOUR-4208 (reported to have a duplicate — the older one with
-- tasks is the correct one to keep), and Ochoyo Aba.

-- All matching access_codes rows.
select id, code, full_name, email, cohort_id, created_at
from access_codes
where code in ('NERIAH-0812', 'FAVOUR-4208')
   or lower(email) = 'favourdaudu55@gmail.com'
   or full_name ilike '%ochoyo%' or full_name ilike '%aba%' or full_name ilike '%neriah%'
order by email, created_at;

-- All matching profiles/students, with submission counts — this is what
-- tells us which of a pair is the "real" one to keep.
select
  p.id as profile_id, p.full_name, p.email,
  s.id as student_id, s.peer_group_id, s.track, s.status, s.created_at,
  (select count(*) from submissions sub where sub.student_id = s.id) as submission_count
from profiles p
left join students s on s.profile_id = p.id
where lower(p.email) = 'favourdaudu55@gmail.com'
   or p.full_name ilike '%ochoyo%' or p.full_name ilike '%aba%' or p.full_name ilike '%neriah%'
   or p.id in (
     select md5(upper(trim(code)))::uuid from access_codes where code in ('NERIAH-0812', 'FAVOUR-4208')
   )
order by p.email, s.created_at;
