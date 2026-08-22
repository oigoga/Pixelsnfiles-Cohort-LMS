import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/Spinner'
import { CoachDecisionForm } from '../../components/coach/CoachDecisionForm'

export default function AllSubmissions() {
  const [loading, setLoading] = useState(true)
  const [cohorts, setCohorts] = useState([])
  const [cohortId, setCohortId] = useState('')
  const [students, setStudents] = useState([])
  const [weeks, setWeeks] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [reviewCounts, setReviewCounts] = useState({}) // submissionId -> { approve, rework }
  const [coachDecisions, setCoachDecisions] = useState({}) // submissionId -> most recent decision

  const [studentFilter, setStudentFilter] = useState('')
  const [weekFilter, setWeekFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [reviewing, setReviewing] = useState(null)

  useEffect(() => {
    supabase.from('cohorts').select('id, name').order('created_at', { ascending: false })
      .then(({ data }) => {
        setCohorts(data || [])
        if (data?.length) setCohortId(data[0].id)
      })
  }, [])

  useEffect(() => { if (cohortId) load(cohortId) }, [cohortId])

  async function load(cId) {
    setLoading(true)

    const [{ data: stu }, { data: mods }, { data: subs }] = await Promise.all([
      supabase.from('students')
        .select('id, profiles(full_name, email)')
        .eq('cohort_id', cId)
        .neq('status', 'withdrawn')
        .order('created_at'),
      supabase.from('modules').select('week_number').eq('cohort_id', cId).order('sort_order'),
      supabase.from('submissions')
        .select(`
          *,
          tasks!inner(title, type, requires_coach_verification, modules!inner(title, week_number, cohort_id)),
          students(id, profiles(full_name, email)),
          peer_groups(label)
        `)
        .eq('tasks.modules.cohort_id', cId)
        .order('submitted_at', { ascending: false }),
    ])

    setStudents(stu || [])
    setWeeks([...new Set((mods || []).map(m => m.week_number))].sort((a, b) => a - b))
    setSubmissions(subs || [])

    const subIds = (subs || []).map(s => s.id)
    if (subIds.length) {
      const [{ data: reviews }, { data: verifications }] = await Promise.all([
        supabase.from('peer_reviews').select('submission_id, decision').in('submission_id', subIds),
        supabase.from('coach_verifications')
          .select('submission_id, decision')
          .in('submission_id', subIds)
          .order('created_at', { ascending: false }),
      ])

      const rc = {}
      reviews?.forEach(r => {
        rc[r.submission_id] ||= { approve: 0, rework: 0 }
        rc[r.submission_id][r.decision === 'approve' ? 'approve' : 'rework']++
      })
      setReviewCounts(rc)

      const cd = {}
      verifications?.forEach(v => { cd[v.submission_id] ??= v.decision }) // most recent wins (already ordered desc)
      setCoachDecisions(cd)
    } else {
      setReviewCounts({})
      setCoachDecisions({})
    }

    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>

  const filtered = submissions.filter(s => {
    if (studentFilter && s.student_id !== studentFilter) return false
    if (weekFilter && String(s.tasks?.modules?.week_number) !== weekFilter) return false
    if (statusFilter && s.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <p className="eyebrow">Coach</p>
          <h1 className="font-display text-3xl text-atlantic-navy mt-1">All Submissions</h1>
          <p className="text-denim text-sm mt-1">Every task submitted, peer-reviewed or not — browse, filter, and review any of it.</p>
        </div>
        <select value={cohortId} onChange={e => setCohortId(e.target.value)} className="input-field text-sm ml-auto">
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!reviewing && (
        <div className="flex flex-wrap gap-3">
          <select value={studentFilter} onChange={e => setStudentFilter(e.target.value)} className="input-field text-sm">
            <option value="">All students</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.profiles?.full_name || s.profiles?.email}</option>
            ))}
          </select>
          <select value={weekFilter} onChange={e => setWeekFilter(e.target.value)} className="input-field text-sm">
            <option value="">All weeks</option>
            {weeks.map(w => <option key={w} value={w}>Week {w}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field text-sm">
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="peer_approved">Peer approved</option>
            <option value="needs_rework">Needs rework</option>
            <option value="coach_verified">Coach verified</option>
          </select>
        </div>
      )}

      {reviewing ? (
        <CoachDecisionForm
          submission={reviewing}
          onCancel={() => setReviewing(null)}
          onDone={async () => { setReviewing(null); await load(cohortId) }}
        />
      ) : filtered.length === 0 ? (
        <Card><p className="text-denim text-sm">No submissions match these filters.</p></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(sub => {
            const rc = reviewCounts[sub.id] || { approve: 0, rework: 0 }
            const coachDecision = coachDecisions[sub.id]
            return (
              <Card key={sub.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 mb-1.5">
                      <Badge variant={sub.tasks?.type === 'team' ? 'honeycomb' : 'default'}>{sub.tasks?.type}</Badge>
                      {sub.tasks?.requires_coach_verification && <Badge variant="info">Milestone</Badge>}
                      <StatusBadge status={sub.status} />
                    </div>
                    <p className="text-xs text-denim">Wk {sub.tasks?.modules?.week_number} · {sub.tasks?.modules?.title}</p>
                    <p className="font-semibold text-classic-navy text-sm">{sub.tasks?.title}</p>
                    <p className="text-xs text-denim mt-1">
                      {sub.peer_groups?.label
                        ? `Team: ${sub.peer_groups.label}`
                        : sub.students?.profiles?.full_name || sub.students?.profiles?.email}
                    </p>
                    <p className="text-xs text-denim mt-1">
                      👥 {rc.approve} approve · {rc.rework} rework
                      {coachDecision && (
                        <span className="ml-2 text-amber-700">
                          · 🏅 coach {coachDecision === 'verify' ? 'verified' : 'sent back'}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => setReviewing(sub)}>Review</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
