import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const SESSION_KEY = 'pnf_session'

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading]  = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) setProfile(JSON.parse(raw))
    } catch (_) {}
    setLoading(false)
  }, [])

  // New student: name + email → generates code → saves profile
  async function createStudentCode(name, email, code) {
    const { data, error } = await supabase.rpc('create_student_code', {
      p_name:  name.trim(),
      p_email: email.trim().toLowerCase(),
      p_code:  code,
    })
    if (error || !data?.success) {
      return { error: data?.error || 'Something went wrong. Please try again.' }
    }
    const newProfile = {
      id:        data.id,
      code:      data.code,
      full_name: data.full_name,
      email:     data.email,
      role:      data.role,
      cohort_id: data.cohort_id,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(newProfile))
    setProfile(newProfile)
    return { error: null, code: data.code }
  }

  // Returning user: enter existing code
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

  const session = profile ? { user: profile } : null

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      isCoach:           profile?.role === 'coach',
      isStudent:         profile?.role === 'student',
      createStudentCode,
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
