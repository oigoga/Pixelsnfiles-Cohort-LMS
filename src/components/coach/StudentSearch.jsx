import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function StudentSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    const q = query.trim()
    if (q.length < 2) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('students')
        .select('id, status, profiles(full_name, email)')
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`, { foreignTable: 'profiles' })
        .limit(8)
      setResults(data || [])
    }, 250)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  function goTo(id) {
    setOpen(false)
    setQuery('')
    navigate(`/coach/student/${id}`)
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Find a student…"
        className="w-44 sm:w-64 px-3 py-1.5 rounded-lg bg-white/10 border border-powder/30 text-soft-butter placeholder-powder/50 text-sm focus:outline-none focus:ring-2 focus:ring-powder/40"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl border border-powder shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-sm text-denim px-4 py-3">No students found.</p>
          ) : (
            results.map(s => (
              <button
                key={s.id}
                onMouseDown={() => goTo(s.id)}
                className="w-full text-left px-4 py-2.5 hover:bg-powder/40 transition-colors border-b border-powder/40 last:border-0"
              >
                <p className="text-sm font-medium text-classic-navy truncate">{s.profiles?.full_name || '—'}</p>
                <p className="text-xs text-denim truncate">{s.profiles?.email}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
