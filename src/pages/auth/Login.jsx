import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { session, profile } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Already signed in → go to dashboard
  if (session) {
    const dest = profile?.role === 'coach' ? '/coach/overview' : '/student/dashboard'
    return <Navigate to={dest} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const trimmed = code.trim().toUpperCase()

    // 1. Validate the code server-side
    const { data: result, error: rpcError } = await supabase.rpc('validate_access_code', {
      p_code: trimmed,
    })

    if (rpcError || !result?.valid) {
      setError(result?.error || 'Invalid access code. Check your code and try again.')
      setLoading(false)
      return
    }

    const { email, full_name, role } = result

    // 2. Try signing in (returning user)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: trimmed,
    })

    if (!signInError) {
      // Existing user — enrol in cohort if student (idempotent)
      const { data: { user } } = await supabase.auth.getUser()
      if (role === 'student' && user) {
        await supabase.rpc('enroll_with_code', { p_code: trimmed, p_profile_id: user.id })
      }
      setLoading(false)
      return
    }

    // 3. New user — sign up (no email confirmation needed; disable it in Supabase)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: trimmed,
      options: {
        data: { full_name, role },
        emailRedirectTo: undefined,
      },
    })

    if (signUpError) {
      setError(signUpError.message || 'Could not create your account. Contact your coach.')
      setLoading(false)
      return
    }

    // Auto-enrol student in cohort
    if (role === 'student' && signUpData?.user) {
      await supabase.rpc('enroll_with_code', { p_code: trimmed, p_profile_id: signUpData.user.id })
    }

    setLoading(false)
    // AuthContext picks up the new session via onAuthStateChange
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-3xl font-sans font-bold tracking-[-0.04em] text-atlantic-navy mb-1">
            pixelsn<span className="text-honeycomb">f</span>iles<span className="text-honeycomb">.</span>
          </div>
          <p className="eyebrow mt-2">cohort learning platform</p>
        </div>

        <div className="bg-white rounded-2xl border border-powder shadow-sm p-8">
          <h1 className="font-display text-3xl text-atlantic-navy mb-1">Enter your code</h1>
          <p className="text-denim text-sm mb-6">
            You received an access code when you enrolled. Enter it below to get in.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="eyebrow block mb-1.5">Access code</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="PNF-XXXXX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="w-full px-4 py-3 rounded-xl border border-powder bg-white text-classic-navy
                           placeholder-denim/40 focus:outline-none focus:ring-2 focus:ring-atlantic-navy/30
                           text-sm font-mono tracking-widest text-center"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.trim().length < 3}
              className="w-full bg-atlantic-navy text-white font-medium py-3 px-6 rounded-xl
                         hover:bg-classic-navy transition-colors text-sm disabled:opacity-50"
            >
              {loading ? 'Checking…' : 'Enter platform'}
            </button>
          </form>

          <p className="text-center text-xs text-denim mt-5">
            Don't have a code? Your code is sent by the coach when you enrol.
          </p>
        </div>

        <p className="text-center text-denim text-xs mt-6">
          PixelsnFiles © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
