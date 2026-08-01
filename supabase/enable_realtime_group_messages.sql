-- Enable Realtime streaming for group chat so clients get pushed new
-- messages over a websocket instead of polling every few seconds.
-- Run once in the Supabase SQL Editor (project sjydqgfjifaaapheqxgq).
alter publication supabase_realtime add table group_messages;
