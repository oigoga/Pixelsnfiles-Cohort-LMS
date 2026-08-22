import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { CoachDecisionForm } from '../../components/coach/CoachDecisionForm'

export default function VerificationQueue() {
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState([])
  const [verifying, setVerifying] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    // Submissions needing coach verification:
    // 1. Individual milestone tasks (peer_approved status, requires_coach_verification = true)
    // 2. Team deliverables (peer_group_id set, submitted/peer_approved status)
    const { data: subs } = await supabase
      .from('submissions')
      .select(`
        *,
        tasks(title, type, requires_coach_verification, modules(title, week_number)),
        students(profiles(full_name, email)),
        peer_groups(label)
      `)
      .in('status', ['submitted', 'peer_approved'])
      .order('submitted_at')

    // Filter to only those needing coach verification
    const filtered = (subs || []).filter(s => {
      const isTeam = !!s.peer_group_id
      const isMilestone = s.tasks?.requires_coach_verification
      return isTeam || isMilestone
    })

    // Exclude already verified
    const subIds = filtered.map(s => s.id)
    let verifiedIds = new Set()
    if (subIds.length) {
      const { data: verified } = await supabase
        .from('coach_verifications')
        .select('submission_id')
        .in('submission_id', subIds)
        .eq('decision', 'verify')
      verifiedIds = new Set(verified?.map(v => v.submission_id))
    }

    setQueue(filtered.filter(s => !verifiedIds.has(s.id)))
    setLoading(false)
  }

  function startVerify(sub) {
    setVerifying(sub)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="eyebrow">Coach</p>
        <h1 className="font-display text-3xl text-atlantic-navy mt-1">Verification Queue</h1>
        <p className="text-denim text-sm mt-1">Milestone tasks and team deliverables waiting for your sign-off.</p>
      </div>

      {queue.length === 0 && !verifying && (
        <Card>
          <p className="text-denim text-sm">Nothing awaiting verification. 🎉</p>
        </Card>
      )}

      {!verifying && queue.map(sub => (
        <Card key={sub.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant={sub.tasks?.type === 'team' ? 'honeycomb' : 'default'}>{sub.tasks?.type}</Badge>
                {sub.tasks?.requires_coach_verification && <Badge variant="info">Milestone</Badge>}
              </div>
              <p className="text-xs text-denim mb-0.5">
                Wk {sub.tasks?.modules?.week_number} · {sub.tasks?.modules?.title}
              </p>
              <p className="font-semibold text-classic-navy text-sm">{sub.tasks?.title}</p>
              <p className="text-xs text-denim mt-1">
                {sub.peer_groups?.label
                  ? `Team: ${sub.peer_groups.label}`
                  : sub.students?.profiles?.full_name || sub.students?.profiles?.email}
              </p>
            </div>
            <Button onClick={() => startVerify(sub)}>Review</Button>
          </div>
        </Card>
      ))}

      {verifying && (
        <CoachDecisionForm
          submission={verifying}
          onCancel={() => setVerifying(null)}
          onDone={async () => { setVerifying(null); await load() }}
        />
      )}
    </div>
  )
}
