import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const SESSION_KEY = 'pnf_session'

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading]  = useState(true)

  // On mount: restore session from localStorage (like VA Skills Map)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) setProfile(JSON.parse(raw))
    } catch (_) {}
    setLoading(false)
  }, [])

  async function signInWithCode(code) {
    const { data, error } = await supabase.rpc('login_with_code', {
      p_code: code.trim().toUpperCase(),
    })

    if (error || !data?.valid) {
      return { error: data?.error || 'Invalid access code. Check your code and try again.' }
    }

    const newProfile = {
      id:        data.id,
      code:      code.trim().toUpperCase(),
      full_name: data.full_name,
      email:     data.email,
      role:      data.role,
      cohort_id: data.cohort_id,
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(newProfile))
    setProfile(newProfile)
    return { error: null }
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY)
    setProfile(null)
  }

  // `session` is truthy when logged in — ProtectedRoute checks this
  const session = profile ? { user: profile } : null

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      isCoach:   profile?.role === 'coach',
      isStudent: profile?.role === 'student',
      signInWithCode,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
