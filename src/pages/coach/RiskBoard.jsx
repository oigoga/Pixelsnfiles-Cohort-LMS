import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'

// Risk logic:
// "on track"    — has a submission in the current week or ahead
// "slipping"    — last submission is 1 week behind current week
// "gone quiet"  — no submissions in 2+ weeks, or never submitted

function getRisk(student, currentWeek, submissionsByStudent, tasksByModule) {
  const subs = submissionsByStudent[student.id] || []
  if (subs.length === 0) return 'gone_quiet'

  // Find the highest module week they've submitted for
  const maxWeek = Math.max(...subs.map(s => tasksByModule[s.task_id] || 0))

  if (maxWeek >= currentWeek) return 'on_track'
  if (maxWeek >= currentWeek - 1) return 'slipping'
  return 'gone_quiet'
}

const riskConfig = {
  on_track:   { label: 'On track',   variant: 'success',  description: 'Submitted work in current or upcoming weeks.' },
  slipping:   { label: 'Slipping',   variant: 'warning',  description: 'Last submission is 1 week behind.' },
  gone_quiet: { label: 'Gone quiet', variant: 'danger',   description: 'No recent activity — 2+ weeks behind or never submitted.' },
}

export default function RiskBoard() {
  const [loading, setLoading] = useState(true)
  const [cohorts, setCohorts] = useState([])
  const [cohortId, setCohortId] = useState('')
  const [cohort, setCohort] = useState(null)
  const [buckets, setBuckets] = useState({ on_track: [], slipping: [], gone_quiet: [] })

  useEffect(() => {
    supabase.from('cohorts').select('id, name, current_week').order('created_at', { ascending: false })
      .then(({ data }) => {
        setCohorts(data || [])
        if (data?.length) { setCohortId(data[0].id); setCohort(data[0]) }
      })
  }, [])

  useEffect(() => { if (cohortId) loadRisk(cohortId) }, [cohortId])

  async function loadRisk(cId) {
    setLoading(true)
    const currentCohort = cohorts.find(c => c.id === cId) || cohort
    const currentWeek = currentCohort?.current_week || 0

    const [stuRes, modRes] = await Promise.all([
      supabase.from('students')
        .select('id, profiles(full_name, email), peer_groups(label)')
        .eq('cohort_id', cId)
        .neq('status', 'withdrawn'),
      supabase.from('modules').select('id, week_number').eq('cohort_id', cId),
    ])

    const students = stuRes.data || []
    const mods = modRes.data || []

    // Map task_id → week_number
    const modIds = mods.map(m => m.id)
    const weekByMod = {}
    mods.forEach(m => { weekByMod[m.id] = m.week_number })

    let tasksByModule = {}
    if (modIds.length) {
      const { data: tasks } = await supabase
        .from('tasks').select('id, module_id').in('module_id', modIds)
      tasks?.forEach(t => { tasksByModule[t.id] = weekByMod[t.module_id] || 0 })
    }

    // Submissions per student
    const stuIds = students.map(s => s.id)
    let submissionsByStudent = {}
    if (stuIds.length) {
      const { data: subs } = await supabase
        .from('submissions').select('student_id, task_id').in('student_id', stuIds)
      subs?.forEach(s => {
        if (!submissionsByStudent[s.student_id]) submissionsByStudent[s.student_id] = []
        submissionsByStudent[s.student_id].push(s)
      })
    }

    const result = { on_track: [], slipping: [], gone_quiet: [] }
    students.forEach(s => {
      const risk = getRisk(s, currentWeek, submissionsByStudent, tasksByModule)
      result[risk].push(s)
    })

    setBuckets(result)
    setLoading(false)
  }

  function handleCohortChange(id) {
    setCohortId(id)
    const c = cohorts.find(c => c.id === id)
    setCohort(c)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <p className="eyebrow">Coach</p>
          <h1 className="font-display text-3xl text-atlantic-navy mt-1">Risk Board</h1>
        </div>
        <select
          value={cohortId}
          onChange={e => handleCohortChange(e.target.value)}
          className="input-field text-sm ml-auto"
        >
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(riskConfig).map(([key, config]) => (
          <Card key={key}>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={config.variant}>{config.label}</Badge>
              <span className="text-sm font-medium text-classic-navy">{buckets[key].length}</span>
            </div>
            <p className="text-xs text-denim mb-4">{config.description}</p>
            {buckets[key].length === 0 ? (
              <p className="text-xs text-denim italic">None</p>
            ) : (
              <ul className="space-y-2">
                {buckets[key].map(s => (
                  <li key={s.id}>
                    <Link
                      to={`/coach/student/${s.id}`}
                      className="flex items-center gap-2 hover:text-atlantic-navy transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-atlantic-navy/10 flex items-center justify-center text-xs font-medium text-atlantic-navy">
                        {(s.profiles?.full_name || s.profiles?.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-classic-navy leading-tight">
                          {s.profiles?.full_name || s.profiles?.email}
                        </p>
                        {s.peer_groups?.label && (
                          <p className="text-xs text-denim">{s.peer_groups.label}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
