import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/Spinner'

const resourceIcons = { video: '🎥', doc: '📄', link: '🔗' }

export default function ModuleView() {
  const { moduleId } = useParams()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [mod, setMod] = useState(null)
  const [resources, setResources] = useState([])
  const [tasks, setTasks] = useState([])
  const [submissions, setSubmissions] = useState({})

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
        <h1 className="font-display text-4xl text-atlantic-navy mt-1">{mod.title}</h1>
      </div>

      <div className="grid md:grid-cols-[1fr,280px] gap-6">
        <div className="space-y-6">
          {/* Overview */}
          {mod.overview && (
            <Card>
              <h2 className="font-display text-2xl text-atlantic-navy mb-3">Overview</h2>
              <p className="text-denim text-sm leading-relaxed whitespace-pre-line">{mod.overview}</p>
            </Card>
          )}

          {/* Tasks */}
          <div>
            <h2 className="font-display text-2xl text-atlantic-navy mb-3">Tasks</h2>
            <div className="space-y-3">
              {tasks.map(task => {
                const sub = submissions[task.id]
                return (
                  <Link
                    key={task.id}
                    to={`/student/task/${task.id}`}
                    className="block bg-whipped-cream border border-powder rounded-2xl p-4 hover:border-denim transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-1">
                          <Badge variant={task.type === 'team' ? 'honeycomb' : 'default'}>{task.type}</Badge>
                          {task.requires_coach_verification && <Badge variant="info">Milestone</Badge>}
                        </div>
                        <p className="font-medium text-classic-navy text-sm">{task.title}</p>
                        {task.due_date && (
                          <p className="text-xs text-denim mt-1">Due {task.due_date}</p>
                        )}
                      </div>
                      <StatusBadge status={sub?.status || 'not_started'} />
                    </div>
                  </Link>
                )
              })}
              {tasks.length === 0 && <p className="text-denim text-sm">No tasks for this module yet.</p>}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recording */}
          {mod.session_recording_url && (
            <Card>
              <p className="eyebrow mb-2">Session recording</p>
              <a
                href={mod.session_recording_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-atlantic-navy hover:underline font-medium"
              >
                🎥 Watch recording →
              </a>
            </Card>
          )}

          {/* Resources */}
          {resources.length > 0 && (
            <Card>
              <p className="eyebrow mb-3">Resources</p>
              <ul className="space-y-2">
                {resources.map(r => (
                  <li key={r.id}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-2 text-sm text-atlantic-navy hover:underline"
                    >
                      <span>{resourceIcons[r.type] || '🔗'}</span>
                      <span>{r.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
