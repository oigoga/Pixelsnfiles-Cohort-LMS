import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Live group chat backed by Supabase Realtime — no polling.
// New rows arrive over the `group_messages` channel and are appended in place.
export function useGroupChat(groupId) {
  const [messages, setMessages] = useState([])
  const [chatError, setChatError] = useState('')
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const profileCache = useRef({})

  const hydrateAuthor = useCallback(async (msg) => {
    if (!profileCache.current[msg.author_id]) {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', msg.author_id)
        .single()
      profileCache.current[msg.author_id] = data || null
    }
    return { ...msg, profiles: profileCache.current[msg.author_id] }
  }, [])

  useEffect(() => {
    if (!groupId) { setMessages([]); return }
    let cancelled = false

    async function loadInitial() {
      const { data: msgs, error } = await supabase
        .from('group_messages')
        .select('id, author_id, body, created_at')
        .eq('peer_group_id', groupId)
        .order('created_at')
      if (error) { setChatError(error.message); return }
      const hydrated = await Promise.all((msgs || []).map(hydrateAuthor))
      if (!cancelled) { setMessages(hydrated); setChatError('') }
    }
    loadInitial()

    const channel = supabase
      .channel(`group_messages:${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'group_messages',
        filter: `peer_group_id=eq.${groupId}`,
      }, async ({ new: row }) => {
        const hydrated = await hydrateAuthor(row)
        setMessages(prev => prev.some(m => m.id === hydrated.id) ? prev : [...prev, hydrated])
      })
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [groupId, hydrateAuthor])

  async function sendMessage(e, authorId) {
    e.preventDefault()
    if (!newMsg.trim() || !groupId) return
    setSending(true)
    setChatError('')
    const { error } = await supabase.from('group_messages').insert({
      peer_group_id: groupId,
      author_id: authorId,
      body: newMsg.trim(),
    })
    if (error) setChatError(error.message)
    else setNewMsg('')
    setSending(false)
  }

  return { messages, chatError, newMsg, setNewMsg, sending, sendMessage }
}
