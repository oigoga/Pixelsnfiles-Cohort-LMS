import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'

const cellColor = {
  not_started:    'bg-powder/60 text-denim',
  submitted:      'bg-blue-100 text-blue-700',
  peer_approved:  'bg-green-100 text-green-700',
  needs_rework:   'bg-red-100 text-red-700',
  coach_verified: 'bg-honeycomb/40 text-amber-800',
}

const cellLabel = {
  not_started:    '—',
  submitted:      'Sub',
  peer_approved:  'PA',
  needs_rework:   'RW',
  coach_verified: 'CV',
}

export default function OverviewBoard() {
  const [loading, setLoading] = useState(true)
  const [cohorts, setCohorts] = useState([])
  const [cohortId, setCohortId] = useState('')
  const [students, setStudents] = useState([])
  const [modules, setModules] = useState([])
  const [grid, setGrid] = useState({}) // studentId → moduleId → best_status

  useEffect(() => {
    supabase.from('cohorts').select('id, name').order('created_at', { ascending: false })
      .then(({ data }) => {
        setCohorts(data || [])
        if (data?.length) setCohortId(data[0].id)
      })
  }, [])

  useEffect(() => { if (cohortId) loadBoard(cohortId) }, [cohortId])

  async function loadBoard(cId) {
    setLoading(true)

    const [stuRes, modRes] = await Promise.all([
      supabase.from('students')
        .select('id, profiles(full_name, email), peer_groups(label)')
        .eq('cohort_id', cId)
        .neq('status', 'withdrawn')
        .order('created_at'),
      supabase.from('modules')
        .select('id, title, week_number')
        .eq('cohort_id', cId)
        .order('sort_order'),
    ])

    const stuList = stuRes.data || []
    const modList = modRes.data || []
    setStudents(stuList)
    setModules(modList)

    // Get all tasks for these modules
    const modIds = modList.map(m => m.id)
    if (!modIds.length) { setLoading(false); return }

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, module_id')
      .in('module_id', modIds)

    // Map taskId → moduleId
    const taskModuleMap = {}
    tasks?.forEach(t => { taskModuleMap[t.id] = t.module_id })

    // Get all submissions for these students
    const stuIds = stuList.map(s => s.id)
    if (!stuIds.length) { setLoading(false); return }

    const { data: subs } = await supabase
      .from('submissions')
      .select('student_id, task_id, status')
      .in('student_id', stuIds)

    // Build grid: studentId → moduleId → best status
    const statusPriority = ['coach_verified', 'peer_approved', 'submitted', 'needs_rework', 'not_started']
    const gridData = {}

    stuList.forEach(s => {
      gridData[s.id] = {}
      modList.forEach(m => { gridData[s.id][m.id] = 'not_started' })
    })

    subs?.forEach(sub => {
      const modId = taskModuleMap[sub.task_id]
      if (!modId || !gridData[sub.student_id]) return
      const current = gridData[sub.student_id][modId] || 'not_started'
      if (statusPriority.indexOf(sub.status) < statusPriority.indexOf(current)) {
        gridData[sub.student_id][modId] = sub.status
      }
    })

    setGrid(gridData)
    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <p className="eyebrow">Coach</p>
          <h1 className="font-display text-3xl text-atlantic-navy mt-1">Overview Board</h1>
        </div>
        <select
          value={cohortId}
          onChange={e => setCohortId(e.target.value)}
          className="input-field text-sm ml-auto"
        >
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(cellLabel).map(([status, label]) => (
          <span key={status} className={`px-2 py-1 rounded-lg font-medium ${cellColor[status]}`}>
            {label} = {status.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {students.length === 0 ? (
        <p className="text-denim text-sm">No students enrolled yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-powder">
          <table className="w-full text-xs">
            <thead className="bg-whipped-cream">
              <tr>
                <th className="text-left px-4 py-3 text-denim font-medium sticky left-0 bg-whipped-cream min-w-[160px]">Student</th>
                {modules.map(m => (
                  <th key={m.id} className="px-3 py-3 text-center text-denim font-medium min-w-[72px]">
                    Wk {m.week_number}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-t border-powder hover:bg-powder/20 transition-colors">
                  <td className="px-4 py-2.5 sticky left-0 bg-soft-butter">
                    <Link to={`/coach/student/${s.id}`} className="hover:underline">
                      <p className="font-medium text-classic-navy">{s.profiles?.full_name || s.profiles?.email}</p>
                      {s.peer_groups?.label && (
                        <p className="text-denim mt-0.5">{s.peer_groups.label}</p>
                      )}
                    </Link>
                  </td>
                  {modules.map(m => {
                    const status = grid[s.id]?.[m.id] || 'not_started'
                    return (
                      <td key={m.id} className="px-2 py-2 text-center">
                        <span className={`inline-block px-2 py-1 rounded-lg font-medium ${cellColor[status]}`}>
                          {cellLabel[status]}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
