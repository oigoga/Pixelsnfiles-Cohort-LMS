-- ============================================================
-- PixelsnFiles Cohort LMS – Supabase Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable pgcrypto for gen_random_uuid() on older Supabase versions
-- (Supabase already enables this by default)

-- ----------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------

create type cohort_status as enum ('open', 'closed', 'active', 'completed');
create type user_role as enum ('student', 'coach');
create type student_status as enum ('enrolled', 'active', 'withdrawn');
create type resource_type as enum ('video', 'doc', 'link');
create type task_type as enum ('individual', 'team');
create type submission_status as enum (
  'not_started', 'submitted', 'peer_approved', 'needs_rework', 'coach_verified'
);
create type review_decision as enum ('approve', 'rework');
create type coach_decision as enum ('verify', 'rework');

-- ----------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------

-- Cohort
create table cohorts (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  start_date    date,
  current_week  int not null default 0,
  status        cohort_status not null default 'open',
  created_at    timestamptz not null default now()
);

-- Profile (mirrors auth.users, one row per user)
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       user_role not null default 'student',
  full_name  text,
  email      text
);

-- Peer group
create table peer_groups (
  id         uuid primary key default gen_random_uuid(),
  cohort_id  uuid not null references cohorts(id) on delete cascade,
  label      text not null  -- e.g. "Group 1"
);

-- Student (extends profile for cohort membership)
create table students (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles(id) on delete cascade,
  cohort_id      uuid not null references cohorts(id) on delete cascade,
  peer_group_id  uuid references peer_groups(id) on delete set null,
  status         student_status not null default 'enrolled',
  created_at     timestamptz not null default now(),
  unique(profile_id, cohort_id)
);

-- Module (weekly unit)
create table modules (
  id                    uuid primary key default gen_random_uuid(),
  cohort_id             uuid not null references cohorts(id) on delete cascade,
  week_number           int not null,
  title                 text not null,
  overview              text,
  session_recording_url text,
  sort_order            int not null default 0
);

-- Resource (attached to a module)
create table resources (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references modules(id) on delete cascade,
  label       text not null,
  url         text not null,
  type        resource_type not null default 'link',
  sort_order  int not null default 0
);

-- Task
create table tasks (
  id                         uuid primary key default gen_random_uuid(),
  module_id                  uuid not null references modules(id) on delete cascade,
  title                      text not null,
  instructions               text,
  type                       task_type not null default 'individual',
  definition_of_done         text[] not null default '{}',
  requires_coach_verification boolean not null default false,
  due_date                   date,
  sort_order                 int not null default 0
);

-- Submission
create table submissions (
  id             uuid primary key default gen_random_uuid(),
  task_id        uuid not null references tasks(id) on delete cascade,
  student_id     uuid references students(id) on delete set null,
  peer_group_id  uuid references peer_groups(id) on delete set null,
  drive_link     text not null,
  status         submission_status not null default 'submitted',
  submitted_at   timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Individual task: student_id set, peer_group_id null
  -- Team task: peer_group_id set (student_id = who submitted on behalf)
  check (student_id is not null or peer_group_id is not null)
);

-- Peer review (individual submissions only)
create table peer_reviews (
  id                  uuid primary key default gen_random_uuid(),
  submission_id       uuid not null references submissions(id) on delete cascade,
  reviewer_student_id uuid not null references students(id) on delete cascade,
  checklist_results   jsonb not null default '{}',
  decision            review_decision not null,
  comment             text,
  created_at          timestamptz not null default now()
);

-- Coach verification (milestone tasks + all team deliverables)
create table coach_verifications (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references submissions(id) on delete cascade,
  coach_id       uuid not null references profiles(id) on delete cascade,
  decision       coach_decision not null,
  comment        text,
  created_at     timestamptz not null default now()
);

-- Announcement
create table announcements (
  id          uuid primary key default gen_random_uuid(),
  cohort_id   uuid not null references cohorts(id) on delete cascade,
  title       text not null,
  body        text not null,
  link        text,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------

create index on students(cohort_id);
create index on students(peer_group_id);
create index on students(profile_id);
create index on modules(cohort_id, sort_order);
create index on tasks(module_id, sort_order);
create index on submissions(task_id);
create index on submissions(student_id);
create index on submissions(peer_group_id);
create index on peer_reviews(submission_id);
create index on announcements(cohort_id, pinned, created_at);

-- ----------------------------------------------------------------
-- AUTO-UPDATE updated_at ON SUBMISSIONS
-- ----------------------------------------------------------------

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger submissions_updated_at
  before update on submissions
  for each row execute function update_updated_at();

-- ----------------------------------------------------------------
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ----------------------------------------------------------------

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles(id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
