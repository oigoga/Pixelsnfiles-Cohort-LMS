import { useMessageThread } from './useMessageThread'

// Live group chat backed by Supabase Realtime — no polling.
export function useGroupChat(groupId) {
  return useMessageThread('group_messages', 'peer_group_id', groupId)
}
