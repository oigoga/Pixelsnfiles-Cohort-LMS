-- Lets a coach assign a specific reviewer to a specific submission,
-- overriding the default "anyone in the reviewee's pod can pick it up"
-- behavior — including a reviewer from a different pod entirely.
-- Already applied directly to the live project via the Supabase MCP
-- (migration "add_reviewer_assignment") — kept here as a record, and
-- safe to re-run (IF NOT EXISTS) if you're ever restoring a fresh DB.

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS assigned_reviewer_id uuid REFERENCES students(id) ON DELETE SET NULL;
