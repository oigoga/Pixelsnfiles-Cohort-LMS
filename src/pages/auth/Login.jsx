import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Logo } from '../../components/ui/Logo'

export default function Login() {
  const { session, profile, signInWithCode } = useAuth()
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  if (session) {
    const dest = profile?.role === 'coach' ? '/coach/overview' : '/student/dashboard'
    return <Navigate to={dest} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signInWithCode(code)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <Logo size="xl" theme="dark" />
          <p className="eyebrow mt-2">cohort learning platform</p>
        </div>

        <div className="bg-white rounded-2xl border border-powder shadow-sm p-8">
          <h2 className="font-display text-2xl text-atlantic-navy mb-1">Welcome</h2>
          <p className="text-denim text-sm mb-6">
            Enter the access code your coach sent you.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="eyebrow block mb-1.5">Access code</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="PNF-ABCDEF"
                autoComplete="off"
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
              disabled={loading || code.trim().length < 4}
              className="w-full bg-atlantic-navy text-white font-medium py-3 px-6 rounded-xl
                         hover:bg-classic-navy transition-colors text-sm disabled:opacity-50"
            >
              {loading ? 'Checking…' : 'Enter platform →'}
            </button>

            <p className="text-center text-xs text-denim">
              Don't have a code? Contact your coach.
            </p>
          </form>
        </div>

        <p className="text-center text-denim text-xs mt-6">
          PixelsnFiles © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
