import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/Spinner'

const TRACK = {
  AO: { label: 'Admin & Ops',  bg: '#dbeafe', color: '#1d4ed8', emoji: '⚙️' },
  MK: { label: 'Marketing',    bg: '#ede9fe', color: '#6d28d9', emoji: '📣' },
  DS: { label: 'Design',       bg: '#fef3c7', color: '#92400e', emoji: '🎨' },
  GH: { label: 'Get Hired',    bg: '#d1fae5', color: '#065f46', emoji: '🚀' },
}
function getTrack(title) {
  const m = title?.match(/^(AO|MK|DS|GH)-/)
  return m ? TRACK[m[1]] : null
}

export default function TaskView() {
  const { taskId } = useParams()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [task, setTask] = useState(null)
  const [student, setStudent] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [peerReviews, setPeerReviews] = useState([])
  const [coachVerification, setCoachVerification] = useState(null)
  const [driveLink, setDriveLink] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editingLink, setEditingLink] = useState(false)
  const [editLinkValue, setEditLinkValue] = useState('')
  const [savingLink, setSavingLink] = useState(false)

  useEffect(() => { if (profile) load() }, [taskId, profile])

  async function load() {
    // Task and student don't depend on each other — fetch in parallel.
    const [{ data: t }, { data: stu }] = await Promise.all([
      supabase
        .from('tasks')
        .select('*, modules(id, title, week_number, cohort_id)')
        .eq('id', taskId)
        .single(),
      supabase
        .from('students')
        .select('id, peer_group_id')
        .eq('profile_id', profile.id)
        .single(),
    ])
    setTask(t)
    setStudent(stu)

    if (stu) {
      // For team tasks, look up by peer_group_id; for individual by student_id
      let subQuery = supabase.from('submissions').select('*').eq('task_id', taskId)
      if (t?.type === 'team' && stu.peer_group_id) {
        subQuery = subQuery.eq('peer_group_id', stu.peer_group_id)
      } else {
        subQuery = subQuery.eq('student_id', stu.id)
      }

      const { data: sub } = await subQuery.single()
      setSubmission(sub)
      if (sub?.drive_link) setDriveLink(sub.drive_link)

      if (sub) {
        // Peer reviews and coach verification both only depend on sub.id.
        const [{ data: reviews }, { data: cv }] = await Promise.all([
          supabase
            .from('peer_reviews')
            .select('*, students(profiles(full_name))')
            .eq('submission_id', sub.id),
          supabase
            .from('coach_verifications')
            .select('*')
            .eq('submission_id', sub.id)
            .single(),
        ])
        setPeerReviews(reviews || [])
        setCoachVerification(cv)
      }
    }

    setLoading(false)
  }

  async function saveEditedLink(e) {
    e.preventDefault()
    if (!editLinkValue.startsWith('https://')) {
      setError('Please enter a valid link starting with https://')
      return
    }
    setSavingLink(true)
    const { error: err } = await supabase
      .from('submissions')
      .update({ drive_link: editLinkValue })
      .eq('id', submission.id)
    setSavingLink(false)
    if (err) { setError(err.message); return }
    setSubmission(s => ({ ...s, drive_link: editLinkValue }))
    setDriveLink(editLinkValue)
    setEditingLink(false)
  }

  async function submitWork(e) {
    e.preventDefault()
    setError('')
    if (!driveLink.startsWith('https://')) {
      setError('Please enter a valid Google Drive link starting with https://')
      return
    }
    setSubmitting(true)

    const payload = {
      task_id: taskId,
      drive_link: driveLink,
      status: 'submitted',
    }

    if (task.type === 'team') {
      payload.peer_group_id = student.peer_group_id
      payload.student_id = student.id // who submitted on behalf
    } else {
      payload.student_id = student.id
    }

    if (submission) {
      // Resubmit
      const { error: err } = await supabase
        .from('submissions')
        .update({ drive_link: driveLink, status: 'submitted' })
        .eq('id', submission.id)
      if (err) setError(err.message)
    } else {
      const { data, error: err } = await supabase
        .from('submissions')
        .insert(payload)
        .select()
        .single()
      if (err) setError(err.message)
      else setSubmission(data)
    }

    setSubmitting(false)
    await load()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
  if (!task) return <p className="text-denim">Task not found.</p>

  const canSubmit = !submission || submission.status === 'needs_rework'
  const mod = task.modules
  const track = getTrack(task.title)

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/student/module/${mod?.id}`} className="text-sm text-denim hover:text-atlantic-navy">
          ← {mod?.title || 'Module'}
        </Link>
        <div className="flex flex-wrap gap-2 mt-3">
          {track && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: track.bg, color: track.color }}>
              {track.emoji} {track.label}
            </span>
          )}
          {task.type === 'team' && <Badge variant="honeycomb">Team task</Badge>}
          {task.requires_coach_verification && <Badge variant="info">⭐ Milestone</Badge>}
          {submission && <StatusBadge status={submission.status} />}
        </div>
        <h1 className="font-display text-4xl font-bold text-atlantic-navy mt-2 leading-tight">{task.title}</h1>
        {task.due_date && <p className="text-base text-denim mt-2">📅 Due {task.due_date}</p>}
      </div>

      {/* Instructions */}
      <Card>
        <h2 className="font-display text-2xl font-bold text-atlantic-navy mb-3">Here's what you're building</h2>
        <p className="text-classic-navy text-base leading-relaxed whitespace-pre-line">{task.instructions}</p>
      </Card>

      {/* Definition of done */}
      {task.definition_of_done?.length > 0 && (
        <Card>
          <h2 className="font-display text-2xl font-bold text-atlantic-navy mb-1">You're done when…</h2>
          <p className="text-sm text-denim mb-4">Every box needs to be true before you submit. No skipping.</p>
          <ul className="space-y-3">
            {task.definition_of_done.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-base text-classic-navy bg-powder/40 rounded-xl px-4 py-3">
                <span className="mt-0.5 text-honeycomb font-bold shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Submission */}
      <Card>
        <h2 className="font-display text-2xl font-bold text-atlantic-navy mb-3">
          {task.type === 'team' ? 'Team submission' : 'My submission'}
        </h2>

        {submission && !canSubmit && (
          <div className="mb-4 p-4 bg-powder/50 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-denim">Submitted link</p>
              {submission.status === 'submitted' && !editingLink && (
                <button
                  onClick={() => { setEditLinkValue(submission.drive_link); setEditingLink(true); setError('') }}
                  className="text-xs text-atlantic-navy hover:underline"
                >
                  Edit link
                </button>
              )}
            </div>
            {editingLink ? (
              <form onSubmit={saveEditedLink} className="space-y-2 mt-2">
                <input
                  autoFocus
                  type="url"
                  required
                  value={editLinkValue}
                  onChange={e => setEditLinkValue(e.target.value)}
                  className="input-field text-sm"
                  placeholder="https://drive.google.com/…"
                />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={savingLink}>{savingLink ? 'Saving…' : 'Save link'}</Button>
                  <button type="button" onClick={() => { setEditingLink(false); setError('') }}
                    className="text-sm text-denim hover:text-classic-navy px-3">Cancel</button>
                </div>
              </form>
            ) : (
              <a href={submission.drive_link} target="_blank" rel="noreferrer"
                className="text-atlantic-navy hover:underline break-all text-base">{submission.drive_link}</a>
            )}
          </div>
        )}

        {canSubmit ? (
          <form onSubmit={submitWork} className="space-y-4">
            {submission?.status === 'needs_rework' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-base text-red-700">
                This submission needs rework. Update your work and resubmit the link.
              </div>
            )}
            <div>
              <label className="eyebrow block mb-1.5">Google Drive link</label>
              <input
                type="url"
                required
                value={driveLink}
                onChange={e => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/…"
                className="input-field"
              />
              <p className="text-sm text-denim mt-1">Make sure the link is set to "Anyone with the link can view".</p>
            </div>
            {error && <p className="text-red-600 text-base">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : submission ? 'Resubmit' : 'Submit work'}
            </Button>
          </form>
        ) : (
          <p className="text-base text-denim">
            {submission.status === 'peer_approved' && '✅ Approved by a peer.'}
            {submission.status === 'coach_verified' && '🏅 Verified by the coach.'}
          </p>
        )}
      </Card>

      {/* Peer reviews */}
      {peerReviews.length > 0 && (
        <Card>
          <h2 className="font-display text-2xl font-bold text-atlantic-navy mb-3">Peer feedback</h2>
          <div className="space-y-4">
            {peerReviews.map(r => (
              <div key={r.id} className="border-l-4 border-powder pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={r.decision === 'approve' ? 'success' : 'danger'}>
                    {r.decision === 'approve' ? 'Approved' : 'Rework'}
                  </Badge>
                  <span className="text-sm text-denim">{r.students?.profiles?.full_name}</span>
                </div>
                {r.comment && <p className="text-base text-classic-navy mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Coach verification */}
      {coachVerification && (
        <Card>
          <h2 className="font-display text-2xl font-bold text-atlantic-navy mb-3">Coach verification</h2>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={coachVerification.decision === 'verify' ? 'honeycomb' : 'danger'}>
              {coachVerification.decision === 'verify' ? 'Verified ✓' : 'Needs rework'}
            </Badge>
          </div>
          {coachVerification.comment && (
            <p className="text-base text-classic-navy">{coachVerification.comment}</p>
          )}
        </Card>
      )}
    </div>
  )
}
