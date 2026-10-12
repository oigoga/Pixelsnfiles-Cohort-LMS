-- Lets a task be marked "requires_submission = false" — students just
-- check a box instead of submitting a Drive link, no peer/coach review
-- involved. Used for Week 0 onboarding tasks in both cohorts.
-- Already applied directly to the live project via the Supabase MCP —
-- kept here as a record.

ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'done';

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_submission boolean NOT NULL DEFAULT true;
ALTER TABLE submissions ALTER COLUMN drive_link DROP NOT NULL;

UPDATE tasks SET requires_submission = false
WHERE module_id IN (SELECT id FROM modules WHERE week_number = 0);
