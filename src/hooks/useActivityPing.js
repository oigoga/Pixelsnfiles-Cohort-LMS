import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const PING_INTERVAL_MS = 60_000

// Records a heartbeat roughly once a minute while the tab is open and
// visible (paused when backgrounded), so time-on-platform can be
// estimated later from the gaps between pings.
export function useActivityPing(profileId, cohortId) {
  useEffect(() => {
    if (!profileId) return

    function ping() {
      if (document.visibilityState !== 'visible') return
      supabase.from('activity_pings').insert({ profile_id: profileId, cohort_id: cohortId || null })
    }

    ping()
    const interval = setInterval(ping, PING_INTERVAL_MS)

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') ping()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [profileId, cohortId])
}
