-- Preview only — run this FIRST and read the list before running
-- remove_inactive_students.sql.
--
-- "enrolled but not active" = registered but never assigned to a peer
-- group (status only flips to 'active' when a coach assigns a group in
-- Cohort Setup, see CohortSetup.jsx). That is NOT the same as "never did
-- anything" — someone can submit individual work without ever being
-- grouped. The submission_count column below tells you which:
--   0            -> genuinely untouched signup, safe to consider removing
--   1 or more    -> real participant, do NOT delete (the removal script
--                   skips these automatically, but review them anyway —
--                   they likely just need a group assigned instead)

select
  s.id                                                as student_id,
  p.full_name,
  p.email,
  s.status,
  s.created_at                                        as enrolled_at,
  c.name                                               as cohort_name,
  (select count(*) from submissions sub where sub.student_id = s.id) as submission_count
from students s
join profiles p on p.id = s.profile_id
join cohorts  c on c.id = s.cohort_id
where s.cohort_id = (
  select id from cohorts where status in ('open', 'active') order by created_at desc limit 1
)
and s.status = 'enrolled'
order by submission_count desc, s.created_at;
