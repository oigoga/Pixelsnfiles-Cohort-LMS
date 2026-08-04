-- Diagnostic only — no changes. Run and paste back both result sets.

-- Every students row for each of these 4 people, across every cohort.
-- If any email now has 2+ rows, that's the new duplicate.
select
  p.id as profile_id, p.full_name, p.email,
  s.id as student_id, s.cohort_id, c.name as cohort_name,
  s.peer_group_id, s.track, s.status, s.created_at
from profiles p
left join students s on s.profile_id = p.id
left join cohorts c on c.id = s.cohort_id
where lower(p.email) in (
  'prevailamah09@gmail.com',
  'calebayeni16@gmail.com',
  'eriesirifav@gmail.com',
  'iokonye24@gmail.com'
)
order by p.email, s.created_at;

-- Their access_codes rows.
select code, full_name, email, cohort_id, created_at
from access_codes
where lower(email) in (
  'prevailamah09@gmail.com',
  'calebayeni16@gmail.com',
  'eriesirifav@gmail.com',
  'iokonye24@gmail.com'
)
order by email, created_at;
