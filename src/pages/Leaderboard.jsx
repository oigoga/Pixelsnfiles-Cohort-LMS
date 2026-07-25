import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'

// Points per submission status
const POINTS = {
  coach_verified: 3,
  peer_approved:  2,
  submitted:      1,
  needs_rework:   0,
  not_started:    0,
}

const medals = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const { profile } = useAuth()
  const [tab, setTab]           = useState('groups')
  const [loading, setLoading]   = useState(true)
  const [groups, setGroups]     = useState([])
  const [students, setStudents] = useState([])

  useEffect(() => { if (profile) load() }, [profile])

  async function load() {
    // Find cohort for this user
    let cohortId
    if (profile.role === 'coach') {
      const { data } = await supabase
        .from('cohorts')
        .select('id')
        .in('status', ['open', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      cohortId = data?.id
    } else {
      const { data } = await supabase
        .from('students')
        .select('cohort_id')
        .eq('profile_id', profile.id)
        .single()
      cohortId = data?.cohort_id
    }

    if (!cohortId) { setLoading(false); return }

    // Load all students in this cohort with their peer group
    const { data: stuData } = await supabase
      .from('students')
      .select('id, profile_id, peer_group_id, peer_groups(label), profiles(full_name)')
      .eq('cohort_id', cohortId)

    if (!stuData?.length) { setLoading(false); return }

    const studentIds = stuData.map(s => s.id)

    // Load all submissions for these students
    const { data: subs } = await supabase
      .from('submissions')
      .select('student_id, peer_group_id, status, task_id')
      .or(`student_id.in.(${studentIds.join(',')}),peer_group_id.in.(${stuData.map(s => s.peer_group_id).filter(Boolean).join(',')})`)

    const subList = subs || []

    // ── Individual scores ─────────────────────────────────────
    const studentScores = stuData.map(s => {
      const mySubs = subList.filter(sub => sub.student_id === s.id)
      const points = mySubs.reduce((sum, sub) => sum + (POINTS[sub.status] || 0), 0)
      const approved = mySubs.filter(sub => ['peer_approved', 'coach_verified'].includes(sub.status)).length
      return {
        id:        s.id,
        name:      s.profiles?.full_name || 'Student',
        group:     s.peer_groups?.label || '—',
        points,
        approved,
        total:     mySubs.length,
      }
    }).sort((a, b) => b.points - a.points)

    // ── Group scores ──────────────────────────────────────────
    const groupMap = {}
    stuData.forEach(s => {
      if (!s.peer_group_id) return
      if (!groupMap[s.peer_group_id]) {
        groupMap[s.peer_group_id] = {
          id:       s.peer_group_id,
          label:    s.peer_groups?.label || 'Unknown',
          members:  0,
          points:   0,
          approved: 0,
        }
      }
      groupMap[s.peer_group_id].members++

      // Individual subs from this member
      subList.filter(sub => sub.student_id === s.id).forEach(sub => {
        groupMap[s.peer_group_id].points   += POINTS[sub.status] || 0
        if (['peer_approved', 'coach_verified'].includes(sub.status))
          groupMap[s.peer_group_id].approved++
      })
    })

    // Team subs — add to the group (avoid double-counting per task)
    const teamSubsByGroup = {}
    subList.filter(sub => sub.peer_group_id).forEach(sub => {
      const key = `${sub.peer_group_id}-${sub.task_id}`
      if (!teamSubsByGroup[key]) {
        teamSubsByGroup[key] = sub
        if (groupMap[sub.peer_group_id]) {
          groupMap[sub.peer_group_id].points   += POINTS[sub.status] || 0
          if (['peer_approved', 'coach_verified'].includes(sub.status))
            groupMap[sub.peer_group_id].approved++
        }
      }
    })

    const groupScores = Object.values(groupMap).sort((a, b) => b.points - a.points)

    setStudents(studentScores)
    setGroups(groupScores)
    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Healthy competition</p>
        <h1 className="font-display text-4xl text-atlantic-navy mt-1">Leaderboard</h1>
        <p className="text-denim text-sm mt-1">
          Points: submitted = 1 &nbsp;·&nbsp; peer approved = 2 &nbsp;·&nbsp; coach verified = 3
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-powder">
        {[['groups', 'Groups'], ['individuals', 'Individuals']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-6 py-3 text-sm font-semibold transition-colors ${
              tab === key
                ? 'text-atlantic-navy border-b-2 border-atlantic-navy'
                : 'text-denim hover:text-classic-navy'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Groups tab */}
      {tab === 'groups' && (
        <div className="space-y-3">
          {groups.length === 0 ? (
            <Card><p className="text-denim text-sm">Groups not yet assigned. Come back once peer groups are set up.</p></Card>
          ) : groups.map((g, i) => (
            <div
              key={g.id}
              className={`flex items-center gap-4 p-5 rounded-2xl border transition-colors ${
                i === 0 ? 'bg-honeycomb/10 border-honeycomb/50' :
                i === 1 ? 'bg-powder/60 border-powder' :
                i === 2 ? 'bg-white border-powder' :
                          'bg-white border-powder/60'
              }`}
            >
              <div className="text-2xl w-8 text-center shrink-0">
                {medals[i] || <span className="text-lg font-bold text-denim">{i + 1}</span>}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-classic-navy">{g.label}</p>
                <p className="text-xs text-denim mt-0.5">{g.members} member{g.members !== 1 ? 's' : ''} · {g.approved} task{g.approved !== 1 ? 's' : ''} approved</p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl text-atlantic-navy">{g.points}</p>
                <p className="text-xs text-denim">pts</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Individuals tab */}
      {tab === 'individuals' && (
        <div className="space-y-3">
          {students.length === 0 ? (
            <Card><p className="text-denim text-sm">No students enrolled yet.</p></Card>
          ) : students.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-4 p-5 rounded-2xl border ${
                i === 0 ? 'bg-honeycomb/10 border-honeycomb/50' :
                i === 1 ? 'bg-powder/60 border-powder' :
                i === 2 ? 'bg-white border-powder' :
                          'bg-white border-powder/60'
              }`}
            >
              <div className="text-2xl w-8 text-center shrink-0">
                {medals[i] || <span className="text-lg font-bold text-denim">{i + 1}</span>}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-classic-navy">{s.name}</p>
                <p className="text-xs text-denim mt-0.5">{s.group} · {s.approved} task{s.approved !== 1 ? 's' : ''} approved</p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl text-atlantic-navy">{s.points}</p>
                <p className="text-xs text-denim">pts</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
