import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

export default function AnnouncementsManager() {
  const { profile } = useAuth()
  const [cohorts, setCohorts] = useState([])
  const [cohortId, setCohortId] = useState('')
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  // Form
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [pinned, setPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('cohorts').select('id, name').order('created_at', { ascending: false })
      .then(({ data }) => {
        setCohorts(data || [])
        if (data?.length) setCohortId(data[0].id)
      })
  }, [])

  useEffect(() => { if (cohortId) loadAnnouncements(cohortId) }, [cohortId])

  async function loadAnnouncements(cId) {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('cohort_id', cId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setAnnouncements(data || [])
    setLoading(false)
  }

  async function post(e) {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase.from('announcements')
      .insert({ cohort_id: cohortId, title, body, link: link || null, pinned })
      .select().single()
    setAnnouncements(prev => [data, ...prev].sort((a, b) => b.pinned - a.pinned))
    setTitle(''); setBody(''); setLink(''); setPinned(false)
    setSaving(false)
  }

  async function togglePin(ann) {
    await supabase.from('announcements').update({ pinned: !ann.pinned }).eq('id', ann.id)
    setAnnouncements(prev =>
      prev.map(a => a.id === ann.id ? { ...a, pinned: !a.pinned } : a)
        .sort((a, b) => b.pinned - a.pinned || new Date(b.created_at) - new Date(a.created_at))
    )
  }

  async function deleteAnn(id) {
    if (!confirm('Delete this announcement?')) return
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <p className="eyebrow">Coach</p>
          <h1 className="font-display text-3xl text-atlantic-navy mt-1">Announcements</h1>
        </div>
        <select
          value={cohortId}
          onChange={e => setCohortId(e.target.value)}
          className="input-field text-sm ml-auto"
        >
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Compose */}
      <Card>
        <h2 className="font-display text-xl text-atlantic-navy mb-4">Post announcement</h2>
        <form onSubmit={post} className="space-y-4">
          <div>
            <label className="eyebrow block mb-1">Title</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Week 2 is live!" className="input-field" />
          </div>
          <div>
            <label className="eyebrow block mb-1">Body</label>
            <textarea required value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Write your message here…" className="input-field resize-y" />
          </div>
          <div>
            <label className="eyebrow block mb-1">Link (optional)</label>
            <input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://…" className="input-field" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pinned}
              onChange={e => setPinned(e.target.checked)}
              className="w-4 h-4 accent-atlantic-navy"
            />
            <span className="text-sm text-denim">Pin to top of student dashboard</span>
          </label>
          <Button type="submit" disabled={saving}>{saving ? 'Posting…' : 'Post announcement'}</Button>
        </form>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-denim">Loading…</p>
        ) : announcements.length === 0 ? (
          <Card><p className="text-sm text-denim">No announcements yet.</p></Card>
        ) : (
          announcements.map(a => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {a.pinned && <span className="text-honeycomb">📌</span>}
                    <p className="font-semibold text-classic-navy text-sm">{a.title}</p>
                  </div>
                  <p className="text-sm text-denim whitespace-pre-line leading-relaxed">{a.body}</p>
                  {a.link && (
                    <a href={a.link} target="_blank" rel="noreferrer" className="text-xs text-atlantic-navy underline mt-1 block">
                      {a.link}
                    </a>
                  )}
                  <p className="text-xs text-denim mt-2">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => togglePin(a)}
                    className="text-xs text-denim hover:text-atlantic-navy"
                    title={a.pinned ? 'Unpin' : 'Pin'}
                  >
                    {a.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={() => deleteAnn(a.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
