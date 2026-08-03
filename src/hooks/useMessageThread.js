import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Generic realtime message thread backed by Supabase Realtime — no polling.
// Scoped to one column (peer_group_id, student_id, ...) on one table.
export function useMessageThread(table, scopeColumn, scopeValue) {
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
    if (!scopeValue) { setMessages([]); return }
    let cancelled = false

    async function loadInitial() {
      const { data: msgs, error } = await supabase
        .from(table)
        .select('id, author_id, body, created_at')
        .eq(scopeColumn, scopeValue)
        .order('created_at')
      if (error) { setChatError(error.message); return }
      const hydrated = await Promise.all((msgs || []).map(hydrateAuthor))
      if (!cancelled) { setMessages(hydrated); setChatError('') }
    }
    loadInitial()

    const channel = supabase
      .channel(`${table}:${scopeValue}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table,
        filter: `${scopeColumn}=eq.${scopeValue}`,
      }, async ({ new: row }) => {
        const hydrated = await hydrateAuthor(row)
        setMessages(prev => prev.some(m => m.id === hydrated.id) ? prev : [...prev, hydrated])
      })
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [table, scopeColumn, scopeValue, hydrateAuthor])

  async function sendMessage(e, authorId) {
    e.preventDefault()
    if (!newMsg.trim() || !scopeValue) return
    setSending(true)
    setChatError('')
    const { error } = await supabase.from(table).insert({
      [scopeColumn]: scopeValue,
      author_id: authorId,
      body: newMsg.trim(),
    })
    if (error) setChatError(error.message)
    else setNewMsg('')
    setSending(false)
  }

  return { messages, chatError, newMsg, setNewMsg, sending, sendMessage }
}
