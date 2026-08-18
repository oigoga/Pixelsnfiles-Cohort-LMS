-- Diagnostic only. Paste back the full result.
select
  p.id as profile_id, p.full_name, p.email,
  s.id as student_id, s.peer_group_id, s.track, s.status, s.created_at
from profiles p
left join students s on s.profile_id = p.id
where lower(p.email) = 'eriesirifav@gmail.com'
order by s.created_at;
