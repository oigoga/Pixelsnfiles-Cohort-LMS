import { useState, useEffect, useRef, useMemo } from 'react'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { StudentName } from '../../components/ui/StudentName'
const TRACKS = {
  design:    { label: 'Design',      emoji: '🎨', bg: 'bg-purple-100', text: 'text-purple-800' },
  marketing: { label: 'Marketing',   emoji: '📣', bg: 'bg-pink-100',   text: 'text-pink-800'   },
  ao:        { label: 'Admin & Ops', emoji: '⚙️', bg: 'bg-blue-100',   text: 'text-blue-800'   },
  get_hired: { label: 'Get Hired',   emoji: '🚀', bg: 'bg-green-100',  text: 'text-green-800'  },
}

function genCode(fullName) {
  const first = (fullName || '').trim().split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, '') || 'STUDENT'
  const digits = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `${first}-${digits}`
}

export default function CohortSetup() {
  const [cohorts, setCohorts] = useState([])
  const [activeCohort, setActiveCohort] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('cohort') // cohort | students | groups | codes | import
  const fileRef = useRef()

  // New cohort form
  const [cohortName, setCohortName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [saving, setSaving] = useState(false)

  // Access codes
  const [codes, setCodes] = useState([])
  const [codeForm, setCodeForm] = useState({ full_name: '', email: '', role: 'student' })
  const [creatingCode, setCreatingCode] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  // (legacy enrol form)
  const [enrolEmail, setEnrolEmail] = useState('')
  const [enrolName, setEnrolName] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  // Groups (manual assignment)
  const [groups, setGroups]               = useState([])
  const [groupLabel, setGroupLabel]       = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [assigningId, setAssigningId]     = useState(null)
  const [renamingId, setRenamingId]       = useState(null)
  const [renameValue, setRenameValue]     = useState('')
  const [groupError, setGroupError]       = useState('')

  // Track assignment
  const [trackEditing, setTrackEditing] = useState({}) // studentId → custom text being typed

  // Students table search + pagination
  const STUDENTS_PER_PAGE = 25
  const [studentSearch, setStudentSearch] = useState('')
  const [studentPage, setStudentPage] = useState(1)

  const codeByEmail = useMemo(() => {
    const map = {}
    codes.forEach(c => { map[c.email] = c.code })
    return map
  }, [codes])

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return students
    return students.filter(s =>
      s.profiles?.full_name?.toLowerCase().includes(q) ||
      s.profiles?.email?.toLowerCase().includes(q)
    )
  }, [students, studentSearch])

  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE))
  const pagedStudents = useMemo(() => {
    const start = (studentPage - 1) * STUDENTS_PER_PAGE
    return filteredStudents.slice(start, start + STUDENTS_PER_PAGE)
  }, [filteredStudents, studentPage])

  useEffect(() => { setStudentPage(1) }, [studentSearch, activeCohort?.id])

  async function updateTrack(studentId, track) {
    await supabase.from('students').update({ track }).eq('id', studentId)
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, track } : s))
  }

  // Bulk student import
  const bulkFileRef = useRef()
  const [bulkRows, setBulkRows]         = useState([])
  const [bulkImporting, setBulkImporting] = useState(false)
  const [bulkResult, setBulkResult]     = useState(null)

  // Task import (CSV)
  const [importRows, setImportRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  useEffect(() => { loadCohorts() }, [])
  useEffect(() => {
    if (activeCohort) {
      loadStudents(activeCohort.id)
      loadCodes(activeCohort.id)
      loadGroups(activeCohort.id)
    }
  }, [activeCohort])

  async function loadCohorts() {
    const { data } = await supabase.from('cohorts').select('*').order('created_at', { ascending: false })
    setCohorts(data || [])
    if (data?.length) setActiveCohort(data[0])
    setLoading(false)
  }

  async function loadCodes(cohortId) {
    const { data } = await supabase
      .from('access_codes')
      .select('*')
      .eq('cohort_id', cohortId)
      .order('created_at', { ascending: false })
    setCodes(data || [])
  }

  async function createCode(e) {
    e.preventDefault()
    setCreatingCode(true)
    const name = codeForm.full_name.trim()
    const code = genCode(name)
    const { error } = await supabase.from('access_codes').insert({
      code,
      full_name: name,
      email: codeForm.email.trim().toLowerCase(),
      role: codeForm.role,
      cohort_id: activeCohort.id,
    })
    setCreatingCode(false)
    if (!error) {
      setCodeForm({ full_name: '', email: '', role: 'student' })
      await loadCodes(activeCohort.id)
    }
  }

  async function copyCode(code, id) {
    await navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function deleteCode(id) {
    if (!confirm('Delete this access code? The student will no longer be able to use it.')) return
    await supabase.from('access_codes').delete().eq('id', id)
    setCodes(prev => prev.filter(c => c.id !== id))
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
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', enrolEmail)
      .single()
    let profileId = existing?.id
    if (!profileId) {
      alert('No profile found with that email. Make sure the student has logged in with their access code first.')
      setEnrolling(false)
      return
    }
    await supabase.from('students').upsert({
      profile_id: profileId,
      cohort_id: activeCohort.id,
      status: 'enrolled',
    }, { onConflict: 'profile_id,cohort_id' })
    await loadStudents(activeCohort.id)
    setEnrolName('')
    setEnrolEmail('')
    setEnrolling(false)
  }

  async function loadGroups(cohortId) {
    const { data } = await supabase.from('peer_groups').select('*').eq('cohort_id', cohortId).order('label')
    setGroups(data || [])
  }

  async function createGroup(e) {
    e.preventDefault()
    if (!groupLabel.trim()) return
    setCreatingGroup(true)
    setGroupError('')
    const { data: newGroup, error } = await supabase
      .from('peer_groups')
      .insert({ cohort_id: activeCohort.id, label: groupLabel.trim() })
      .select()
      .single()
    if (error) {
      setGroupError(error.message)
      setCreatingGroup(false)
      return
    }
    setGroupLabel('')
    setCreatingGroup(false)
    await loadGroups(activeCohort.id)
    if (newGroup) setSelectedGroupId(newGroup.id)
  }

  async function assignStudent(studentId, groupId) {
    setAssigningId(studentId)
    // Optimistic update for instant visual feedback
    setStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, peer_group_id: groupId || null } : s
    ))
    await supabase.from('students').update({
      peer_group_id: groupId || null,
      status:        groupId ? 'active' : 'enrolled',
    }).eq('id', studentId)
    await loadStudents(activeCohort.id)
    setAssigningId(null)
  }

  async function renameGroup(groupId, newLabel) {
    if (!newLabel.trim()) return
    await supabase.from('peer_groups').update({ label: newLabel.trim() }).eq('id', groupId)
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, label: newLabel.trim() } : g))
    setRenamingId(null)
  }

  async function deleteGroup(groupId) {
    if (!confirm('Delete this group? Students will be moved to unassigned.')) return
    await supabase.from('students').update({ peer_group_id: null, status: 'enrolled' }).eq('peer_group_id', groupId)
    await supabase.from('peer_groups').delete().eq('id', groupId)
    setGroups(prev => prev.filter(g => g.id !== groupId))
    setStudents(prev => prev.map(s =>
      s.peer_group_id === groupId ? { ...s, peer_group_id: null } : s
    ))
    if (selectedGroupId === groupId) setSelectedGroupId(null)
  }

  function handleBulkFile(e) {
    const file = e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => setBulkRows(results.data),
    })
    e.target.value = ''
  }

  async function importStudents() {
    if (!activeCohort || !bulkRows.length) return
    setBulkImporting(true)
    setBulkResult(null)

    // Existing codes for this cohort (duplicate email check)
    const { data: existing } = await supabase
      .from('access_codes')
      .select('email, code')
      .eq('cohort_id', activeCohort.id)

    const existingByEmail = {}
    ;(existing || []).forEach(c => { existingByEmail[c.email.toLowerCase()] = c.code })

    // All codes across all cohorts (collision check)
    const { data: allCodes } = await supabase.from('access_codes').select('code')
    const usedCodes = new Set((allCodes || []).map(c => c.code.toUpperCase()))

    const results = new Array(bulkRows.length)
    const toInsert = []

    // Work out codes for every row first (pure, in-memory) so the actual
    // inserts can fire concurrently instead of one row at a time.
    bulkRows.forEach((row, i) => {
      const full_name = (row['Full name'] || row['Name'] || row['full_name'] || row['name'] || '').trim()
      const email     = (row['Email'] || row['email'] || '').trim().toLowerCase()

      if (!full_name || !email) {
        results[i] = { full_name, email, code: null, note: 'Missing name or email' }
        return
      }

      if (existingByEmail[email] !== undefined) {
        results[i] = { full_name, email, code: existingByEmail[email], note: 'Already has a code' }
        return
      }

      // Generate a name-based collision-free code
      let code = genCode(full_name)
      let attempts = 0
      while (usedCodes.has(code) && attempts < 30) { code = genCode(full_name); attempts++ }
      usedCodes.add(code)
      existingByEmail[email] = code

      toInsert.push({ index: i, full_name, email, code })
    })

    await Promise.all(toInsert.map(async ({ index, full_name, email, code }) => {
      const { error } = await supabase.from('access_codes').insert({
        code,
        full_name,
        email,
        role: 'student',
        cohort_id: activeCohort.id,
      })
      results[index] = error
        ? { full_name, email, code: null, note: error.message }
        : { full_name, email, code, note: 'Created' }
    }))

    setBulkImporting(false)
    setBulkResult(results)
    setBulkRows([])
    await loadCodes(activeCohort.id)
  }

  function downloadResultsCsv() {
    if (!bulkResult) return
    const header = 'Full name,Email,Access code,Note'
    const rows = bulkResult.map(r =>
      `"${r.full_name}","${r.email}","${r.code || ''}","${r.note}"`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${activeCohort.name.replace(/\s+/g, '_')}_access_codes.csv`
    a.click()
    URL.revokeObjectURL(url)
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

    const errors = []

    // Load existing modules for this cohort
    const { data: existingModules } = await supabase
      .from('modules')
      .select('id, week_number')
      .eq('cohort_id', activeCohort.id)

    const moduleMap = {}
    existingModules?.forEach(m => { moduleMap[m.week_number] = m.id })

    const rowsWithWeek = importRows.map(row => ({ row, week: parseInt(row['Week']) }))
    rowsWithWeek.forEach(({ row, week }) => {
      if (isNaN(week)) errors.push(`Bad week: ${JSON.stringify(row)}`)
    })
    const validRows = rowsWithWeek.filter(({ week }) => !isNaN(week))

    // Create every missing module concurrently instead of one at a time.
    const missingWeeks = [...new Set(validRows.filter(({ week }) => !moduleMap[week]).map(({ week }) => week))]
    if (missingWeeks.length) {
      const created = await Promise.all(missingWeeks.map(week =>
        supabase.from('modules').insert({
          cohort_id: activeCohort.id,
          week_number: week,
          title: `Module ${week}`,
          sort_order: week,
        }).select('id').single()
      ))
      missingWeeks.forEach((week, i) => { moduleMap[week] = created[i].data.id })
    }

    // One query for every existing task in the affected modules, instead of
    // a per-row lookup.
    const moduleIds = [...new Set(validRows.map(({ week }) => moduleMap[week]))]
    const { data: existingTasks } = moduleIds.length
      ? await supabase.from('tasks').select('id, module_id, title').in('module_id', moduleIds)
      : { data: [] }
    const existingTaskMap = {}
    existingTasks?.forEach(t => { existingTaskMap[`${t.module_id}::${t.title}`] = t.id })

    const payloads = validRows.map(({ row, week }, i) => {
      const dod = (row['Definition of done'] || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)

      const dueOffset = parseInt(row['Due'])
      const dueDate = activeCohort.start_date && !isNaN(dueOffset)
        ? new Date(new Date(activeCohort.start_date).getTime() + dueOffset * 86400000)
            .toISOString().split('T')[0]
        : null

      return {
        module_id: moduleMap[week],
        title: row['Task title'] || '',
        type: row['Type']?.toLowerCase() === 'team' ? 'team' : 'individual',
        instructions: row['Instructions'] || '',
        definition_of_done: dod,
        requires_coach_verification: row['Milestone']?.toLowerCase() === 'yes',
        due_date: dueDate,
        sort_order: i + 1,
      }
    })

    // Upsert by title + module_id: new tasks batch-inserted in one call,
    // updates to existing tasks fired concurrently.
    const toInsert = []
    const toUpdate = []
    payloads.forEach(payload => {
      const existingId = existingTaskMap[`${payload.module_id}::${payload.title}`]
      if (existingId) toUpdate.push({ id: existingId, payload })
      else toInsert.push(payload)
    })

    await Promise.all([
      toInsert.length ? supabase.from('tasks').insert(toInsert) : Promise.resolve(),
      ...toUpdate.map(({ id, payload }) => supabase.from('tasks').update(payload).eq('id', id)),
    ])

    setImporting(false)
    setImportResult({ created: toInsert.length, updated: toUpdate.length, errors })
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
        {[
          { key: 'cohort',   label: 'Cohort' },
          { key: 'students', label: 'Students' },
          { key: 'groups',   label: 'Groups' },
          { key: 'codes',    label: 'Access Codes' },
          { key: 'import',   label: 'Import Tasks' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-atlantic-navy text-atlantic-navy' : 'border-transparent text-denim'
            }`}
          >
            {t.label}
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

              <Button
                variant="secondary"
                className="mt-5 w-full"
                onClick={() => setTab('groups')}
              >
                Manage groups →
              </Button>
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
            <p className="text-xs text-denim mt-3">Tip: use the <button onClick={() => setTab('codes')} className="underline">Access Codes tab</button> to generate a login code and send it to the student.</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4 mb-1 flex-wrap">
              <h2 className="font-display text-xl text-atlantic-navy">
                Students <span className="text-denim text-base font-sans">({students.length})</span>
              </h2>
              {students.length > 0 && (
                <input
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="Search name or email…"
                  className="input-field text-sm py-1.5 w-56"
                />
              )}
            </div>
            <p className="text-xs text-denim mb-4">The <strong>Code</strong> column is what each student uses to log in. If a student loses their code, you can find it here.</p>
            {students.length === 0 ? (
              <p className="text-denim text-sm">No students enrolled yet. They'll appear here once they create an account on the login page.</p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-denim text-sm">No students match "{studentSearch}".</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-powder">
                      <th className="text-left py-2 pr-4 eyebrow">Name</th>
                      <th className="text-left py-2 pr-4 eyebrow">Email</th>
                      <th className="text-left py-2 pr-4 eyebrow">Code</th>
                      <th className="text-left py-2 pr-4 eyebrow">Track</th>
                      <th className="text-left py-2 pr-4 eyebrow">Status</th>
                      <th className="text-left py-2 eyebrow">Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedStudents.map(s => {
                      const studentCode = codeByEmail[s.profiles?.email]
                      return (
                        <tr key={s.id} className="border-b border-powder/50 hover:bg-powder/30 transition-colors">
                          <td className="py-2.5 pr-4"><StudentName name={s.profiles?.full_name || '—'} track={s.track} /></td>
                          <td className="py-2.5 pr-4 text-denim">{s.profiles?.email}</td>
                          <td className="py-2.5 pr-4">
                            {studentCode
                              ? <span className="font-mono text-xs bg-powder px-2 py-1 rounded-lg text-classic-navy tracking-widest">{studentCode}</span>
                              : <span className="text-denim/40 text-xs">—</span>
                            }
                          </td>
                          <td className="py-2.5 pr-4">
                            {(() => {
                              const track = s.track || 'ao'
                              const isKnown = !!TRACKS[track]
                              const isEditing = trackEditing[s.id] !== undefined
                              if (isEditing) {
                                return (
                                  <input
                                    autoFocus
                                    value={trackEditing[s.id]}
                                    onChange={e => setTrackEditing(p => ({ ...p, [s.id]: e.target.value }))}
                                    onBlur={() => {
                                      const val = trackEditing[s.id].trim()
                                      if (val) updateTrack(s.id, val)
                                      setTrackEditing(p => { const n = { ...p }; delete n[s.id]; return n })
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') e.target.blur()
                                      if (e.key === 'Escape') setTrackEditing(p => { const n = { ...p }; delete n[s.id]; return n })
                                    }}
                                    placeholder="e.g. Finance…"
                                    className="input-field text-xs py-1 w-28"
                                  />
                                )
                              }
                              return (
                                <select
                                  value={isKnown ? track : '__custom__'}
                                  onChange={e => {
                                    if (e.target.value === '__custom__') {
                                      setTrackEditing(p => ({ ...p, [s.id]: isKnown ? '' : track }))
                                    } else {
                                      updateTrack(s.id, e.target.value)
                                    }
                                  }}
                                  className="input-field text-xs py-1 w-36"
                                >
                                  <option value="ao">⚙️ Admin & Ops</option>
                                  <option value="design">🎨 Design</option>
                                  <option value="marketing">📣 Marketing</option>
                                  <option value="get_hired">🚀 Get Hired</option>
                                  {!isKnown && <option value="__custom__">{track}</option>}
                                  <option value="__custom__">✏️ Custom…</option>
                                </select>
                              )
                            })()}
                          </td>
                          <td className="py-2.5 pr-4">
                            <Badge variant={s.status === 'active' ? 'success' : s.status === 'withdrawn' ? 'danger' : 'info'}>
                              {s.status}
                            </Badge>
                          </td>
                          <td className="py-2.5">
                            {groups.length > 0 ? (
                              <select
                                value={s.peer_group_id || ''}
                                onChange={e => assignStudent(s.id, e.target.value || null)}
                                disabled={assigningId === s.id}
                                className="input-field text-xs py-1 w-36"
                              >
                                <option value="">— Unassigned</option>
                                {groups.map(g => (
                                  <option key={g.id} value={g.id}>{g.label}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-denim text-xs">{s.peer_groups?.label || '—'}</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {totalStudentPages > 1 && (
                  <div className="flex items-center justify-between mt-4 text-sm text-denim">
                    <span>
                      Page {studentPage} of {totalStudentPages} · {filteredStudents.length} student{filteredStudents.length === 1 ? '' : 's'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                        disabled={studentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-powder hover:border-denim disabled:opacity-40 disabled:hover:border-powder transition-colors"
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                        disabled={studentPage === totalStudentPages}
                        className="px-3 py-1.5 rounded-lg border border-powder hover:border-denim disabled:opacity-40 disabled:hover:border-powder transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── GROUPS TAB ── */}
      {tab === 'groups' && activeCohort && (
        <div className="space-y-5">

          {/* Create group */}
          <form onSubmit={createGroup} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="eyebrow block mb-1">Group name</label>
              <input
                required
                value={groupLabel}
                onChange={e => setGroupLabel(e.target.value)}
                placeholder="e.g. Alpha, Team Kova…"
                className="input-field"
              />
            </div>
            <Button type="submit" disabled={creatingGroup || !groupLabel.trim()}>
              {creatingGroup ? 'Creating…' : '+ Create group'}
            </Button>
          </form>
          {groupError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {groupError}
            </div>
          )}

          {groups.length === 0 ? (
            <Card>
              <p className="text-denim text-sm text-center py-4">No groups yet — type a name above and hit Create.</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-[240px,1fr] gap-5 items-start">

              {/* Left: group list */}
              <div className="space-y-2">
                <p className="eyebrow px-1 mb-2">Groups ({groups.length})</p>
                {groups.map(g => {
                  const count = students.filter(s => s.peer_group_id === g.id).length
                  const isSelected = selectedGroupId === g.id
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGroupId(isSelected ? null : g.id)}
                      className={`w-full text-left rounded-2xl border-2 px-4 py-3 transition-all ${
                        isSelected
                          ? 'bg-atlantic-navy border-atlantic-navy'
                          : 'bg-whipped-cream border-powder hover:border-denim'
                      }`}
                    >
                      <p className={`font-display text-lg leading-tight ${isSelected ? 'text-soft-butter' : 'text-atlantic-navy'}`}>
                        {g.label}
                      </p>
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-powder' : 'text-denim'}`}>
                        {count} member{count !== 1 ? 's' : ''}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* Right: group detail */}
              {selectedGroupId ? (() => {
                const selGroup  = groups.find(g => g.id === selectedGroupId)
                const members   = students.filter(s => s.peer_group_id === selectedGroupId)
                const unassigned = students.filter(s => !s.peer_group_id)
                return (
                  <div className="space-y-4">
                    <Card>
                      {/* Header + rename */}
                      <div className="flex items-center justify-between mb-4">
                        {renamingId === selectedGroupId ? (
                          <form onSubmit={e => { e.preventDefault(); renameGroup(selectedGroupId, renameValue) }}
                            className="flex items-center gap-2 flex-1">
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              className="input-field text-sm py-1.5 flex-1"
                            />
                            <Button type="submit">Save</Button>
                            <button type="button" onClick={() => setRenamingId(null)}
                              className="text-sm text-denim px-2">Cancel</button>
                          </form>
                        ) : (
                          <>
                            <h2 className="font-display text-xl text-atlantic-navy">
                              {selGroup?.label}
                              <span className="text-denim text-base font-sans ml-2">({members.length})</span>
                            </h2>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => { setRenamingId(selectedGroupId); setRenameValue(selGroup?.label || '') }}
                                className="text-xs text-denim hover:text-atlantic-navy transition-colors"
                              >✏️ Rename</button>
                              <button
                                onClick={() => deleteGroup(selectedGroupId)}
                                className="text-xs text-denim/40 hover:text-red-500 transition-colors"
                              >Delete</button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Members */}
                      {members.length === 0 ? (
                        <p className="text-denim text-sm">No members yet — click a student below to add them.</p>
                      ) : (
                        <ul className="divide-y divide-powder/60">
                          {members.map(s => (
                            <li key={s.id} className="flex items-center gap-3 py-2.5">
                              <div className="w-8 h-8 rounded-full bg-atlantic-navy/10 flex items-center justify-center text-atlantic-navy font-bold text-sm shrink-0">
                                {(s.profiles?.full_name || '?')[0].toUpperCase()}
                              </div>
                              <span className="flex-1">
                                <StudentName name={s.profiles?.full_name || '—'} track={s.track} className="text-sm" />
                              </span>
                              <button
                                onClick={() => assignStudent(s.id, null)}
                                disabled={assigningId === s.id}
                                className="text-xs text-denim/50 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-40"
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>

                    {/* Unassigned pool */}
                    {unassigned.length > 0 && (
                      <Card>
                        <p className="eyebrow mb-3">
                          Unassigned ({unassigned.length}) — click to add to {selGroup?.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {unassigned.map(s => (
                            <button
                              key={s.id}
                              onClick={() => assignStudent(s.id, selectedGroupId)}
                              disabled={assigningId === s.id}
                              className="flex items-center gap-2 bg-whipped-cream border border-powder rounded-xl px-3 py-2 hover:border-atlantic-navy hover:bg-atlantic-navy/5 transition-all disabled:opacity-40"
                            >
                              <div className="w-6 h-6 rounded-full bg-atlantic-navy/10 flex items-center justify-center text-atlantic-navy font-bold text-xs shrink-0">
                                {(s.profiles?.full_name || '?')[0].toUpperCase()}
                              </div>
                              <StudentName name={s.profiles?.full_name || '—'} track={s.track} className="text-sm" />
                              <span className="text-atlantic-navy text-xs font-bold">+</span>
                            </button>
                          ))}
                        </div>
                      </Card>
                    )}

                    {unassigned.length === 0 && (
                      <p className="text-denim text-sm text-center py-2">All students have been assigned to groups.</p>
                    )}
                  </div>
                )
              })() : (
                <Card>
                  <p className="text-denim text-sm text-center py-8">
                    ← Select a group to see its members and add students
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ACCESS CODES TAB ── */}
      {tab === 'codes' && activeCohort && (
        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-xl text-atlantic-navy mb-1">Generate access code</h2>
            <p className="text-sm text-denim mb-4">
              Each student gets a unique code. Send it to them — they enter it on the login page to join the platform.
            </p>
            <form onSubmit={createCode} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-44">
                <label className="eyebrow block mb-1">Full name</label>
                <input
                  required
                  value={codeForm.full_name}
                  onChange={e => setCodeForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Ada Lovelace"
                  className="input-field"
                />
              </div>
              <div className="flex-1 min-w-44">
                <label className="eyebrow block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={codeForm.email}
                  onChange={e => setCodeForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="ada@example.com"
                  className="input-field"
                />
              </div>
              <div className="min-w-32">
                <label className="eyebrow block mb-1">Role</label>
                <select
                  value={codeForm.role}
                  onChange={e => setCodeForm(f => ({ ...f, role: e.target.value }))}
                  className="input-field"
                >
                  <option value="student">Student</option>
                  <option value="coach">Coach</option>
                </select>
              </div>
              <Button type="submit" disabled={creatingCode}>
                {creatingCode ? 'Generating…' : 'Generate code'}
              </Button>
            </form>
          </Card>

          {/* Bulk import */}
          <Card>
            <h2 className="font-display text-xl text-atlantic-navy mb-1">Bulk import students</h2>
            <p className="text-sm text-denim mb-4">
              Upload a CSV with columns <strong>Full name</strong> and <strong>Email</strong>. A unique code is
              generated for each student. Download the results to send codes out.
            </p>

            <input ref={bulkFileRef} type="file" accept=".csv" className="hidden" onChange={handleBulkFile} />

            {bulkRows.length === 0 && !bulkResult && (
              <Button variant="secondary" onClick={() => bulkFileRef.current.click()}>
                Choose CSV file
              </Button>
            )}

            {bulkRows.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-denim">{bulkRows.length} row{bulkRows.length !== 1 ? 's' : ''} parsed — preview:</p>
                <div className="overflow-x-auto rounded-xl border border-powder max-h-40">
                  <table className="w-full text-xs">
                    <thead className="bg-powder/50 sticky top-0">
                      <tr>
                        {Object.keys(bulkRows[0]).map(k => (
                          <th key={k} className="text-left px-3 py-2 text-denim font-medium">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bulkRows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t border-powder">
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-3 py-2 text-classic-navy">{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bulkRows.length > 5 && <p className="text-xs text-denim">…and {bulkRows.length - 5} more rows</p>}
                <div className="flex gap-3">
                  <Button onClick={importStudents} disabled={bulkImporting}>
                    {bulkImporting ? 'Generating codes…' : `Generate codes for ${bulkRows.length} student${bulkRows.length !== 1 ? 's' : ''}`}
                  </Button>
                  <Button variant="secondary" onClick={() => setBulkRows([])}>Cancel</Button>
                </div>
              </div>
            )}

            {bulkResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-medium text-atlantic-navy">
                    {bulkResult.filter(r => r.note === 'Created').length} codes created
                    {bulkResult.filter(r => r.note !== 'Created').length > 0 &&
                      ` · ${bulkResult.filter(r => r.note !== 'Created').length} skipped`}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={downloadResultsCsv}>Download CSV</Button>
                    <Button variant="secondary" onClick={() => { setBulkResult(null); setBulkRows([]) }}>
                      Import another
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-powder max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-powder/50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 eyebrow">Name</th>
                        <th className="text-left px-3 py-2 eyebrow">Email</th>
                        <th className="text-left px-3 py-2 eyebrow">Code</th>
                        <th className="text-left px-3 py-2 eyebrow">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResult.map((r, i) => (
                        <tr key={i} className={`border-t border-powder ${r.note !== 'Created' ? 'opacity-50' : ''}`}>
                          <td className="px-3 py-2.5 font-medium text-classic-navy">{r.full_name || '—'}</td>
                          <td className="px-3 py-2.5 text-denim">{r.email}</td>
                          <td className="px-3 py-2.5 font-mono text-classic-navy tracking-widest">
                            {r.code || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-xs">
                            {r.note === 'Created'
                              ? <span className="text-green-600 font-medium">Created</span>
                              : <span className="text-amber-600">{r.note}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-xl text-atlantic-navy mb-4">
              Codes for {activeCohort.name}
              <span className="text-denim text-base font-sans ml-2">({codes.length})</span>
            </h2>
            {codes.length === 0 ? (
              <p className="text-denim text-sm">No codes generated yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-powder">
                      <th className="text-left py-2 pr-4 eyebrow">Name</th>
                      <th className="text-left py-2 pr-4 eyebrow">Email</th>
                      <th className="text-left py-2 pr-4 eyebrow">Role</th>
                      <th className="text-left py-2 pr-4 eyebrow">Code</th>
                      <th className="py-2 eyebrow"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map(c => (
                      <tr key={c.id} className="border-b border-powder/50 hover:bg-powder/30 transition-colors">
                        <td className="py-2.5 pr-4 font-medium text-classic-navy">{c.full_name}</td>
                        <td className="py-2.5 pr-4 text-denim">{c.email}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={c.role === 'coach' ? 'honeycomb' : 'info'}>{c.role}</Badge>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-classic-navy tracking-widest">{c.code}</td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => copyCode(c.code, c.id)}
                              className="text-xs px-3 py-1 rounded-lg border border-powder text-denim hover:border-denim transition-colors"
                            >
                              {copiedId === c.id ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                              onClick={() => deleteCode(c.id)}
                              className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:border-red-400 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
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
