-- Run each query below separately in the Supabase SQL Editor, then use
-- the "Download CSV" option on the results grid for each one.
--
-- Replace 'REPLACE_WITH_TEST_GROUP_LABEL' in queries 2-4 with the exact
-- pod label to exclude (run the lookup query first to find it). Query 1
-- (tasks) has no exclusion — tasks aren't tied to a pod, they're
-- cohort-wide, so there's nothing to exclude there.

-- ── Lookup: find the test group's exact label ───────────────────
select id, label
from peer_groups
where cohort_id = (select id from cohorts where name ilike '%Cohort 1%' limit 1)
order by label;

-- ── 1. Tasks ─────────────────────────────────────────────────────
-- "track" isn't a stored column — derived from the title prefix,
-- same convention the app itself uses (AO-/MK-/DS-/GH-).
select
  t.id,
  t.title,
  m.week_number                            as week,
  case
    when t.title ~ '^AO-' then 'ao'
    when t.title ~ '^MK-' then 'marketing'
    when t.title ~ '^DS-' then 'design'
    when t.title ~ '^GH-' then 'get_hired'
    else null
  end                                       as track,
  t.requires_coach_verification            as is_milestone,
  t.sort_order                             as "order"
from tasks t
join modules m on m.id = t.module_id
where m.cohort_id = (select id from cohorts where name ilike '%Cohort 1%' limit 1)
order by m.week_number, t.sort_order;

-- ── 2. Students ──────────────────────────────────────────────────
select
  s.id,
  p.full_name,
  pg.label as pod,
  s.track,
  s.status
from students s
join profiles p on p.id = s.profile_id
left join peer_groups pg on pg.id = s.peer_group_id
where s.cohort_id = (select id from cohorts where name ilike '%Cohort 1%' limit 1)
  and (pg.label is null or pg.label <> 'REPLACE_WITH_TEST_GROUP_LABEL')
order by p.full_name;

-- ── 3. Submissions ───────────────────────────────────────────────
-- reviewed_at / reviewer_id aren't direct columns — a submission is
-- reviewed via peer_reviews (reviewer_student_id) or, for milestones,
-- coach_verifications (coach_id). This takes whichever happened most
-- recently for that submission (so a milestone that got a peer review
-- and then a later coach sign-off correctly shows the coach as the
-- final reviewer). Both null if it's never been reviewed.
select
  sub.student_id,
  sub.task_id,
  sub.status,
  sub.submitted_at,
  greatest(pr.latest_at, cv.latest_at) as reviewed_at,
  coalesce(
    case when pr.latest_at >= coalesce(cv.latest_at, '-infinity'::timestamptz) then pr.reviewer_student_id end,
    case when cv.latest_at >= coalesce(pr.latest_at, '-infinity'::timestamptz) then cv.coach_id end
  ) as reviewer_id
from submissions sub
join students s on s.id = sub.student_id
left join peer_groups pg on pg.id = s.peer_group_id
left join lateral (
  select reviewer_student_id, created_at as latest_at
  from peer_reviews
  where submission_id = sub.id
  order by created_at desc
  limit 1
) pr on true
left join lateral (
  select coach_id, created_at as latest_at
  from coach_verifications
  where submission_id = sub.id
  order by created_at desc
  limit 1
) cv on true
where s.cohort_id = (select id from cohorts where name ilike '%Cohort 1%' limit 1)
  and (pg.label is null or pg.label <> 'REPLACE_WITH_TEST_GROUP_LABEL')
order by sub.submitted_at;

-- ── 4. Last activity per student ─────────────────────────────────
-- Only reflects activity_pings, added today (add_activity_pings.sql).
-- Anyone who hasn't logged in since that migration ran will show a
-- null last_activity_at — there's no earlier login-timestamp data
-- anywhere else in the schema to fall back on.
select
  s.id as student_id,
  p.full_name,
  max(ap.pinged_at) as last_activity_at
from students s
join profiles p on p.id = s.profile_id
left join peer_groups pg on pg.id = s.peer_group_id
left join activity_pings ap on ap.profile_id = s.profile_id
where s.cohort_id = (select id from cohorts where name ilike '%Cohort 1%' limit 1)
  and (pg.label is null or pg.label <> 'REPLACE_WITH_TEST_GROUP_LABEL')
group by s.id, p.full_name
order by p.full_name;
