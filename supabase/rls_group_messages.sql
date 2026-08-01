-- Lock down group chat: only coaches and members of a peer group can
-- read/post its messages. Run once in the Supabase SQL Editor, after
-- rls.sql and group_projects.sql (needs current_profile() from rls.sql).

alter table group_messages enable row level security;

-- Coach: full access
create policy "coach_all_group_messages" on group_messages for all
  using ((current_profile()).role = 'coach');

-- Students: read messages in their own peer group
create policy "student_read_group_messages" on group_messages for select
  using (
    peer_group_id in (
      select s.peer_group_id from students s
      where s.profile_id = auth.uid() and s.peer_group_id is not null
    )
  );

-- Students: post messages as themselves, only into their own peer group
create policy "student_insert_group_messages" on group_messages for insert
  with check (
    author_id = auth.uid()
    and peer_group_id in (
      select s.peer_group_id from students s
      where s.profile_id = auth.uid() and s.peer_group_id is not null
    )
  );
