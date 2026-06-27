import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/Spinner'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [cohort, setCohort] = useState(null)
  const [student, setStudent] = useState(null)
  const [modules, setModules] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [groupmates, setGroupmates] = useState([])

  useEffect(() => { if (profile) load() }, [profile])

  async function load() {
    // Student record
    const { data: stu } = await supabase
      .from('students')
      .select('*, cohorts(*), peer_groups(label)')
      .eq('profile_id', profile.id)
      .single()

    if (!stu) { setLoading(false); return }

    setStudent(stu)
    setCohort(stu.cohorts)

    // Modules
    const { data: mods } = await supabase
      .from('modules')
      .select('id, title, week_number, sort_order')
      .eq('cohort_id', stu.cohort_id)
      .order('sort_order')

    setModules(mods || [])

    // My submissions
    const { data: subs } = await supabase
      .from('submissions')
      .select('task_id, status')
      .eq('student_id', stu.id)

    setSubmissions(subs || [])

    // Announcements
    const { data: anns } = await supabase
      .from('announcements')
      .select('*')
      .eq('cohort_id', stu.cohort_id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5)

    setAnnouncements(anns || [])

    // Groupmates
    if (stu.peer_group_id) {
      const { data: gm } = await supabase
        .from('students')
        .select('id, profiles(full_name, email)')
        .eq('peer_group_id', stu.peer_group_id)
        .neq('id', stu.id)

      setGroupmates(gm || [])
    }

    setLoading(false)
  }

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
  )

  if (!student) return (
    <Card>
      <p className="text-denim text-sm">You are not enrolled in an active cohort. Contact your coach.</p>
    </Card>
  )

  const submittedTaskIds = new Set(submissions.map(s => s.task_id))
  const doneCount = submissions.filter(s => ['peer_approved', 'coach_verified'].includes(s.status)).length
  const currentWeek = cohort?.current_week || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="eyebrow">Welcome back</p>
        <h1 className="font-display text-4xl text-atlantic-navy mt-1">
          {profile?.full_name?.split(' ')[0] || 'Student'}
        </h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="info">{cohort?.name}</Badge>
          {student.peer_groups && <Badge variant="honeycomb">{student.peer_groups.label}</Badge>}
          <Badge variant="default">Week {currentWeek}</Badge>
        </div>
      </div>

      {/* Pinned announcements */}
      {announcements.filter(a => a.pinned).map(a => (
        <div key={a.id} className="bg-honeycomb/20 border border-honeycomb/40 rounded-2xl px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="text-honeycomb font-bold text-lg mt-0.5">📌</span>
            <div>
              <p className="font-semibold text-classic-navy text-sm">{a.title}</p>
              <p className="text-denim text-sm mt-1 whitespace-pre-line">{a.body}</p>
              {a.link && <a href={a.link} target="_blank" rel="noreferrer" className="text-atlantic-navy text-sm underline mt-1 block">View link →</a>}
            </div>
          </div>
        </div>
      ))}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Progress summary */}
        <Card>
          <p className="eyebrow mb-2">My progress</p>
          <div className="text-4xl font-display text-atlantic-navy">{doneCount}</div>
          <p className="text-sm text-denim mt-1">tasks approved</p>
          {submissions.filter(s => s.status === 'needs_rework').length > 0 && (
            <p className="text-sm text-red-600 mt-2 font-medium">
              {submissions.filter(s => s.status === 'needs_rework').length} task(s) need rework
            </p>
          )}
        </Card>

        {/* Group */}
        <Card>
          <p className="eyebrow mb-2">My group</p>
          {student.peer_groups ? (
            <div>
              <p className="font-semibold text-classic-navy mb-2">{student.peer_groups.label}</p>
              <ul className="space-y-1">
                {groupmates.map(gm => (
                  <li key={gm.id} className="text-sm text-denim">{gm.profiles?.full_name || gm.profiles?.email}</li>
                ))}
              </ul>
              <Link to="/student/group" className="inline-block mt-3 text-sm text-atlantic-navy underline underline-offset-2">
                Group Hub →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-denim">Groups not yet assigned.</p>
          )}
        </Card>

        {/* Recent announcements */}
        <Card>
          <p className="eyebrow mb-2">Announcements</p>
          {announcements.length === 0 ? (
            <p className="text-sm text-denim">No announcements yet.</p>
          ) : (
            <ul className="space-y-2">
              {announcements.slice(0, 3).map(a => (
                <li key={a.id}>
                  <p className="text-sm font-medium text-classic-navy leading-tight">{a.title}</p>
                  <p className="text-xs text-denim mt-0.5">{new Date(a.created_at).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Modules list */}
      <div>
        <h2 className="font-display text-2xl text-atlantic-navy mb-4">Modules</h2>
        <div className="space-y-3">
          {modules.map(mod => {
            const isCurrentWeek = mod.week_number === currentWeek
            const isUnlocked = mod.week_number <= currentWeek
            return (
              <div
                key={mod.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                  isUnlocked
                    ? 'bg-whipped-cream border-powder hover:border-denim cursor-pointer'
                    : 'bg-powder/30 border-powder/50 opacity-60 cursor-not-allowed'
                }`}
                onClick={() => isUnlocked && (window.location.href = `/student/module/${mod.id}`)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-lg font-medium ${
                  isCurrentWeek ? 'bg-atlantic-navy text-soft-butter' : 'bg-powder text-denim'
                }`}>
                  {mod.week_number}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-classic-navy text-sm">{mod.title}</p>
                  {isCurrentWeek && <p className="text-xs text-honeycomb font-medium mt-0.5">Current week</p>}
                </div>
                {isUnlocked ? (
                  <span className="text-denim text-sm">→</span>
                ) : (
                  <span className="text-xs text-denim">Locked</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
