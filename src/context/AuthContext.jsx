import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// ── DEMO MODE ──────────────────────────────────────────────────
// Set to 'coach' or 'student' to bypass login and explore the UI.
// Set to null to re-enable real auth.
const DEMO_ROLE = 'coach'
// ───────────────────────────────────────────────────────────────

const DEMO_PROFILE = {
  id: 'demo-user',
  role: DEMO_ROLE,
  full_name: 'Goga (Demo)',
  email: 'gogaelisabeth21@gmail.com',
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (DEMO_ROLE) {
      setSession({ user: DEMO_PROFILE })
      setProfile(DEMO_PROFILE)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  const value = {
    session,
    profile,
    loading: session === undefined,
    isCoach: profile?.role === 'coach',
    isStudent: profile?.role === 'student',
    signOut: DEMO_ROLE ? () => {} : () => supabase.auth.signOut(),
    refreshProfile: () => session && !DEMO_ROLE && fetchProfile(session.user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
