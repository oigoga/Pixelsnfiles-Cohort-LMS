import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/Spinner'

const resourceIcons = { video: '🎥', doc: '📄', link: '🔗' }

function getEmbedSrc(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    // YouTube
    const ytId = u.searchParams.get('v') || url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)?.[1]
    if (ytId) return `https://www.youtube.com/embed/${ytId}?rel=0`
    // Loom
    const loomId = url.match(/loom\.com\/share\/([a-f0-9]+)/)?.[1]
    if (loomId) return `https://www.loom.com/embed/${loomId}`
    // Google Drive file
    const driveFileId = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)?.[1]
    if (driveFileId) return `https://drive.google.com/file/d/${driveFileId}/preview`
    // Google Docs / Sheets / Slides
    const docsMatch = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/?]+)/)
    if (docsMatch) return `https://docs.google.com/${docsMatch[1]}/d/${docsMatch[2]}/preview`
  } catch {}
  return null
}

const TRACK = {
  AO: { label: 'Admin & Ops',  bg: '#dbeafe', color: '#1d4ed8', emoji: '⚙️' },
  MK: { label: 'Marketing',    bg: '#ede9fe', color: '#6d28d9', emoji: '📣' },
  DS: { label: 'Design',       bg: '#fef3c7', color: '#92400e', emoji: '🎨' },
  GH: { label: 'Get Hired',    bg: '#d1fae5', color: '#065f46', emoji: '🚀' },
}

function getTrack(title) {
  const m = title?.match(/^(AO|MK|DS|GH)-/)
  return m ? TRACK[m[1]] : null
}

export default function ModuleView() {
  const { moduleId } = useParams()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [mod, setMod] = useState(null)
  const [resources, setResources] = useState([])
  const [tasks, setTasks] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState([])

  useEffect(() => { load() }, [moduleId])

  async function load() {
    const [modRes, resRes, taskRes] = await Promise.all([
      supabase.from('modules').select('*').eq('id', moduleId).single(),
      supabase.from('resources').select('*').eq('module_id', moduleId).order('sort_order'),
      supabase.from('tasks').select('*').eq('module_id', moduleId).order('sort_order'),
    ])

    setMod(modRes.data)
    setResources(resRes.data || [])
    const taskList = taskRes.data || []
    setTasks(taskList)

    // Pinned announcements for this cohort
    if (modRes.data?.cohort_id) {
      const { data: anns } = await supabase
        .from('announcements')
        .select('*')
        .eq('cohort_id', modRes.data.cohort_id)
        .eq('pinned', true)
        .order('created_at', { ascending: false })
      setPinnedAnnouncements(anns || [])
    }

    // Load my submissions for these tasks
    if (taskList.length && profile) {
      const { data: stu } = await supabase
        .from('students').select('id').eq('profile_id', profile.id).single()

      if (stu) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('task_id, status, drive_link')
          .eq('student_id', stu.id)
          .in('task_id', taskList.map(t => t.id))

        const subMap = {}
        subs?.forEach(s => { subMap[s.task_id] = s })
        setSubmissions(subMap)
      }
    }

    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
  if (!mod) return <p className="text-denim">Module not found.</p>

  return (
    <div className="space-y-8">
      <div>
        <Link to="/student/dashboard" className="text-sm text-denim hover:text-atlantic-navy">← Dashboard</Link>
        <p className="eyebrow mt-2">Week {mod.week_number}</p>
        <h1 className="font-display text-4xl font-bold text-atlantic-navy mt-1">{mod.title}</h1>
      </div>

      {/* Pinned announcements */}
      {pinnedAnnouncements.map(a => (
        <div key={a.id} className="bg-honeycomb/10 border border-honeycomb/40 rounded-2xl px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="text-honeycomb font-bold text-lg mt-0.5 shrink-0">📌</span>
            <div>
              <p className="font-bold text-classic-navy">{a.title}</p>
              <p className="text-denim text-base mt-1 whitespace-pre-line leading-relaxed">{a.body}</p>
              {a.link && (
                <a href={a.link} target="_blank" rel="noreferrer"
                  className="text-atlantic-navy text-sm underline mt-1 block">
                  View link →
                </a>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Recording + Resources */}
      {(mod.session_recording_url || resources.length > 0) && (() => {
        const allRes = [
          ...(mod.session_recording_url
            ? [{ id: '__recording__', label: 'Session recording', url: mod.session_recording_url, type: 'video' }]
            : []),
          ...resources,
        ]
        const embeds = allRes
          .map(r => ({ ...r, embedSrc: getEmbedSrc(r.url) }))
          .filter(r => r.embedSrc)
        const links = allRes.filter(r => !getEmbedSrc(r.url))

        const header = r => (
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            title={r.label}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-atlantic-navy"
          >
            <span className="shrink-0">{resourceIcons[r.type] || '🔗'}</span>
            <span className="flex-1 min-w-0 truncate">{r.label}</span>
            <span className="shrink-0 text-denim">↗</span>
          </a>
        )

        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-atlantic-navy">Resources</h2>

            {embeds.length > 0 && (
              <div className="grid gap-[0.6rem] grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
                {embeds.map(r => (
                  <div key={r.id} className="rounded-xl border border-powder bg-white overflow-hidden hover:border-denim hover:shadow-sm transition-all">
                    <div className="border-b border-powder bg-powder/40">{header(r)}</div>
                    <iframe
                      src={r.embedSrc}
                      loading="lazy"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      title={r.label}
                      className="w-full aspect-video border-0 block bg-black"
                    />
                  </div>
                ))}
              </div>
            )}

            {links.length > 0 && (
              <div className="grid gap-[0.6rem] grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                {links.map(r => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    title={r.label}
                    className="flex items-center gap-2 rounded-xl border border-powder bg-white px-3 py-2.5 text-sm font-medium text-atlantic-navy hover:border-denim hover:shadow-sm transition-all"
                  >
                    <span className="shrink-0">{resourceIcons[r.type] || '🔗'}</span>
                    <span className="flex-1 min-w-0 truncate">{r.label}</span>
                    <span className="shrink-0 text-denim">→</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* Overview */}
      {mod.overview && (
        <Card>
          <h2 className="font-display text-2xl font-bold text-atlantic-navy mb-3">Overview</h2>
          <p className="text-classic-navy text-base leading-relaxed whitespace-pre-line">{mod.overview}</p>
        </Card>
      )}

      {/* Tasks */}
      <div>
        <h2 className="font-display text-2xl font-bold text-atlantic-navy mb-4">Tasks</h2>
        <div className="space-y-3">
          {tasks.map(task => {
            const sub = submissions[task.id]
            return (
              <Link
                key={task.id}
                to={`/student/task/${task.id}`}
                className="block bg-white border border-powder rounded-2xl p-5 hover:border-denim hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(() => { const t = getTrack(task.title); return t ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: t.bg, color: t.color }}>
                          {t.emoji} {t.label}
                        </span>
                      ) : null })()}
                      {task.type === 'team' && <Badge variant="honeycomb">Team task</Badge>}
                      {task.requires_coach_verification && <Badge variant="info">⭐ Milestone</Badge>}
                    </div>
                    <p className="font-bold text-classic-navy text-base">{task.title}</p>
                    {task.due_date && (
                      <p className="text-sm text-denim mt-1">📅 Due {task.due_date}</p>
                    )}
                  </div>
                  <StatusBadge status={sub?.status || 'not_started'} />
                </div>
              </Link>
            )
          })}
          {tasks.length === 0 && <p className="text-denim text-base">No tasks for this module yet.</p>}
        </div>
      </div>
    </div>
  )
}
