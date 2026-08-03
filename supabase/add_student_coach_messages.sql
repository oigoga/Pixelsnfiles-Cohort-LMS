-- Private 1:1 message thread between a student and their coach(es).
-- Replaces the old one-way coach_notes text field (students.coach_notes)
-- with a real back-and-forth thread — both sides can write, live via
-- Realtime, just like group chat.
-- Run in the Supabase SQL Editor.

create table if not exists student_coach_messages (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  author_id   uuid not null references profiles(id) on delete cascade,
  body        text not null check (char_length(body) <= 2000),
  created_at  timestamptz not null default now()
);

create index if not exists student_coach_messages_student_time_idx
  on student_coach_messages(student_id, created_at);

-- Enable Realtime so messages push live instead of polling.
alter publication supabase_realtime add table student_coach_messages;
