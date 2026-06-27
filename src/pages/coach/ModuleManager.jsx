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

  // Module edit fields
  const [overview, setOverview] = useState('')
  const [recordingUrl, setRecordingUrl] = useState('')
  const [moduleTitle, setModuleTitle] = useState('')

  // New resource
  const [resLabel, setResLabel] = useState('')
  const [resUrl, setResUrl] = useState('')
  const [resType, setResType] = useState('link')

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
      })
  }, [cohortId])

  function selectModule(mod) {
    setSelected(mod)
    setOverview(mod.overview || '')
    setRecordingUrl(mod.session_recording_url || '')
    setModuleTitle(mod.title || '')
    loadResources(mod.id)
    loadTasks(mod.id)
  }

  async function loadResources(moduleId) {
    const { data } = await supabase.from('resources').select('*').eq('module_id', moduleId).order('sort_order')
    setResources(data || [])
  }

  async function loadTasks(moduleId) {
    const { data } = await supabase.from('tasks').select('id, title, type, requires_coach_verification, due_date').eq('module_id', moduleId).order('sort_order')
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
    setModules(prev => prev.map(m => m.id === selected.id ? { ...m, title: moduleTitle, overview, session_recording_url: recordingUrl } : m))
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

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <p className="eyebrow">Coach</p>
          <h1 className="font-display text-3xl text-atlantic-navy mt-1">Module Manager</h1>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <select
            value={cohortId}
            onChange={e => setCohortId(e.target.value)}
            className="input-field text-sm"
          >
            {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button variant="secondary" onClick={createModule}>+ Module</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-[220px,1fr] gap-6">
        {/* Module list */}
        <div className="space-y-1">
          {modules.map(m => (
            <button
              key={m.id}
              onClick={() => selectModule(m)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                selected?.id === m.id
                  ? 'bg-atlantic-navy text-soft-butter'
                  : 'bg-whipped-cream text-denim hover:bg-powder border border-powder'
              }`}
            >
              <div className="font-medium">Wk {m.week_number}</div>
              <div className="text-xs mt-0.5 opacity-75 truncate">{m.title}</div>
            </button>
          ))}
          {modules.length === 0 && (
            <p className="text-sm text-denim px-2">No modules yet. Import tasks or create one.</p>
          )}
        </div>

        {/* Module editor */}
        {selected ? (
          <div className="space-y-6">
            <Card>
              <h2 className="font-display text-xl text-atlantic-navy mb-4">Edit module</h2>
              <div className="space-y-4">
                <div>
                  <label className="eyebrow block mb-1">Title</label>
                  <input value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="eyebrow block mb-1">Overview</label>
                  <textarea
                    value={overview}
                    onChange={e => setOverview(e.target.value)}
                    rows={5}
                    className="input-field resize-y"
                    placeholder="What students will cover this week…"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1">Session recording URL</label>
                  <input
                    value={recordingUrl}
                    onChange={e => setRecordingUrl(e.target.value)}
                    className="input-field"
                    placeholder="https://drive.google.com/…"
                  />
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

            {/* Tasks list (read-only — edited via import) */}
            <Card>
              <h2 className="font-display text-xl text-atlantic-navy mb-4">
                Tasks <span className="text-base font-sans text-denim">({tasks.length})</span>
              </h2>
              {tasks.length === 0 ? (
                <p className="text-sm text-denim">No tasks yet. Import from CSV in Cohort Setup.</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 py-2 border-b border-powder/50">
                      <Badge variant={t.type === 'team' ? 'honeycomb' : 'default'}>{t.type}</Badge>
                      <span className="flex-1 text-sm text-classic-navy">{t.title}</span>
                      {t.requires_coach_verification && (
                        <Badge variant="info">Milestone</Badge>
                      )}
                      {t.due_date && (
                        <span className="text-xs text-denim">{t.due_date}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Card className="flex items-center justify-center min-h-[200px]">
            <p className="text-denim text-sm">Select a module to edit</p>
          </Card>
        )}
      </div>
    </div>
  )
}
