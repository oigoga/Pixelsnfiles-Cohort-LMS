import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/Spinner'

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

  useEffect(() => { if (profile) load() }, [taskId, profile])

  async function load() {
    const { data: t } = await supabase
      .from('tasks')
      .select('*, modules(id, title, week_number, cohort_id)')
      .eq('id', taskId)
      .single()
    setTask(t)

    const { data: stu } = await supabase
      .from('students')
      .select('id, peer_group_id')
      .eq('profile_id', profile.id)
      .single()
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
        // Peer reviews
        const { data: reviews } = await supabase
          .from('peer_reviews')
          .select('*, students(profiles(full_name))')
          .eq('submission_id', sub.id)
        setPeerReviews(reviews || [])

        // Coach verification
        const { data: cv } = await supabase
          .from('coach_verifications')
          .select('*')
          .eq('submission_id', sub.id)
          .single()
        setCoachVerification(cv)
      }
    }

    setLoading(false)
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link to={`/student/module/${mod?.id}`} className="text-sm text-denim hover:text-atlantic-navy">
          ← {mod?.title || 'Module'}
        </Link>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant={task.type === 'team' ? 'honeycomb' : 'default'}>{task.type}</Badge>
          {task.requires_coach_verification && <Badge variant="info">Milestone</Badge>}
          {submission && <StatusBadge status={submission.status} />}
        </div>
        <h1 className="font-display text-3xl text-atlantic-navy mt-2">{task.title}</h1>
        {task.due_date && <p className="text-sm text-denim mt-1">Due {task.due_date}</p>}
      </div>

      {/* Instructions */}
      <Card>
        <h2 className="font-display text-xl text-atlantic-navy mb-3">Instructions</h2>
        <p className="text-denim text-sm leading-relaxed whitespace-pre-line">{task.instructions}</p>
      </Card>

      {/* Definition of done */}
      {task.definition_of_done?.length > 0 && (
        <Card>
          <h2 className="font-display text-xl text-atlantic-navy mb-3">Definition of done</h2>
          <ul className="space-y-2">
            {task.definition_of_done.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-denim">
                <span className="mt-0.5 text-honeycomb font-bold">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Submission */}
      <Card>
        <h2 className="font-display text-xl text-atlantic-navy mb-3">
          {task.type === 'team' ? 'Team submission' : 'My submission'}
        </h2>

        {submission && !canSubmit && (
          <div className="mb-4 p-3 bg-powder/50 rounded-xl text-sm">
            <p className="text-denim">Submitted link:</p>
            <a href={submission.drive_link} target="_blank" rel="noreferrer" className="text-atlantic-navy hover:underline break-all">{submission.drive_link}</a>
          </div>
        )}

        {canSubmit ? (
          <form onSubmit={submitWork} className="space-y-4">
            {submission?.status === 'needs_rework' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
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
              <p className="text-xs text-denim mt-1">Make sure the link is set to "Anyone with the link can view".</p>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : submission ? 'Resubmit' : 'Submit work'}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-denim">
            {submission.status === 'peer_approved' && '✅ Approved by a peer.'}
            {submission.status === 'coach_verified' && '🏅 Verified by the coach.'}
          </p>
        )}
      </Card>

      {/* Peer reviews */}
      {peerReviews.length > 0 && (
        <Card>
          <h2 className="font-display text-xl text-atlantic-navy mb-3">Peer feedback</h2>
          <div className="space-y-4">
            {peerReviews.map(r => (
              <div key={r.id} className="border-l-4 border-powder pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={r.decision === 'approve' ? 'success' : 'danger'}>
                    {r.decision === 'approve' ? 'Approved' : 'Rework'}
                  </Badge>
                  <span className="text-xs text-denim">{r.students?.profiles?.full_name}</span>
                </div>
                {r.comment && <p className="text-sm text-denim mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Coach verification */}
      {coachVerification && (
        <Card>
          <h2 className="font-display text-xl text-atlantic-navy mb-3">Coach verification</h2>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={coachVerification.decision === 'verify' ? 'honeycomb' : 'danger'}>
              {coachVerification.decision === 'verify' ? 'Verified ✓' : 'Needs rework'}
            </Badge>
          </div>
          {coachVerification.comment && (
            <p className="text-sm text-denim">{coachVerification.comment}</p>
          )}
        </Card>
      )}
    </div>
  )
}
