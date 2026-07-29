-- Add track column to students table
-- Run in Supabase SQL Editor (project sjydqgfjifaaapheqxgq)

ALTER TABLE students ADD COLUMN IF NOT EXISTS track text DEFAULT 'ao';
