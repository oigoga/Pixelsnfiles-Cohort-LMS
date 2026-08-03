-- Read-only check: is RLS actually enabled on group_messages, and if so,
-- what policies exist? Run this in the Supabase SQL Editor and share the
-- two result sets back.

select relrowsecurity as rls_enabled
from pg_class
where relname = 'group_messages';

select policyname, cmd, qual, with_check
from pg_policies
where tablename = 'group_messages';
