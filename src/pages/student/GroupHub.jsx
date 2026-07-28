import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/Spinner'

export default function GroupHub() {
  const { profile } = useAuth()
  const [loading, setLoading]         = useState(true)
  const [student, setStudent]         = useState(null)
  const [group, setGroup]             = useState(null)
  const [members, setMembers]         = useState([])
  const [teamTasks, setTeamTasks]     = useState([])
  const [teamSubs, setTeamSubs]       = useState({})
  const [messages, setMessages]       = useState([])
  const [chatError, setChatError]     = useState('')
  const [newMsg, setNewMsg]           = useState('')
  const [sending, setSending]         = useState(false)
  const messagesEndRef = useRef(null)
  const pollRef        = useRef(null)

  useEffect(() => { if (profile) load() }, [profile])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function load() {
    const { data: stu } = await supabase
      .from('students')
      .select('id, peer_group_id, cohort_id')
      .eq('profile_id', profile.id)
      .single()
    setStudent(stu)

    if (!stu?.peer_group_id) { setLoading(false); return }

    const { data: grp } = await supabase
      .from('peer_groups')
      .select('*')
      .eq('id', stu.peer_group_id)
      .single()
    setGroup(grp)

    const { data: mem } = await supabase
      .from('students')
      .select('id, profiles(full_name, email)')
      .eq('peer_group_id', stu.peer_group_id)
    setMembers(mem || [])

    // Team tasks
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

      const { data: subs } = await supabase
        .from('submissions')
        .select('task_id, status, drive_link, submitted_at')
        .eq('peer_group_id', stu.peer_group_id)
      const subMap = {}
      subs?.forEach(s => { subMap[s.task_id] = s })
      setTeamSubs(subMap)
    }

    // Load messages + start polling
    await loadMessages(stu.peer_group_id)
    pollRef.current = setInterval(() => loadMessages(stu.peer_group_id), 5000)

    setLoading(false)
  }

  useEffect(() => () => clearInterval(pollRef.current), [])

  async function loadMessages(groupId) {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*, profiles:author_id(full_name, role)')
      .eq('peer_group_id', groupId)
      .order('created_at')
    if (error) {
      setChatError(error.message)
    } else {
      setChatError('')
      setMessages(data || [])
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMsg.trim()) return
    setSending(true)
    setChatError('')
    const { error } = await supabase.from('group_messages').insert({
      peer_group_id: student.peer_group_id,
      author_id:     profile.id,
      body:          newMsg.trim(),
    })
    if (error) {
      setChatError(error.message)
      setSending(false)
      return
    }
    setNewMsg('')
    setSending(false)
    await loadMessages(student.peer_group_id)
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

      {/* Group project card */}
      {group?.project_title && (
        <div className="bg-atlantic-navy rounded-2xl p-6 text-soft-butter">
          <p className="eyebrow text-powder/60 mb-1">Your group project</p>
          <h2 className="font-display text-2xl mb-3">{group.project_title}</h2>
          {group.project_brief && (
            <p className="text-powder text-sm leading-relaxed whitespace-pre-line mb-4">{group.project_brief}</p>
          )}
          {group.project_resource_url && (
            <a
              href={group.project_resource_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-honeycomb text-classic-navy text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
            >
              📂 Open brief / resources →
            </a>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-[240px,1fr] gap-6">
        {/* Members sidebar */}
        <div className="space-y-4">
          <Card>
            <p className="eyebrow mb-3">Members</p>
            <ul className="space-y-3">
              {members.map(m => (
                <li key={m.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-atlantic-navy/10 flex items-center justify-center text-atlantic-navy font-bold text-sm shrink-0">
                    {(m.profiles?.full_name || m.profiles?.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-classic-navy truncate">{m.profiles?.full_name || '—'}</p>
                    <p className="text-xs text-denim truncate">{m.profiles?.email}</p>
                  </div>
                  {m.id === student.id && (
                    <Badge variant="info" className="ml-auto shrink-0">You</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Team tasks */}
          {teamTasks.length > 0 && (
            <div>
              <h2 className="font-display text-2xl text-atlantic-navy mb-3">Team tasks</h2>
              <div className="space-y-3">
                {teamTasks.map(task => {
                  const sub = teamSubs[task.id]
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
                              <a href={sub.drive_link} target="_blank" rel="noreferrer"
                                className="text-xs text-atlantic-navy underline underline-offset-2">
                                📂 View deliverable
                              </a>
                            </div>
                          )}
                        </div>
                        <StatusBadge status={sub?.status || 'not_started'} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Group chat */}
          <div>
            <h2 className="font-display text-2xl text-atlantic-navy mb-3">Group Chat</h2>
            {chatError && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <strong>Chat error:</strong> {chatError}
              </div>
            )}
            <Card>
              <div className="h-72 overflow-y-auto space-y-3 mb-4 pr-1">
                {messages.length === 0 && (
                  <p className="text-sm text-denim text-center py-10">
                    No messages yet. Say hello to your group 👋
                  </p>
                )}
                {messages.map(msg => {
                  const isMe    = msg.author_id === profile.id
                  const isCoach = msg.profiles?.role === 'coach'
                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isCoach ? 'bg-honeycomb text-classic-navy' : 'bg-atlantic-navy/10 text-atlantic-navy'
                      }`}>
                        {(msg.profiles?.full_name || '?')[0].toUpperCase()}
                      </div>
                      <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <p className={`text-xs text-denim mb-1 ${isMe ? 'text-right' : ''}`}>
                          {isCoach ? '⭐ Coach' : isMe ? 'You' : msg.profiles?.full_name}
                          {' · '}
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-atlantic-navy text-soft-butter rounded-tr-sm'
                            : isCoach
                              ? 'bg-honeycomb/20 text-classic-navy border border-honeycomb/40 rounded-tl-sm'
                              : 'bg-powder/60 text-classic-navy rounded-tl-sm'
                        }`}>
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="flex gap-3">
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder="Message your group…"
                  className="input-field flex-1 text-sm"
                  maxLength={2000}
                />
                <Button type="submit" disabled={sending || !newMsg.trim()}>
                  {sending ? '…' : 'Send'}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
