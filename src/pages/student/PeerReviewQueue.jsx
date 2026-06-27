import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'

export default function PeerReviewQueue() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState(null)
  const [queue, setQueue] = useState([])
  const [reviewing, setReviewing] = useState(null) // active submission being reviewed
  const [checklist, setChecklist] = useState({})
  const [decision, setDecision] = useState('approve')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { if (profile) load() }, [profile])

  async function load() {
    const { data: stu } = await supabase
      .from('students')
      .select('id, peer_group_id, cohort_id')
      .eq('profile_id', profile.id)
      .single()
    setStudent(stu)

    if (!stu?.peer_group_id) { setLoading(false); return }

    // Find groupmates' individual submissions that are in 'submitted' state
    // and haven't been reviewed by me yet
    const { data: groupmates } = await supabase
      .from('students')
      .select('id')
      .eq('peer_group_id', stu.peer_group_id)
      .neq('id', stu.id)

    const gmIds = groupmates?.map(g => g.id) || []
    if (!gmIds.length) { setLoading(false); return }

    const { data: subs } = await supabase
      .from('submissions')
      .select('*, tasks(title, definition_of_done, module_id, modules(title)), students(profiles(full_name))')
      .in('student_id', gmIds)
      .eq('status', 'submitted')
      .is('peer_group_id', null) // individual tasks only

    // Filter out ones I've already reviewed
    const { data: myReviews } = await supabase
      .from('peer_reviews')
      .select('submission_id')
      .eq('reviewer_student_id', stu.id)

    const reviewed = new Set(myReviews?.map(r => r.submission_id))
    setQueue((subs || []).filter(s => !reviewed.has(s.id)))
    setLoading(false)
  }

  function startReview(sub) {
    setReviewing(sub)
    // initialise checklist
    const initial = {}
    sub.tasks.definition_of_done?.forEach((_, i) => { initial[i] = false })
    setChecklist(initial)
    setDecision('approve')
    setComment('')
  }

  async function submitReview(e) {
    e.preventDefault()
    setSubmitting(true)

    const allChecked = Object.values(checklist).every(Boolean)
    const finalDecision = allChecked ? decision : 'rework'

    const { error } = await supabase.from('peer_reviews').insert({
      submission_id: reviewing.id,
      reviewer_student_id: student.id,
      checklist_results: checklist,
      decision: finalDecision,
      comment,
    })

    if (!error) {
      // Update submission status
      const newStatus = finalDecision === 'approve' ? 'peer_approved' : 'needs_rework'
      await supabase.from('submissions').update({ status: newStatus }).eq('id', reviewing.id)
      setReviewing(null)
      await load()
    }

    setSubmitting(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="eyebrow">Student</p>
        <h1 className="font-display text-3xl text-atlantic-navy mt-1">Peer Review Queue</h1>
      </div>

      {!student?.peer_group_id && (
        <Card>
          <p className="text-denim text-sm">Groups haven't been assigned yet. Check back after registration closes.</p>
        </Card>
      )}

      {student?.peer_group_id && queue.length === 0 && !reviewing && (
        <Card>
          <p className="text-denim text-sm">No submissions waiting for your review. Check back later.</p>
        </Card>
      )}

      {/* Queue list */}
      {!reviewing && queue.map(sub => (
        <Card key={sub.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-denim mb-1">{sub.tasks?.modules?.title}</p>
              <p className="font-semibold text-classic-navy text-sm">{sub.tasks?.title}</p>
              <p className="text-xs text-denim mt-1">by {sub.students?.profiles?.full_name || 'Groupmate'}</p>
            </div>
            <Button onClick={() => startReview(sub)}>Review</Button>
          </div>
        </Card>
      ))}

      {/* Active review */}
      {reviewing && (
        <form onSubmit={submitReview} className="space-y-6">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow mb-1">Reviewing</p>
                <h2 className="font-display text-2xl text-atlantic-navy">{reviewing.tasks?.title}</h2>
                <p className="text-sm text-denim mt-1">by {reviewing.students?.profiles?.full_name}</p>
              </div>
              <button type="button" onClick={() => setReviewing(null)} className="text-sm text-denim hover:text-atlantic-navy">
                ← Back
              </button>
            </div>

            <div className="mt-4">
              <a
                href={reviewing.drive_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-atlantic-navy underline underline-offset-2"
              >
                📂 Open submitted work →
              </a>
            </div>
          </Card>

          {/* Definition of done checklist */}
          {reviewing.tasks?.definition_of_done?.length > 0 && (
            <Card>
              <h3 className="font-display text-xl text-atlantic-navy mb-3">Definition of done checklist</h3>
              <div className="space-y-3">
                {reviewing.tasks.definition_of_done.map((item, i) => (
                  <label key={i} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={!!checklist[i]}
                      onChange={e => setChecklist(prev => ({ ...prev, [i]: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 accent-atlantic-navy"
                    />
                    <span className="text-sm text-denim group-hover:text-classic-navy transition-colors">{item}</span>
                  </label>
                ))}
              </div>
              {!Object.values(checklist).every(Boolean) && (
                <p className="text-xs text-amber-700 mt-3">Not all items are checked — this will be sent back as "needs rework".</p>
              )}
            </Card>
          )}

          {/* Comment + decision */}
          <Card>
            <h3 className="font-display text-xl text-atlantic-navy mb-3">Your feedback</h3>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder="Optional feedback for your groupmate…"
              className="input-field resize-y w-full"
            />
            <div className="flex gap-3 mt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : Object.values(checklist).every(Boolean) ? '✅ Approve' : '↩ Send back for rework'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setReviewing(null)}>Cancel</Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  )
}
