import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

const resourceTypeColors = { video: 'info', doc: 'success', link: 'default' }

export default function ModuleManager() {
  const [cohorts, setCohorts] = useState([])
  const [cohortId, setCohortId] = useState('')
  const [modules, setModules] = useState([])
  const [selected, setSelected] = useState(null)
  const [resources, setResources] = useState([])
  const [tasks, setTasks] = useState([])
  const [saving, setSaving] = useState(false)

  // Module fields
  const [overview, setOverview] = useState('')
  const [recordingUrl, setRecordingUrl] = useState('')
  const [moduleTitle, setModuleTitle] = useState('')

  // Resource form
  const [resLabel, setResLabel] = useState('')
  const [resUrl, setResUrl] = useState('')
  const [resType, setResType] = useState('link')

  // Task form — null = hidden, {} = new task, {id,...} = editing
  const [taskForm, setTaskForm] = useState(null)
  const [dodInput, setDodInput] = useState('')
  const [savingTask, setSavingTask] = useState(false)

  useEffect(() => {
    supabase.from('cohorts').select('id, name').order('created_at', { ascending: false })
      .then(({ data }) => {
        setCohorts(data || [])
        if (data?.length) setCohortId(data[0].id)
      })
  }, [])

  useEffect(() => {
    if (!cohortId) return
    supabase.from('modules').select('*').eq('cohort_id', cohortId).order('sort_order')
      .then(({ data }) => {
        setModules(data || [])
        setSelected(null)
        setTaskForm(null)
      })
  }, [cohortId])

  function selectModule(mod) {
    setSelected(mod)
    setOverview(mod.overview || '')
    setRecordingUrl(mod.session_recording_url || '')
    setModuleTitle(mod.title || '')
    setTaskForm(null)
    loadResources(mod.id)
    loadTasks(mod.id)
  }

  async function loadResources(moduleId) {
    const { data } = await supabase.from('resources').select('*').eq('module_id', moduleId).order('sort_order')
    setResources(data || [])
  }

  async function loadTasks(moduleId) {
    const { data } = await supabase.from('tasks').select('*').eq('module_id', moduleId).order('sort_order')
    setTasks(data || [])
  }

  async function saveModule() {
    setSaving(true)
    await supabase.from('modules').update({
      title: moduleTitle,
      overview,
      session_recording_url: recordingUrl || null,
    }).eq('id', selected.id)
    setSaving(false)
    setModules(prev => prev.map(m => m.id === selected.id
      ? { ...m, title: moduleTitle, overview, session_recording_url: recordingUrl }
      : m))
    setSelected(prev => ({ ...prev, title: moduleTitle, overview, session_recording_url: recordingUrl }))
  }

  async function addResource(e) {
    e.preventDefault()
    const { data } = await supabase.from('resources')
      .insert({ module_id: selected.id, label: resLabel, url: resUrl, type: resType, sort_order: resources.length + 1 })
      .select().single()
    setResources(prev => [...prev, data])
    setResLabel(''); setResUrl('')
  }

  async function deleteResource(id) {
    await supabase.from('resources').delete().eq('id', id)
    setResources(prev => prev.filter(r => r.id !== id))
  }

  async function createModule() {
    const week = modules.length + 1
    const { data } = await supabase.from('modules')
      .insert({ cohort_id: cohortId, week_number: week, title: `Module ${week}`, sort_order: week })
      .select().single()
    setModules(prev => [...prev, data])
    selectModule(data)
  }

  async function deleteModule(id) {
    if (!confirm('Delete this module? All its tasks and resources will be deleted too.')) return
    await supabase.from('modules').delete().eq('id', id)
    setModules(prev => prev.filter(m => m.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  // ── Task CRUD ─────────────────────────────────────────────

  function openNewTask() {
    setTaskForm({
      title: '', instructions: '', type: 'individual',
      requires_coach_verification: false, due_date: '', definition_of_done: [],
    })
    setDodInput('')
  }

  function openEditTask(t) {
    setTaskForm({ ...t, definition_of_done: t.definition_of_done || [] })
    setDodInput('')
  }

  function addDodItem() {
    if (!dodInput.trim()) return
    setTaskForm(prev => ({ ...prev, definition_of_done: [...prev.definition_of_done, dodInput.trim()] }))
    setDodInput('')
  }

  function removeDodItem(i) {
    setTaskForm(prev => ({ ...prev, definition_of_done: prev.definition_of_done.filter((_, idx) => idx !== i) }))
  }

  async function saveTask(e) {
    e.preventDefault()
    setSavingTask(true)
    const payload = {
      module_id: selected.id,
      title: taskForm.title.trim(),
      instructions: taskForm.instructions.trim(),
      type: taskForm.type,
      requires_coach_verification: taskForm.requires_coach_verification,
      due_date: taskForm.due_date || null,
      definition_of_done: taskForm.definition_of_done,
      sort_order: taskForm.sort_order ?? tasks.length + 1,
    }
    if (taskForm.id) {
      await supabase.from('tasks').update(payload).eq('id', taskForm.id)
    } else {
      await supabase.from('tasks').insert(payload)
    }
    setSavingTask(false)
    setTaskForm(null)
    await loadTasks(selected.id)
  }

  async function deleteTask(id) {
    if (!confirm('Delete this task? Any student submissions for it will also be removed.')) return
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <p className="eyebrow">Coach</p>
          <h1 className="font-display text-3xl text-atlantic-navy mt-1">Module Manager</h1>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <select value={cohortId} onChange={e => setCohortId(e.target.value)} className="input-field text-sm">
            {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button variant="secondary" onClick={createModule}>+ Module</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-[220px,1fr] gap-6">
        {/* Module list */}
        <div className="space-y-1">
          {modules.map(m => (
            <div key={m.id} className="relative group">
              <button
                onClick={() => selectModule(m)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  selected?.id === m.id
                    ? 'bg-atlantic-navy text-soft-butter'
                    : 'bg-whipped-cream text-denim hover:bg-powder border border-powder'
                }`}
              >
                <div className="font-medium">Wk {m.week_number}</div>
                <div className="text-xs mt-0.5 opacity-75 truncate pr-4">{m.title}</div>
              </button>
              <button
                onClick={() => deleteModule(m.id)}
                className="absolute top-2 right-2 text-xs opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
          {modules.length === 0 && (
            <p className="text-sm text-denim px-2">No modules yet.</p>
          )}
        </div>

        {/* Module editor */}
        {selected ? (
          <div className="space-y-6">
            {/* Module details */}
            <Card>
              <h2 className="font-display text-xl text-atlantic-navy mb-4">Week details</h2>
              <div className="space-y-4">
                <div>
                  <label className="eyebrow block mb-1">Title</label>
                  <input value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="eyebrow block mb-1">Overview</label>
                  <textarea value={overview} onChange={e => setOverview(e.target.value)} rows={5} className="input-field resize-y" placeholder="What students will cover this week…" />
                </div>
                <div>
                  <label className="eyebrow block mb-1">Session recording URL</label>
                  <input value={recordingUrl} onChange={e => setRecordingUrl(e.target.value)} className="input-field" placeholder="https://drive.google.com/…" />
                </div>
                <Button onClick={saveModule} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
              </div>
            </Card>

            {/* Resources */}
            <Card>
              <h2 className="font-display text-xl text-atlantic-navy mb-4">Resources</h2>
              <div className="space-y-2 mb-4">
                {resources.map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b border-powder/50">
                    <Badge variant={resourceTypeColors[r.type]}>{r.type}</Badge>
                    <a href={r.url} target="_blank" rel="noreferrer" className="flex-1 text-sm text-atlantic-navy hover:underline truncate">{r.label}</a>
                    <button onClick={() => deleteResource(r.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                ))}
                {resources.length === 0 && <p className="text-sm text-denim">No resources yet.</p>}
              </div>
              <form onSubmit={addResource} className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-32">
                  <label className="eyebrow block mb-1">Label</label>
                  <input required value={resLabel} onChange={e => setResLabel(e.target.value)} placeholder="Week 1 slides" className="input-field text-sm" />
                </div>
                <div className="flex-1 min-w-48">
                  <label className="eyebrow block mb-1">URL</label>
                  <input required type="url" value={resUrl} onChange={e => setResUrl(e.target.value)} placeholder="https://…" className="input-field text-sm" />
                </div>
                <div>
                  <label className="eyebrow block mb-1">Type</label>
                  <select value={resType} onChange={e => setResType(e.target.value)} className="input-field text-sm">
                    <option value="link">Link</option>
                    <option value="video">Video</option>
                    <option value="doc">Doc</option>
                  </select>
                </div>
                <Button type="submit" variant="secondary">Add</Button>
              </form>
            </Card>

            {/* Tasks */}
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl text-atlantic-navy">
                  Tasks <span className="text-base font-sans text-denim">({tasks.length})</span>
                </h2>
                {!taskForm && (
                  <Button variant="secondary" onClick={openNewTask}>+ Add task</Button>
                )}
              </div>

              {/* Task form */}
              {taskForm && (
                <form onSubmit={saveTask} className="mb-6 p-5 bg-powder/30 rounded-xl border border-powder space-y-4">
                  <p className="font-semibold text-classic-navy text-sm">{taskForm.id ? 'Edit task' : 'New task'}</p>

                  <div>
                    <label className="eyebrow block mb-1">Title</label>
                    <input required value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} className="input-field" placeholder="AO-1 The Inbox Triage System" />
                  </div>

                  <div>
                    <label className="eyebrow block mb-1">Instructions</label>
                    <textarea rows={5} value={taskForm.instructions} onChange={e => setTaskForm(p => ({ ...p, instructions: e.target.value }))} className="input-field resize-y" placeholder="What students need to do, step by step…" />
                  </div>

                  <div className="flex gap-4 flex-wrap items-end">
                    <div>
                      <label className="eyebrow block mb-1">Type</label>
                      <select value={taskForm.type} onChange={e => setTaskForm(p => ({ ...p, type: e.target.value }))} className="input-field">
                        <option value="individual">Individual</option>
                        <option value="team">Team</option>
                      </select>
                    </div>
                    <div>
                      <label className="eyebrow block mb-1">Due date</label>
                      <input type="date" value={taskForm.due_date || ''} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} className="input-field" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mb-1">
                      <input type="checkbox" checked={taskForm.requires_coach_verification} onChange={e => setTaskForm(p => ({ ...p, requires_coach_verification: e.target.checked }))} className="rounded" />
                      <span className="eyebrow">Needs coach sign-off</span>
                    </label>
                  </div>

                  <div>
                    <label className="eyebrow block mb-2">Definition of done</label>
                    <div className="space-y-1.5 mb-3">
                      {taskForm.definition_of_done.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-1.5 border border-powder">
                          <span className="text-honeycomb font-bold shrink-0">✓</span>
                          <span className="flex-1 text-classic-navy">{item}</span>
                          <button type="button" onClick={() => removeDodItem(i)} className="text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
                        </div>
                      ))}
                      {taskForm.definition_of_done.length === 0 && (
                        <p className="text-xs text-denim">No criteria yet. Add what "done" looks like.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={dodInput}
                        onChange={e => setDodInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDodItem() } }}
                        placeholder="e.g. Inbox has fewer than 5 items by end of day"
                        className="input-field flex-1 text-sm"
                      />
                      <Button type="button" variant="secondary" onClick={addDodItem}>Add</Button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={savingTask}>{savingTask ? 'Saving…' : 'Save task'}</Button>
                    <Button type="button" variant="secondary" onClick={() => setTaskForm(null)}>Cancel</Button>
                  </div>
                </form>
              )}

              {/* Task list */}
              {tasks.length === 0 && !taskForm ? (
                <p className="text-sm text-denim">No tasks yet. Add one above or import from CSV in Cohort Setup.</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-powder/50">
                      <Badge variant={t.type === 'team' ? 'honeycomb' : 'default'}>{t.type}</Badge>
                      <span className="flex-1 text-sm text-classic-navy font-medium">{t.title}</span>
                      {t.requires_coach_verification && <Badge variant="info">Milestone</Badge>}
                      {t.due_date && <span className="text-xs text-denim">{t.due_date}</span>}
                      <button onClick={() => openEditTask(t)} className="text-xs text-denim hover:text-atlantic-navy font-medium">Edit</button>
                      <button onClick={() => deleteTask(t.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Card className="flex items-center justify-center min-h-[200px]">
            <p className="text-denim text-sm">← Select a module to edit</p>
          </Card>
        )}
      </div>
    </div>
  )
}
