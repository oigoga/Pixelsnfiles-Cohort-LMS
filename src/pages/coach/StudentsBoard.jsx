import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { StudentName } from '../../components/ui/StudentName'

const emptyWeekStat = { submitted: 0, approved: 0, rework: 0 }

export default function StudentsBoard() {
  const [loading, setLoading] = useState(true)
  const [cohorts, setCohorts] = useState([])
  const [cohortId, setCohortId] = useState('')
  const [groups, setGroups] = useState([])
  const [students, setStudents] = useState([])
  const [modules, setModules] = useState([])
  const [stats, setStats] = useState({}) // studentId -> weekNumber -> { submitted, approved, rework }

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

    const [{ data: grp }, { data: stu }, { data: mods }] = await Promise.all([
      supabase.from('peer_groups').select('id, label').eq('cohort_id', cId).order('label'),
      supabase.from('students')
        .select('id, track, peer_group_id, profiles(full_name, email)')
        .eq('cohort_id', cId)
        .neq('status', 'withdrawn')
        .order('created_at'),
      supabase.from('modules').select('id, week_number').eq('cohort_id', cId).order('sort_order'),
    ])

    const groupList = grp || []
    const studentList = stu || []
    const moduleList = mods || []
    setGroups(groupList)
    setStudents(studentList)
    setModules(moduleList)

    const moduleWeek = {}
    moduleList.forEach(m => { moduleWeek[m.id] = m.week_number })

    const modIds = moduleList.map(m => m.id)
    const stuIds = studentList.map(s => s.id)
    if (!modIds.length || !stuIds.length) { setStats({}); setLoading(false); return }

    const [{ data: tasks }, { data: subs }] = await Promise.all([
      supabase.from('tasks').select('id, module_id').in('module_id', modIds),
      supabase.from('submissions').select('student_id, task_id, status').in('student_id', stuIds),
    ])

    const taskWeek = {}
    tasks?.forEach(t => { taskWeek[t.id] = moduleWeek[t.module_id] })

    const statsData = {}
    subs?.forEach(sub => {
      const week = taskWeek[sub.task_id]
      if (week === undefined) return
      statsData[sub.student_id] ||= {}
      statsData[sub.student_id][week] ||= { ...emptyWeekStat }
      const bucket = statsData[sub.student_id][week]
      bucket.submitted++
      if (sub.status === 'peer_approved') bucket.approved++
      if (sub.status === 'needs_rework') bucket.rework++
    })

    setStats(statsData)
    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>

  const weeks = [...new Set(modules.map(m => m.week_number))].sort((a, b) => a - b)
  const grouped = groups.map(g => ({
    ...g,
    members: students.filter(s => s.peer_group_id === g.id),
  }))
  const ungrouped = students.filter(s => !s.peer_group_id)

  function StudentRow({ s }) {
    const studentStats = stats[s.id] || {}
    const total = Object.values(studentStats).reduce((acc, ws) => ({
      submitted: acc.submitted + ws.submitted,
      approved:  acc.approved + ws.approved,
      rework:    acc.rework + ws.rework,
    }), { ...emptyWeekStat })

    return (
      <tr className="border-t border-powder/50">
        <td className="px-4 py-2.5 sticky left-0 bg-white min-w-[160px]">
          <Link to={`/coach/student/${s.id}`} className="hover:underline">
            <StudentName name={s.profiles?.full_name || s.profiles?.email} track={s.track} className="text-sm" />
          </Link>
        </td>
        {weeks.map(w => {
          const ws = studentStats[w] || emptyWeekStat
          return (
            <td key={w} className="px-2 py-2 text-center text-xs whitespace-nowrap">
              <span className="text-classic-navy font-semibold">{ws.submitted}</span>
              <span className="text-denim/50 mx-0.5">/</span>
              <span className="text-green-600 font-semibold">{ws.approved}</span>
              <span className="text-denim/50 mx-0.5">/</span>
              <span className="text-red-600 font-semibold">{ws.rework}</span>
            </td>
          )
        })}
        <td className="px-2 py-2 text-center text-xs whitespace-nowrap bg-powder/30 font-bold">
          <span className="text-classic-navy">{total.submitted}</span>
          <span className="text-denim/50 mx-0.5">/</span>
          <span className="text-green-600">{total.approved}</span>
          <span className="text-denim/50 mx-0.5">/</span>
          <span className="text-red-600">{total.rework}</span>
        </td>
      </tr>
    )
  }

  function GroupTable({ members }) {
    if (members.length === 0) return <p className="text-sm text-denim">No students assigned.</p>
    if (weeks.length === 0) return <p className="text-sm text-denim">No modules set up for this cohort yet.</p>
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-powder">
              <th className="text-left px-4 py-2 text-denim font-medium sticky left-0 bg-white min-w-[160px]">Student</th>
              {weeks.map(w => (
                <th key={w} className="px-2 py-2 text-center text-denim font-medium min-w-[80px]">Wk {w}</th>
              ))}
              <th className="px-2 py-2 text-center text-denim font-medium min-w-[80px] bg-powder/30">Total</th>
            </tr>
          </thead>
          <tbody>
            {members.map(s => <StudentRow key={s.id} s={s} />)}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <p className="eyebrow">Coach</p>
          <h1 className="font-display text-3xl text-atlantic-navy mt-1">Students</h1>
        </div>
        <select
          value={cohortId}
          onChange={e => setCohortId(e.target.value)}
          className="input-field text-sm ml-auto"
        >
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <p className="text-xs text-denim">
        Each cell per week reads <span className="text-classic-navy font-semibold">submitted</span> / <span className="text-green-600 font-semibold">peer approved</span> / <span className="text-red-600 font-semibold">needs rework</span>.
      </p>

      {groups.length === 0 && ungrouped.length === 0 ? (
        <Card><p className="text-denim text-sm">No students enrolled yet.</p></Card>
      ) : (
        <div className="space-y-5">
          {grouped.map(g => (
            <Card key={g.id}>
              <h2 className="font-display text-xl text-atlantic-navy mb-3">{g.label}</h2>
              <GroupTable members={g.members} />
            </Card>
          ))}

          {ungrouped.length > 0 && (
            <Card>
              <h2 className="font-display text-xl text-atlantic-navy mb-3">Ungrouped</h2>
              <GroupTable members={ungrouped} />
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
