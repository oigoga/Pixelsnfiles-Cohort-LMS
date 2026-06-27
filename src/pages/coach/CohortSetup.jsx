import { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { assignGroups } from '../../utils/groupAssignment'

export default function CohortSetup() {
  const [cohorts, setCohorts] = useState([])
  const [activeCohort, setActiveCohort] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('cohort') // cohort | students | import
  const fileRef = useRef()

  // New cohort form
  const [cohortName, setCohortName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [saving, setSaving] = useState(false)

  // Enrol form
  const [enrolEmail, setEnrolEmail] = useState('')
  const [enrolName, setEnrolName] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  // Import
  const [importRows, setImportRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  useEffect(() => { loadCohorts() }, [])
  useEffect(() => { if (activeCohort) loadStudents(activeCohort.id) }, [activeCohort])

  async function loadCohorts() {
    const { data } = await supabase.from('cohorts').select('*').order('created_at', { ascending: false })
    setCohorts(data || [])
    if (data?.length) setActiveCohort(data[0])
    setLoading(false)
  }

  async function loadStudents(cohortId) {
    const { data } = await supabase
      .from('students')
      .select('*, profiles(full_name, email), peer_groups(label)')
      .eq('cohort_id', cohortId)
      .order('created_at')
    setStudents(data || [])
  }

  async function createCohort(e) {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await supabase
      .from('cohorts')
      .insert({ name: cohortName, start_date: startDate || null })
      .select()
      .single()
    setSaving(false)
    if (!error) {
      setCohorts(prev => [data, ...prev])
      setActiveCohort(data)
      setCohortName('')
      setStartDate('')
    }
  }

  async function updateCurrentWeek(week) {
    await supabase.from('cohorts').update({ current_week: week }).eq('id', activeCohort.id)
    setActiveCohort(prev => ({ ...prev, current_week: week }))
    setCohorts(prev => prev.map(c => c.id === activeCohort.id ? { ...c, current_week: week } : c))
  }

  async function enrolStudent(e) {
    e.preventDefault()
    setEnrolling(true)

    // 1. Send magic link / ensure user exists via admin invite (Supabase admin API not available client-side)
    // We create the profile row directly; the student will sign in via magic link themselves
    // First check if profile already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', enrolEmail)
      .single()

    let profileId = existing?.id

    if (!profileId) {
      // Create auth user via magic link — they'll get the link on first login
      const { data: authData, error: authError } = await supabase.auth.admin?.inviteUserByEmail
        ? await supabase.auth.admin.inviteUserByEmail(enrolEmail, { data: { full_name: enrolName } })
        : { data: null, error: { message: 'Use Supabase dashboard to invite users or they can sign up via the login page.' } }

      if (authError) {
        alert(`Note: ${authError.message}\n\nThe student can sign in via the magic link on the login page once they visit it.`)
        // Still create a placeholder — they'll get matched when they first log in
        setEnrolling(false)
        return
      }
      profileId = authData?.user?.id
    }

    if (profileId) {
      // Ensure student row
      await supabase.from('students').upsert({
        profile_id: profileId,
        cohort_id: activeCohort.id,
        status: 'enrolled',
      }, { onConflict: 'profile_id,cohort_id' })

      await loadStudents(activeCohort.id)
    }

    setEnrolName('')
    setEnrolEmail('')
    setEnrolling(false)
  }

  async function closeRegistrationAndAssign() {
    if (!confirm('Close registration and auto-assign peer groups? This cannot be undone.')) return

    const enrolled = students.filter(s => s.status === 'enrolled')
    if (enrolled.length < 3) {
      alert('Need at least 3 enrolled students to assign groups.')
      return
    }

    const groups = assignGroups(enrolled)

    for (let i = 0; i < groups.length; i++) {
      // Create peer group
      const { data: pg } = await supabase
        .from('peer_groups')
        .insert({ cohort_id: activeCohort.id, label: `Group ${i + 1}` })
        .select()
        .single()

      // Assign each student
      for (const student of groups[i]) {
        await supabase
          .from('students')
          .update({ peer_group_id: pg.id, status: 'active' })
          .eq('id', student.id)
      }
    }

    // Update cohort status
    await supabase.from('cohorts').update({ status: 'active' }).eq('id', activeCohort.id)
    setActiveCohort(prev => ({ ...prev, status: 'active' }))
    await loadStudents(activeCohort.id)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => setImportRows(results.data),
    })
  }

  async function importTasks() {
    if (!activeCohort || !importRows.length) return
    setImporting(true)
    setImportResult(null)

    let created = 0, updated = 0, errors = []

    // Load existing modules for this cohort
    const { data: existingModules } = await supabase
      .from('modules')
      .select('id, week_number')
      .eq('cohort_id', activeCohort.id)

    const moduleMap = {}
    existingModules?.forEach(m => { moduleMap[m.week_number] = m.id })

    for (const row of importRows) {
      const week = parseInt(row['Week'])
      if (isNaN(week)) { errors.push(`Bad week: ${JSON.stringify(row)}`); continue }

      // Ensure module exists
      if (!moduleMap[week]) {
        const { data: mod } = await supabase
          .from('modules')
          .insert({
            cohort_id: activeCohort.id,
            week_number: week,
            title: `Module ${week}`,
            sort_order: week,
          })
          .select('id')
          .single()
        moduleMap[week] = mod.id
      }

      const dod = (row['Definition of done'] || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)

      const dueOffset = parseInt(row['Due'])
      const dueDate = activeCohort.start_date && !isNaN(dueOffset)
        ? new Date(new Date(activeCohort.start_date).getTime() + dueOffset * 86400000)
            .toISOString().split('T')[0]
        : null

      const payload = {
        module_id: moduleMap[week],
        title: row['Task title'] || '',
        type: row['Type']?.toLowerCase() === 'team' ? 'team' : 'individual',
        instructions: row['Instructions'] || '',
        definition_of_done: dod,
        requires_coach_verification: row['Milestone']?.toLowerCase() === 'yes',
        due_date: dueDate,
        sort_order: created + updated + 1,
      }

      // Upsert by title + module_id
      const { data: existing } = await supabase
        .from('tasks')
        .select('id')
        .eq('module_id', moduleMap[week])
        .eq('title', payload.title)
        .single()

      if (existing) {
        await supabase.from('tasks').update(payload).eq('id', existing.id)
        updated++
      } else {
        await supabase.from('tasks').insert(payload)
        created++
      }
    }

    setImporting(false)
    setImportResult({ created, updated, errors })
  }

  if (loading) return <div className="text-denim text-sm">Loading…</div>

  const cohortStatusColors = {
    open: 'info', closed: 'default', active: 'success', completed: 'honeycomb'
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="font-display text-3xl text-atlantic-navy mt-1">Cohort Setup</h1>
      </div>

      {/* Cohort selector */}
      <div className="flex flex-wrap gap-3 items-center">
        {cohorts.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCohort(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              activeCohort?.id === c.id
                ? 'bg-atlantic-navy text-soft-butter border-atlantic-navy'
                : 'bg-whipped-cream text-denim border-powder hover:border-denim'
            }`}
          >
            {c.name}
            <Badge variant={cohortStatusColors[c.status]} className="ml-2">{c.status}</Badge>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-powder">
        {['cohort', 'students', 'import'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              tab === t ? 'border-atlantic-navy text-atlantic-navy' : 'border-transparent text-denim'
            }`}
          >
            {t === 'import' ? 'Import Tasks' : t === 'cohort' ? 'Cohort' : 'Students'}
          </button>
        ))}
      </div>

      {/* ── COHORT TAB ── */}
      {tab === 'cohort' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h2 className="font-display text-xl text-atlantic-navy mb-4">Create new cohort</h2>
            <form onSubmit={createCohort} className="space-y-4">
              <div>
                <label className="eyebrow block mb-1">Cohort name</label>
                <input
                  required value={cohortName} onChange={e => setCohortName(e.target.value)}
                  placeholder="PnF VA Cohort 1"
                  className="input-field"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1">Start date (optional)</label>
                <input
                  type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create cohort'}</Button>
            </form>
          </Card>

          {activeCohort && (
            <Card>
              <h2 className="font-display text-xl text-atlantic-navy mb-4">{activeCohort.name}</h2>
              <div className="space-y-3 text-sm text-denim">
                <div className="flex justify-between">
                  <span>Status</span>
                  <Badge variant={cohortStatusColors[activeCohort.status]}>{activeCohort.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Current week</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCurrentWeek(Math.max(0, activeCohort.current_week - 1))}
                      className="w-7 h-7 rounded-lg bg-powder text-denim hover:bg-denim hover:text-soft-butter transition-colors text-sm font-bold"
                    >−</button>
                    <span className="font-semibold text-classic-navy w-6 text-center">{activeCohort.current_week}</span>
                    <button
                      onClick={() => updateCurrentWeek(activeCohort.current_week + 1)}
                      className="w-7 h-7 rounded-lg bg-powder text-denim hover:bg-denim hover:text-soft-butter transition-colors text-sm font-bold"
                    >+</button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Students enrolled</span>
                  <span className="font-medium text-classic-navy">{students.length}</span>
                </div>
              </div>

              {activeCohort.status === 'open' || activeCohort.status === 'closed' ? (
                <Button
                  variant="danger"
                  className="mt-5 w-full"
                  onClick={closeRegistrationAndAssign}
                >
                  Close registration & assign groups
                </Button>
              ) : null}
            </Card>
          )}
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {tab === 'students' && activeCohort && (
        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-xl text-atlantic-navy mb-4">Enrol a student</h2>
            <form onSubmit={enrolStudent} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-48">
                <label className="eyebrow block mb-1">Full name</label>
                <input required value={enrolName} onChange={e => setEnrolName(e.target.value)}
                  placeholder="Ada Lovelace" className="input-field" />
              </div>
              <div className="flex-1 min-w-48">
                <label className="eyebrow block mb-1">Email</label>
                <input type="email" required value={enrolEmail} onChange={e => setEnrolEmail(e.target.value)}
                  placeholder="ada@example.com" className="input-field" />
              </div>
              <Button type="submit" disabled={enrolling}>{enrolling ? 'Enrolling…' : 'Enrol student'}</Button>
            </form>
            <p className="text-xs text-denim mt-3">Students sign in via the magic link on the login page using their email address.</p>
          </Card>

          <Card>
            <h2 className="font-display text-xl text-atlantic-navy mb-4">
              Students <span className="text-denim text-base font-sans">({students.length})</span>
            </h2>
            {students.length === 0 ? (
              <p className="text-denim text-sm">No students enrolled yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-powder">
                      <th className="text-left py-2 pr-4 eyebrow">Name</th>
                      <th className="text-left py-2 pr-4 eyebrow">Email</th>
                      <th className="text-left py-2 pr-4 eyebrow">Status</th>
                      <th className="text-left py-2 eyebrow">Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className="border-b border-powder/50 hover:bg-powder/30 transition-colors">
                        <td className="py-2.5 pr-4 font-medium text-classic-navy">{s.profiles?.full_name || '—'}</td>
                        <td className="py-2.5 pr-4 text-denim">{s.profiles?.email}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={s.status === 'active' ? 'success' : s.status === 'withdrawn' ? 'danger' : 'info'}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-denim">{s.peer_groups?.label || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── IMPORT TAB ── */}
      {tab === 'import' && activeCohort && (
        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-xl text-atlantic-navy mb-2">Import tasks from CSV</h2>
            <p className="text-sm text-denim mb-4">
              Export your Google Sheet as CSV. Required columns: <strong>Week, Task title, Type, Instructions, Definition of done, Milestone, Due</strong>.
            </p>

            <div className="border-2 border-dashed border-powder rounded-xl p-8 text-center">
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-denim text-sm mb-3">Drop your CSV here or</p>
              <Button variant="secondary" onClick={() => fileRef.current.click()}>
                Choose CSV file
              </Button>
            </div>

            {importRows.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-denim">{importRows.length} rows parsed. Preview:</p>
                <div className="overflow-x-auto rounded-xl border border-powder">
                  <table className="w-full text-xs">
                    <thead className="bg-powder/50">
                      <tr>
                        {Object.keys(importRows[0]).map(k => (
                          <th key={k} className="text-left px-3 py-2 text-denim font-medium">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t border-powder">
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-3 py-2 text-classic-navy max-w-xs truncate">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importRows.length > 5 && (
                  <p className="text-xs text-denim">…and {importRows.length - 5} more rows</p>
                )}

                <Button onClick={importTasks} disabled={importing}>
                  {importing ? 'Importing…' : `Import ${importRows.length} tasks`}
                </Button>
              </div>
            )}

            {importResult && (
              <div className="mt-4 p-4 rounded-xl bg-powder/50 text-sm space-y-1">
                <p className="font-medium text-atlantic-navy">Import complete</p>
                <p className="text-denim">{importResult.created} tasks created, {importResult.updated} updated.</p>
                {importResult.errors.length > 0 && (
                  <ul className="text-red-600 text-xs mt-2 space-y-1">
                    {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-xl text-atlantic-navy mb-3">Expected CSV format</h2>
            <div className="overflow-x-auto rounded-xl border border-powder">
              <table className="w-full text-xs">
                <thead className="bg-powder/50">
                  <tr>
                    {['Week', 'Task title', 'Type', 'Instructions', 'Definition of done', 'Milestone', 'Due'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-denim font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-powder">
                    <td className="px-3 py-2 text-classic-navy">1</td>
                    <td className="px-3 py-2 text-classic-navy">Set up your Drive folder</td>
                    <td className="px-3 py-2 text-classic-navy">individual</td>
                    <td className="px-3 py-2 text-classic-navy">Create a shared Drive folder…</td>
                    <td className="px-3 py-2 text-classic-navy">Folder is shared{'\n'}Link submitted</td>
                    <td className="px-3 py-2 text-classic-navy">no</td>
                    <td className="px-3 py-2 text-classic-navy">7</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-denim mt-2">Due = days from cohort start date. Definition of done = one item per line within the cell.</p>
          </Card>
        </div>
      )}
    </div>
  )
}
