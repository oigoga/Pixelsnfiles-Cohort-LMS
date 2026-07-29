-- Run in Supabase SQL Editor (project sjydqgfjifaaapheqxgq)
-- Adds a track field to peer_groups for labelling by discipline

ALTER TABLE peer_groups ADD COLUMN IF NOT EXISTS track text;
