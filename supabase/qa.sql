-- ============================================================
-- Q&A board — run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS questions (
  id          uuid primary key default gen_random_uuid(),
  cohort_id   uuid not null references cohorts(id)  on delete cascade,
  author_id   uuid not null references profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 1000),
  is_resolved boolean not null default false,
  created_at  timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS question_answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  author_id   uuid not null references profiles(id)  on delete cascade,
  body        text     check (char_length(body) <= 2000),
  link        text,
  created_at  timestamptz not null default now(),
  -- must have at least body or link
  check (body is not null or link is not null)
);

-- one upvote per person per question
CREATE TABLE IF NOT EXISTS question_votes (
  question_id uuid not null references questions(id) on delete cascade,
  profile_id  uuid not null references profiles(id)  on delete cascade,
  primary key (question_id, profile_id)
);

CREATE INDEX IF NOT EXISTS questions_cohort_idx     ON questions(cohort_id, created_at desc);
CREATE INDEX IF NOT EXISTS question_answers_q_idx   ON question_answers(question_id, created_at);
CREATE INDEX IF NOT EXISTS question_votes_q_idx     ON question_votes(question_id);
