import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function GroupsManager() {
  const { profile } = useAuth()
  const [cohorts, setCohorts]     = useState([])
  const [cohortId, setCohortId]   = useState('')
  const [groups, setGroups]       = useState([])
  const [selected, setSelected]   = useState(null)
  const [members, setMembers]     = useState([])
  const [messages, setMessages]   = useState([])
  const [newMsg, setNewMsg]       = useState('')
  const [sending, setSending]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [projectForm, setProjectForm] = useState({
    project_title: '', project_brief: '', project_resource_url: '',
  })
  const messagesEndRef = useRef(null)
  const pollRef        = useRef(null)

  useEffect(() => {
    supabase.from('cohorts').select('id, name').order('created_at', { ascending: false })
      .then(({ data }) => {
        setCohorts(data || [])
        if (data?.length) setCohortId(data[0].id)
      })
  }, [])

  useEffect(() => {
    if (!cohortId) return
    supabase.from('peer_groups').select('*').eq('cohort_id', cohortId).order('label')
      .then(({ data }) => { setGroups(data || []); setSelected(null) })
  }, [cohortId])

  useEffect(() => {
    if (!selected) return
    loadMembers(selected.id)
    loadMessages(selected.id)
    setProjectForm({
      project_title:        selected.project_title        || '',
      project_brief:        selected.project_brief        || '',
      project_resource_url: selected.project_resource_url || '',
    })
    clearInterval(pollRef.current)
    pollRef.current = setInterval(() => loadMessages(selected.id), 5000)
    return () => clearInterval(pollRef.current)
  }, [selected?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMembers(groupId) {
    const { data } = await supabase
      .from('students')
      .select('id, profiles(full_name, email)')
      .eq('peer_group_id', groupId)
    setMembers(data || [])
  }

  async function loadMessages(groupId) {
    const { data } = await supabase
      .from('group_messages')
      .select('*, profiles(full_name, role)')
      .eq('peer_group_id', groupId)
      .order('created_at')
    setMessages(data || [])
  }

  async function saveProject(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('peer_groups').update({
      project_title:        projectForm.project_title        || null,
      project_brief:        projectForm.project_brief        || null,
      project_resource_url: projectForm.project_resource_url || null,
    }).eq('id', selected.id)
    setGroups(prev => prev.map(g => g.id === selected.id ? { ...g, ...projectForm } : g))
    setSelected(prev => ({ ...prev, ...projectForm }))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMsg.trim()) return
    setSending(true)
    await supabase.from('group_messages').insert({
      peer_group_id: selected.id,
      author_id:     profile.id,
      body:          newMsg.trim(),
    })
    setNewMsg('')
    setSending(false)
    await loadMessages(selected.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <p className="eyebrow">Coach</p>
          <h1 className="font-display text-3xl text-atlantic-navy mt-1">Groups</h1>
        </div>
        <select
          value={cohortId}
          onChange={e => setCohortId(e.target.value)}
          className="input-field text-sm ml-auto"
        >
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-[200px,1fr] gap-6">
        {/* Groups sidebar */}
        <div className="space-y-1">
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelected(g)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                selected?.id === g.id
                  ? 'bg-atlantic-navy text-soft-butter'
                  : 'bg-whipped-cream text-denim hover:bg-powder border border-powder'
              }`}
            >
              <div className="font-medium">{g.label}</div>
              {g.project_title
                ? <div className="text-xs mt-0.5 opacity-70 truncate">{g.project_title}</div>
                : <div className="text-xs mt-0.5 opacity-50">No project assigned</div>
              }
            </button>
          ))}
          {groups.length === 0 && (
            <p className="text-sm text-denim px-2">No groups yet — assign them in Cohort Setup.</p>
          )}
        </div>

        {selected ? (
          <div className="space-y-6">
            {/* Members */}
            <Card>
              <p className="eyebrow mb-3">Members — {selected.label}</p>
              <div className="flex flex-wrap gap-3">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-2 bg-powder/40 rounded-xl px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-atlantic-navy/10 flex items-center justify-center text-atlantic-navy font-bold text-xs">
                      {(m.profiles?.full_name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-classic-navy">{m.profiles?.full_name || '—'}</p>
                      <p className="text-xs text-denim">{m.profiles?.email}</p>
                    </div>
                  </div>
                ))}
                {members.length === 0 && <p className="text-sm text-denim">No members assigned yet.</p>}
              </div>
            </Card>

            {/* Project assignment */}
            <Card>
              <h2 className="font-display text-xl text-atlantic-navy mb-4">Group Project</h2>
              <form onSubmit={saveProject} className="space-y-4">
                <div>
                  <label className="eyebrow block mb-1">Project title</label>
                  <input
                    value={projectForm.project_title}
                    onChange={e => setProjectForm(p => ({ ...p, project_title: e.target.value }))}
                    className="input-field"
                    placeholder="e.g. Kova Brand Refresh"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1">Brief</label>
                  <textarea
                    rows={7}
                    value={projectForm.project_brief}
                    onChange={e => setProjectForm(p => ({ ...p, project_brief: e.target.value }))}
                    className="input-field resize-y"
                    placeholder="Client context, what they need to build, deliverables, any constraints…"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1">Resource link</label>
                  <input
                    type="url"
                    value={projectForm.project_resource_url}
                    onChange={e => setProjectForm(p => ({ ...p, project_resource_url: e.target.value }))}
                    className="input-field"
                    placeholder="https://drive.google.com/…"
                  />
                  <p className="text-xs text-denim mt-1">Drive folder, Notion doc, brief PDF — whatever they need to get started.</p>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save project'}
                </Button>
              </form>
            </Card>

            {/* Group chat */}
            <Card>
              <h2 className="font-display text-xl text-atlantic-navy mb-4">
                Group Chat
                <span className="text-sm font-sans font-normal text-denim ml-2">refreshes every 5s</span>
              </h2>

              <div className="h-80 overflow-y-auto space-y-3 mb-4 pr-1">
                {messages.length === 0 && (
                  <p className="text-sm text-denim text-center py-10">No messages yet.</p>
                )}
                {messages.map(msg => {
                  const isCoach = msg.profiles?.role === 'coach'
                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isCoach ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isCoach ? 'bg-honeycomb text-classic-navy' : 'bg-atlantic-navy/10 text-atlantic-navy'
                      }`}>
                        {(msg.profiles?.full_name || '?')[0].toUpperCase()}
                      </div>
                      <div className={`max-w-[75%] flex flex-col ${isCoach ? 'items-end' : 'items-start'}`}>
                        <p className={`text-xs text-denim mb-1 ${isCoach ? 'text-right' : ''}`}>
                          {isCoach ? '⭐ Coach' : msg.profiles?.full_name}
                          {' · '}
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          isCoach
                            ? 'bg-atlantic-navy text-soft-butter rounded-tr-sm'
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
                  placeholder={`Message ${selected.label}…`}
                  className="input-field flex-1 text-sm"
                  maxLength={2000}
                />
                <Button type="submit" disabled={sending || !newMsg.trim()}>
                  {sending ? '…' : 'Send'}
                </Button>
              </form>
            </Card>
          </div>
        ) : (
          <Card className="flex items-center justify-center min-h-[200px]">
            <p className="text-denim text-sm">← Select a group to manage</p>
          </Card>
        )}
      </div>
    </div>
  )
}
