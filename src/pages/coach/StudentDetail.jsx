import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useStudentNotes } from '../../hooks/useStudentNotes'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/Spinner'

export default function StudentDetail() {
  const { studentId } = useParams()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [studentCodes, setStudentCodes] = useState([])
  const notesEndRef = useRef(null)
  const { messages: notes, chatError: notesError, newMsg: noteText, setNewMsg: setNoteText, sending: sendingNote, sendMessage: sendNote } = useStudentNotes(studentId)

  useEffect(() => { load() }, [studentId])

  useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notes])

  async function load() {
    // Both queries only depend on studentId, not on each other.
    const [{ data: stu }, { data: subs }] = await Promise.all([
      supabase
        .from('students')
        .select('*, profiles(*), peer_groups(label), cohorts(name, current_week)')
        .eq('id', studentId)
        .single(),
      supabase
        .from('submissions')
        .select('*, tasks(title, type, requires_coach_verification, modules(title, week_number))')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false }),
    ])
    setStudent(stu)
    setSubmissions(subs || [])

    // All access codes tied to this email — more than one means a duplicate signup.
    if (stu?.profiles?.email) {
      const { data: codes } = await supabase
        .from('access_codes')
        .select('code, created_at')
        .ilike('email', stu.profiles.email)
        .order('created_at')
      setStudentCodes(codes || [])
    }

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
        {studentCodes.length > 0 && (
          <p className="text-xs mt-2 flex items-center flex-wrap gap-2">
            <span className="text-denim">Access code{studentCodes.length > 1 ? 's' : ''}:</span>
            <span className="font-mono tracking-widest">{studentCodes.map(c => c.code).join(', ')}</span>
            {studentCodes.length > 1 && (
              <Badge variant="danger">⚠ {studentCodes.length} accounts — likely a duplicate signup</Badge>
            )}
          </p>
        )}
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

      {/* Private notes — just this coach and this student */}
      <Card>
        <h2 className="font-display text-xl text-atlantic-navy mb-1">Private notes</h2>
        <p className="text-xs text-denim mb-3">Just between you and {student.profiles?.full_name || 'this student'} — no one else sees this.</p>
        {notesError && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{notesError}</div>
        )}
        <div className="h-64 overflow-y-auto space-y-3 mb-4 pr-1">
          {notes.length === 0 && (
            <p className="text-sm text-denim text-center py-8">No notes yet. Say something to get started.</p>
          )}
          {notes.map(msg => {
            const isMe = msg.author_id === profile.id
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <p className={`text-xs text-denim mb-1 ${isMe ? 'text-right' : ''}`}>
                  {isMe ? 'You' : (msg.profiles?.full_name || 'Student')}
                  {' · '}
                  {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-atlantic-navy text-soft-butter rounded-tr-sm'
                    : 'bg-powder/60 text-classic-navy rounded-tl-sm'
                }`}>
                  {msg.body}
                </div>
              </div>
            )
          })}
          <div ref={notesEndRef} />
        </div>
        <form onSubmit={e => sendNote(e, profile.id)} className="flex gap-3">
          <input
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Write a note…"
            className="input-field flex-1 text-sm"
            maxLength={2000}
          />
          <Button type="submit" disabled={sendingNote || !noteText.trim()}>
            {sendingNote ? '…' : 'Send'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
