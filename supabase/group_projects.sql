-- ============================================================
-- Group projects + chat
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================

-- Per-group project assignment
ALTER TABLE peer_groups
  ADD COLUMN IF NOT EXISTS project_title        text,
  ADD COLUMN IF NOT EXISTS project_brief        text,
  ADD COLUMN IF NOT EXISTS project_resource_url text;

-- Group chat messages
CREATE TABLE IF NOT EXISTS group_messages (
  id            uuid primary key default gen_random_uuid(),
  peer_group_id uuid not null references peer_groups(id) on delete cascade,
  author_id     uuid not null references profiles(id)    on delete cascade,
  body          text not null check (char_length(body) <= 2000),
  created_at    timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS group_messages_group_time_idx
  ON group_messages(peer_group_id, created_at);
