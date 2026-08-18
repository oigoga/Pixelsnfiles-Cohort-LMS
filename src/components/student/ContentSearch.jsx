import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const typeIcon = { task: '📋', resource: '🔗', announcement: '📢' }

export function ContentSearch() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    const q = query.trim()
    if (q.length < 2 || !profile?.cohort_id) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      const like = `%${q}%`
      const [{ data: tasks }, { data: resources }, { data: announcements }] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, modules!inner(cohort_id)')
          .eq('modules.cohort_id', profile.cohort_id)
          .or(`title.ilike.${like},instructions.ilike.${like}`)
          .limit(6),
        supabase
          .from('resources')
          .select('id, label, module_id, modules!inner(cohort_id)')
          .eq('modules.cohort_id', profile.cohort_id)
          .ilike('label', like)
          .limit(6),
        supabase
          .from('announcements')
          .select('id, title')
          .eq('cohort_id', profile.cohort_id)
          .or(`title.ilike.${like},body.ilike.${like}`)
          .limit(6),
      ])

      setResults([
        ...(tasks || []).map(t => ({ type: 'task', id: t.id, label: t.title, to: `/student/task/${t.id}` })),
        ...(resources || []).map(r => ({ type: 'resource', id: r.id, label: r.label, to: `/student/module/${r.module_id}` })),
        ...(announcements || []).map(a => ({ type: 'announcement', id: a.id, label: a.title, to: '/student/announcements' })),
      ])
    }, 250)

    return () => clearTimeout(debounceRef.current)
  }, [query, profile?.cohort_id])

  function goTo(to) {
    setOpen(false)
    setQuery('')
    navigate(to)
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search tasks, resources, announcements…"
        className="w-32 sm:w-48 lg:w-72 px-3 py-1.5 rounded-lg bg-powder/40 border border-powder text-classic-navy placeholder-denim/50 text-sm focus:outline-none focus:ring-2 focus:ring-atlantic-navy/30"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl border border-powder shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-sm text-denim px-4 py-3">Nothing found for "{query}".</p>
          ) : (
            results.map(r => (
              <button
                key={`${r.type}-${r.id}`}
                onMouseDown={() => goTo(r.to)}
                className="w-full text-left px-4 py-2.5 hover:bg-powder/40 transition-colors border-b border-powder/40 last:border-0 flex items-start gap-2"
              >
                <span className="shrink-0 mt-0.5">{typeIcon[r.type]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-classic-navy truncate">{r.label}</p>
                  <p className="text-xs text-denim capitalize">{r.type}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
