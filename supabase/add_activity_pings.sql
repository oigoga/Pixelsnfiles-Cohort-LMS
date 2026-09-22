-- Time-on-platform tracking: one row per heartbeat while a student's tab
-- is open and visible. "Time spent" is derived by summing gaps between
-- consecutive pings (capped, so a closed tab doesn't inflate the total) —
-- computed client-side, nothing fancy needed in SQL.
-- Run in the Supabase SQL Editor.

create table if not exists activity_pings (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  cohort_id  uuid references cohorts(id) on delete set null,
  pinged_at  timestamptz not null default now()
);

create index if not exists activity_pings_profile_time_idx
  on activity_pings(profile_id, pinged_at);
