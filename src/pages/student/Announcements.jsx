import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

export default function Announcements() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile) load() }, [profile])

  async function load() {
    const { data: stu } = await supabase
      .from('students')
      .select('cohort_id')
      .eq('profile_id', profile.id)
      .single()

    if (!stu) { setLoading(false); return }

    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('cohort_id', stu.cohort_id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })

    setAnnouncements(data || [])
    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Cohort updates</p>
        <h1 className="font-display text-4xl text-atlantic-navy mt-1">Announcements</h1>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <p className="text-denim text-sm">No announcements yet. Check back soon.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div
              key={a.id}
              className={`rounded-2xl border px-6 py-5 ${
                a.pinned
                  ? 'bg-honeycomb/10 border-honeycomb/40'
                  : 'bg-white border-powder'
              }`}
            >
              <div className="flex items-start gap-3">
                {a.pinned && <span className="text-honeycomb text-lg mt-0.5 shrink-0">📌</span>}
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <p className="font-semibold text-classic-navy">{a.title}</p>
                    {a.pinned && (
                      <span className="text-xs font-medium text-honeycomb bg-honeycomb/20 px-2 py-0.5 rounded-full">Pinned</span>
                    )}
                  </div>
                  <p className="text-xs text-denim mb-3">
                    {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-denim text-sm leading-relaxed whitespace-pre-line">{a.body}</p>
                  {a.link && (
                    <a
                      href={a.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-3 text-sm text-atlantic-navy underline underline-offset-2 hover:text-classic-navy"
                    >
                      View link →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
