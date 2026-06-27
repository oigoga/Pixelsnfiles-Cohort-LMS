import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/Spinner'

export default function StudentDetail() {
  const { studentId } = useParams()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => { load() }, [studentId])

  async function load() {
    const { data: stu } = await supabase
      .from('students')
      .select('*, profiles(*), peer_groups(label), cohorts(name, current_week)')
      .eq('id', studentId)
      .single()
    setStudent(stu)

    const { data: subs } = await supabase
      .from('submissions')
      .select('*, tasks(title, type, requires_coach_verification, modules(title, week_number))')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false })
    setSubmissions(subs || [])

    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
  if (!student) return <p className="text-denim">Student not found.</p>

  const approvedCount = submissions.filter(s => ['peer_approved', 'coach_verified'].includes(s.status)).length
  const reworkCount = submissions.filter(s => s.status === 'needs_rework').length

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link to="/coach/overview" className="text-sm text-denim hover:text-atlantic-navy">← Overview Board</Link>
        <h1 className="font-display text-3xl text-atlantic-navy mt-3">
          {student.profiles?.full_name || student.profiles?.email}
        </h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="info">{student.cohorts?.name}</Badge>
          {student.peer_groups && <Badge variant="honeycomb">{student.peer_groups.label}</Badge>}
          <Badge variant={student.status === 'active' ? 'success' : 'default'}>{student.status}</Badge>
        </div>
        <p className="text-sm text-denim mt-1">{student.profiles?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center py-4">
          <div className="font-display text-3xl text-atlantic-navy">{submissions.length}</div>
          <p className="text-xs text-denim mt-1">Submissions</p>
        </Card>
        <Card className="text-center py-4">
          <div className="font-display text-3xl text-green-700">{approvedCount}</div>
          <p className="text-xs text-denim mt-1">Approved</p>
        </Card>
        <Card className="text-center py-4">
          <div className="font-display text-3xl text-red-600">{reworkCount}</div>
          <p className="text-xs text-denim mt-1">Need rework</p>
        </Card>
      </div>

      {/* Submission history */}
      <Card>
        <h2 className="font-display text-xl text-atlantic-navy mb-4">Submission history</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-denim">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.map(sub => (
              <div key={sub.id} className="flex items-start justify-between gap-4 py-3 border-b border-powder/50">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-1">
                    <Badge variant={sub.tasks?.type === 'team' ? 'honeycomb' : 'default'}>{sub.tasks?.type}</Badge>
                    {sub.tasks?.requires_coach_verification && <Badge variant="info">Milestone</Badge>}
                  </div>
                  <p className="text-sm font-medium text-classic-navy">{sub.tasks?.title}</p>
                  <p className="text-xs text-denim mt-0.5">
                    Wk {sub.tasks?.modules?.week_number} · {sub.tasks?.modules?.title}
                  </p>
                  <a
                    href={sub.drive_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-atlantic-navy underline mt-1 block"
                  >
                    View work →
                  </a>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={sub.status} />
                  <span className="text-xs text-denim">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Coach notes */}
      <Card>
        <h2 className="font-display text-xl text-atlantic-navy mb-3">Private coach notes</h2>
        <p className="text-xs text-denim mb-3">Only visible to you.</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          placeholder="Notes about this student's progress, context, concerns…"
          className="input-field resize-y w-full"
        />
        <Button
          className="mt-3"
          variant="secondary"
          disabled={savingNotes}
          onClick={async () => {
            setSavingNotes(true)
            // Store in localStorage keyed by studentId (Phase 2: move to DB)
            localStorage.setItem(`coach_notes_${studentId}`, notes)
            setTimeout(() => setSavingNotes(false), 500)
          }}
        >
          {savingNotes ? 'Saved' : 'Save notes'}
        </Button>
      </Card>
    </div>
  )
}
