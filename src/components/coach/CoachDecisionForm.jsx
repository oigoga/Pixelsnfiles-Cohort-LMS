import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

// Records a coach's verify/rework decision on any submission — used by
// the milestone/team Verification Queue and the broader All Submissions
// audit view alike.
export function CoachDecisionForm({ submission, onCancel, onDone }) {
  const { profile } = useAuth()
  const [decision, setDecision] = useState('verify')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)

    await supabase.from('coach_verifications').insert({
      submission_id: submission.id,
      coach_id: profile.id,
      decision,
      comment: comment || null,
    })

    const newStatus = decision === 'verify' ? 'coach_verified' : 'needs_rework'
    await supabase.from('submissions').update({ status: newStatus }).eq('id', submission.id)

    setSubmitting(false)
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow mb-1">Reviewing</p>
            <h2 className="font-display text-2xl text-atlantic-navy">{submission.tasks?.title}</h2>
            <p className="text-sm text-denim mt-1">
              {submission.peer_groups?.label
                ? `Team submission — ${submission.peer_groups.label}`
                : submission.students?.profiles?.full_name}
            </p>
          </div>
          <button type="button" onClick={onCancel} className="text-sm text-denim hover:text-atlantic-navy">
            ← Back
          </button>
        </div>

        <div className="mt-4">
          <a
            href={submission.drive_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-atlantic-navy underline underline-offset-2"
          >
            📂 Open submitted work →
          </a>
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-xl text-atlantic-navy mb-4">Your decision</h3>
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => setDecision('verify')}
            className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${
              decision === 'verify'
                ? 'bg-green-50 border-green-300 text-green-800'
                : 'border-powder text-denim hover:border-denim'
            }`}
          >
            ✅ Verify
          </button>
          <button
            type="button"
            onClick={() => setDecision('rework')}
            className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${
              decision === 'rework'
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'border-powder text-denim hover:border-denim'
            }`}
          >
            ↩ Needs rework
          </button>
        </div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
          placeholder="Feedback for the student(s)…"
          className="input-field resize-y w-full"
        />
        <div className="flex gap-3 mt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Submit verification'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </Card>
    </form>
  )
}
