import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/Spinner'

export default function GroupHub() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState(null)
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [teamTasks, setTeamTasks] = useState([])
  const [teamSubmissions, setTeamSubmissions] = useState({})

  useEffect(() => { if (profile) load() }, [profile])

  async function load() {
    const { data: stu } = await supabase
      .from('students')
      .select('id, peer_group_id, cohort_id')
      .eq('profile_id', profile.id)
      .single()
    setStudent(stu)

    if (!stu?.peer_group_id) { setLoading(false); return }

    // Group info
    const { data: grp } = await supabase
      .from('peer_groups')
      .select('*')
      .eq('id', stu.peer_group_id)
      .single()
    setGroup(grp)

    // Members
    const { data: mem } = await supabase
      .from('students')
      .select('id, profiles(full_name, email)')
      .eq('peer_group_id', stu.peer_group_id)
    setMembers(mem || [])

    // Team tasks for this cohort
    const { data: mods } = await supabase
      .from('modules')
      .select('id')
      .eq('cohort_id', stu.cohort_id)

    const modIds = mods?.map(m => m.id) || []
    if (modIds.length) {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*, modules(title, week_number)')
        .in('module_id', modIds)
        .eq('type', 'team')
        .order('sort_order')
      setTeamTasks(tasks || [])

      // Team submissions
      const { data: subs } = await supabase
        .from('submissions')
        .select('task_id, status, drive_link, submitted_at')
        .eq('peer_group_id', stu.peer_group_id)
      const subMap = {}
      subs?.forEach(s => { subMap[s.task_id] = s })
      setTeamSubmissions(subMap)
    }

    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>

  if (!student?.peer_group_id) {
    return (
      <Card>
        <p className="eyebrow mb-2">Group Hub</p>
        <p className="text-denim text-sm">Groups haven't been assigned yet. Check back after registration closes.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Collaboration</p>
        <h1 className="font-display text-3xl text-atlantic-navy mt-1">{group?.label || 'Your Group'}</h1>
      </div>

      <div className="grid md:grid-cols-[240px,1fr] gap-6">
        {/* Members sidebar */}
        <Card>
          <p className="eyebrow mb-3">Members</p>
          <ul className="space-y-3">
            {members.map(m => (
              <li key={m.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-atlantic-navy/10 flex items-center justify-center text-atlantic-navy font-medium text-sm">
                  {(m.profiles?.full_name || m.profiles?.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-classic-navy">{m.profiles?.full_name || '—'}</p>
                  <p className="text-xs text-denim">{m.profiles?.email}</p>
                </div>
                {m.id === student.id && (
                  <Badge variant="info" className="ml-auto">You</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>

        {/* Team tasks */}
        <div className="space-y-4">
          <h2 className="font-display text-2xl text-atlantic-navy">Team tasks</h2>
          {teamTasks.length === 0 ? (
            <Card>
              <p className="text-sm text-denim">No team tasks yet.</p>
            </Card>
          ) : (
            teamTasks.map(task => {
              const sub = teamSubmissions[task.id]
              return (
                <Link
                  key={task.id}
                  to={`/student/task/${task.id}`}
                  className="block bg-whipped-cream border border-powder rounded-2xl p-5 hover:border-denim transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-denim mb-1">Wk {task.modules?.week_number} · {task.modules?.title}</p>
                      <p className="font-semibold text-classic-navy text-sm">{task.title}</p>
                      {task.requires_coach_verification && (
                        <Badge variant="info" className="mt-2">Milestone</Badge>
                      )}
                      {sub?.drive_link && (
                        <div className="mt-2" onClick={e => e.preventDefault()}>
                          <a
                            href={sub.drive_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-atlantic-navy underline underline-offset-2"
                          >
                            📂 View deliverable
                          </a>
                        </div>
                      )}
                    </div>
                    <StatusBadge status={sub?.status || 'not_started'} />
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
