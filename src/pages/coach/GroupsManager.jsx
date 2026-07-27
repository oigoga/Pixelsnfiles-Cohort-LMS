import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function GroupsManager() {
  const [cohorts, setCohorts]   = useState([])
  const [cohortId, setCohortId] = useState('')
  const [groups, setGroups]     = useState([])
  const [selected, setSelected] = useState(null)
  const [members, setMembers]   = useState([])
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [projectForm, setProjectForm] = useState({
    project_title: '', project_brief: '', project_resource_url: '',
  })

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

  async function selectGroup(g) {
    setSelected(g)
    setSaved(false)
    setProjectForm({
      project_title:        g.project_title        || '',
      project_brief:        g.project_brief        || '',
      project_resource_url: g.project_resource_url || '',
    })
    const { data } = await supabase
      .from('students')
      .select('id, profiles(full_name, email)')
      .eq('peer_group_id', g.id)
    setMembers(data || [])
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

      {groups.length === 0 ? (
        <Card>
          <p className="text-denim text-sm">No groups yet — assign them in Cohort Setup.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {groups.map(g => {
            const isSelected = selected?.id === g.id
            const hasProject = !!g.project_title
            return (
              <button
                key={g.id}
                onClick={() => selectGroup(g)}
                className={`aspect-square rounded-2xl border-2 p-5 flex flex-col justify-between text-left transition-all ${
                  isSelected
                    ? 'bg-atlantic-navy border-atlantic-navy text-soft-butter shadow-lg scale-[1.02]'
                    : 'bg-whipped-cream border-powder hover:border-denim hover:shadow-sm'
                }`}
              >
                <div>
                  <p className={`font-display text-2xl font-bold ${isSelected ? 'text-soft-butter' : 'text-atlantic-navy'}`}>
                    {g.label}
                  </p>
                </div>
                <div>
                  {hasProject ? (
                    <p className={`text-xs font-medium truncate ${isSelected ? 'text-powder' : 'text-honeycomb'}`}>
                      {g.project_title}
                    </p>
                  ) : (
                    <p className={`text-xs ${isSelected ? 'text-powder/60' : 'text-denim/50'}`}>
                      No project yet
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail panel — appears below cards when a group is selected */}
      {selected && (
        <div className="grid md:grid-cols-[1fr,1.5fr] gap-6 pt-2">
          {/* Members */}
          <Card>
            <p className="eyebrow mb-3">Members — {selected.label}</p>
            {members.length === 0 ? (
              <p className="text-sm text-denim">No members assigned yet.</p>
            ) : (
              <ul className="space-y-3">
                {members.map(m => (
                  <li key={m.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-atlantic-navy/10 flex items-center justify-center text-atlantic-navy font-bold text-sm shrink-0">
                      {(m.profiles?.full_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-classic-navy truncate">{m.profiles?.full_name || '—'}</p>
                      <p className="text-xs text-denim truncate">{m.profiles?.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Project form */}
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
                  rows={6}
                  value={projectForm.project_brief}
                  onChange={e => setProjectForm(p => ({ ...p, project_brief: e.target.value }))}
                  className="input-field resize-y"
                  placeholder="Client context, deliverables, any constraints…"
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
                <p className="text-xs text-denim mt-1">Drive folder, Notion doc, brief PDF.</p>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save project'}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
