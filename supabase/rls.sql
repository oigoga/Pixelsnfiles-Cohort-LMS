-- ============================================================
-- PixelsnFiles Cohort LMS – Row Level Security Policies
-- Run AFTER schema.sql in the Supabase SQL editor
-- ============================================================

-- Helper: returns the current user's profile row
create or replace function current_profile()
returns profiles language sql security definer stable as $$
  select * from profiles where id = auth.uid() limit 1;
$$;

-- Helper: returns the student row for the current user in a given cohort
-- (used in submission/review policies)
create or replace function my_student_id(p_cohort_id uuid)
returns uuid language sql security definer stable as $$
  select s.id from students s
  join profiles p on p.id = auth.uid()
  where s.profile_id = auth.uid() and s.cohort_id = p_cohort_id
  limit 1;
$$;

-- Helper: returns the peer_group_id for the current user in a cohort
create or replace function my_peer_group_id(p_cohort_id uuid)
returns uuid language sql security definer stable as $$
  select s.peer_group_id from students s
  where s.profile_id = auth.uid() and s.cohort_id = p_cohort_id
  limit 1;
$$;

-- ----------------------------------------------------------------
-- Enable RLS on all tables
-- ----------------------------------------------------------------

alter table cohorts            enable row level security;
alter table profiles           enable row level security;
alter table peer_groups        enable row level security;
alter table students           enable row level security;
alter table modules            enable row level security;
alter table resources          enable row level security;
alter table tasks              enable row level security;
alter table submissions        enable row level security;
alter table peer_reviews       enable row level security;
alter table coach_verifications enable row level security;
alter table announcements      enable row level security;

-- ================================================================
-- COACH: full access to everything
-- ================================================================

create policy "coach_all_cohorts"            on cohorts            for all using ((current_profile()).role = 'coach');
create policy "coach_all_profiles"           on profiles           for all using ((current_profile()).role = 'coach');
create policy "coach_all_peer_groups"        on peer_groups        for all using ((current_profile()).role = 'coach');
create policy "coach_all_students"           on students           for all using ((current_profile()).role = 'coach');
create policy "coach_all_modules"            on modules            for all using ((current_profile()).role = 'coach');
create policy "coach_all_resources"          on resources          for all using ((current_profile()).role = 'coach');
create policy "coach_all_tasks"              on tasks              for all using ((current_profile()).role = 'coach');
create policy "coach_all_submissions"        on submissions        for all using ((current_profile()).role = 'coach');
create policy "coach_all_peer_reviews"       on peer_reviews       for all using ((current_profile()).role = 'coach');
create policy "coach_all_coach_verifications" on coach_verifications for all using ((current_profile()).role = 'coach');
create policy "coach_all_announcements"      on announcements      for all using ((current_profile()).role = 'coach');

-- ================================================================
-- STUDENTS
-- ================================================================

-- Own profile: read + update
create policy "student_own_profile_read"   on profiles for select using (id = auth.uid());
create policy "student_own_profile_update" on profiles for update using (id = auth.uid());

-- Cohorts: read only (they need to see their cohort info)
create policy "student_read_cohorts" on cohorts for select
  using (
    exists(
      select 1 from students s
      where s.profile_id = auth.uid() and s.cohort_id = cohorts.id
    )
  );

-- Peer groups: students can read groups in their cohort
create policy "student_read_peer_groups" on peer_groups for select
  using (
    exists(
      select 1 from students s
      where s.profile_id = auth.uid() and s.cohort_id = peer_groups.cohort_id
    )
  );

-- Students: a student can see themselves and their own group-mates
create policy "student_read_own_record" on students for select
  using (profile_id = auth.uid());

create policy "student_read_groupmates" on students for select
  using (
    peer_group_id is not null and
    peer_group_id in (
      select s.peer_group_id from students s
      where s.profile_id = auth.uid() and s.peer_group_id is not null
    )
  );

-- Modules: read modules for their cohort
create policy "student_read_modules" on modules for select
  using (
    exists(
      select 1 from students s
      where s.profile_id = auth.uid() and s.cohort_id = modules.cohort_id
    )
  );

-- Resources: read resources for modules in their cohort
create policy "student_read_resources" on resources for select
  using (
    exists(
      select 1 from modules m
      join students s on s.cohort_id = m.cohort_id
      where m.id = resources.module_id and s.profile_id = auth.uid()
    )
  );

-- Tasks: read tasks for modules in their cohort
create policy "student_read_tasks" on tasks for select
  using (
    exists(
      select 1 from modules m
      join students s on s.cohort_id = m.cohort_id
      where m.id = tasks.module_id and s.profile_id = auth.uid()
    )
  );

-- Submissions: read own submissions
create policy "student_read_own_submissions" on submissions for select
  using (
    student_id in (
      select id from students where profile_id = auth.uid()
    )
  );

-- Submissions: read groupmates' individual submissions (for peer review)
create policy "student_read_groupmate_submissions" on submissions for select
  using (
    peer_group_id is null and  -- individual task
    student_id in (
      select s2.id from students s2
      where s2.peer_group_id in (
        select s.peer_group_id from students s
        where s.profile_id = auth.uid() and s.peer_group_id is not null
      )
    )
  );

-- Submissions: read group's team submissions
create policy "student_read_group_team_submissions" on submissions for select
  using (
    peer_group_id is not null and
    peer_group_id in (
      select s.peer_group_id from students s
      where s.profile_id = auth.uid() and s.peer_group_id is not null
    )
  );

-- Submissions: create own individual submission
create policy "student_insert_own_submission" on submissions for insert
  with check (
    student_id in (
      select id from students where profile_id = auth.uid()
    )
  );

-- Submissions: create group team submission
create policy "student_insert_team_submission" on submissions for insert
  with check (
    peer_group_id is not null and
    peer_group_id in (
      select s.peer_group_id from students s
      where s.profile_id = auth.uid() and s.peer_group_id is not null
    )
  );

-- Submissions: update own or group submission
create policy "student_update_own_submission" on submissions for update
  using (
    student_id in (select id from students where profile_id = auth.uid())
    or
    (peer_group_id is not null and peer_group_id in (
      select s.peer_group_id from students s
      where s.profile_id = auth.uid() and s.peer_group_id is not null
    ))
  );

-- Peer reviews: read reviews on group submissions
create policy "student_read_peer_reviews" on peer_reviews for select
  using (
    submission_id in (
      select sub.id from submissions sub
      join students s on s.id = sub.student_id
      where s.peer_group_id in (
        select s2.peer_group_id from students s2
        where s2.profile_id = auth.uid() and s2.peer_group_id is not null
      )
    )
  );

-- Peer reviews: create reviews on groupmates' submissions (not own)
create policy "student_insert_peer_review" on peer_reviews for insert
  with check (
    reviewer_student_id in (
      select id from students where profile_id = auth.uid()
    )
    and
    -- Cannot review own submission
    submission_id not in (
      select sub.id from submissions sub
      join students s on s.id = auth.uid()
      where sub.student_id = reviewer_student_id
    )
  );

-- Coach verifications: students can read (to see their result)
create policy "student_read_coach_verifications" on coach_verifications for select
  using (
    submission_id in (
      select id from submissions where student_id in (
        select id from students where profile_id = auth.uid()
      )
      union
      select id from submissions where peer_group_id in (
        select peer_group_id from students
        where profile_id = auth.uid() and peer_group_id is not null
      )
    )
  );

-- Announcements: read for their cohort
create policy "student_read_announcements" on announcements for select
  using (
    cohort_id in (
      select cohort_id from students where profile_id = auth.uid()
    )
  );
