import { Badge } from './Badge'

const statusConfig = {
  not_started:    { label: 'Not started',     variant: 'default' },
  submitted:      { label: 'Submitted',        variant: 'info' },
  peer_approved:  { label: 'Peer approved',    variant: 'success' },
  needs_rework:   { label: 'Needs rework',     variant: 'danger' },
  coach_verified: { label: 'Coach verified',   variant: 'honeycomb' },
}

export function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, variant: 'default' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
