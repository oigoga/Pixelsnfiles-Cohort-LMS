-- For each of the 4, confirms whether their current access code actually
-- points at their real enrolled profile. codes_match = false means
-- logging in with that code will create ANOTHER duplicate, same as
-- happened with Caleb and Favour — fix it before sending the code out,
-- don't wait for someone to log in and find out.
select
  s.id as student_id, p.id as profile_id, p.full_name, ac.code,
  s.peer_group_id, s.track, s.status,
  p.id = md5(upper(trim(ac.code)))::uuid as codes_match
from students s
join profiles p on p.id = s.profile_id
join access_codes ac on lower(ac.email) = lower(p.email)
where lower(p.email) in (
  'iokonye24@gmail.com',
  'prevailamah09@gmail.com',
  'calebayeni16@gmail.com',
  'eriesirifav@gmail.com'
);
