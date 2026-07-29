import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Logo } from '../../components/ui/Logo'

function genCode(fullName) {
  const first = (fullName || '').trim().split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, '') || 'STUDENT'
  const digits = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `${first}-${digits}`
}

export default function Login() {
  const { session, profile, signInWithCode, createStudentCode } = useAuth()
  const [tab, setTab] = useState('new') // 'new' | 'code'

  // New student
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [creating, setCreating] = useState(false)
  const [newError, setNewError] = useState('')
  const [created, setCreated]   = useState(null)

  // Returning student
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  if (session) {
    const dest = profile?.role === 'coach' ? '/coach/overview' : '/student/dashboard'
    return <Navigate to={dest} replace />
  }

  async function handleNew(e) {
    e.preventDefault()
    setNewError('')
    setCreating(true)
    // Try name-based code; if there's a clash (same digits), retry with new digits
    let newCode = genCode(name)
    let result = await createStudentCode(name, email, newCode)
    if (result.error && result.error.toLowerCase().includes('clash')) {
      newCode = genCode(name)
      result = await createStudentCode(name, email, newCode)
    }
    setCreating(false)
    if (result.error) setNewError(result.error)
    else setCreated({ code: result.code })
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signInWithCode(code)
    setLoading(false)
    if (err) setError(err)
  }

  const inputCls = `w-full px-4 py-3 rounded-xl border border-powder bg-white text-classic-navy
    placeholder-denim/40 focus:outline-none focus:ring-2 focus:ring-atlantic-navy/30 text-sm`
  const btnCls = `w-full bg-atlantic-navy text-white font-medium py-3 px-6 rounded-xl
    hover:bg-classic-navy transition-colors text-sm disabled:opacity-50`

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <Logo size="xl" theme="dark" />
          <p className="eyebrow mt-2">cohort learning platform</p>
        </div>

        <div className="bg-white rounded-2xl border border-powder shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-powder">
            {[
              { key: 'new',  label: "I'm new here" },
              { key: 'code', label: 'I have a code' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-atlantic-navy text-soft-butter'
                    : 'text-denim hover:text-classic-navy'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-8">

            {/* ── New student ── */}
            {tab === 'new' && (
              created ? (
                <div className="text-center space-y-4">
                  <p className="font-display text-2xl text-atlantic-navy">You're in! 🎉</p>
                  <p className="text-denim text-sm">
                    Save your access code — you'll need it every time you log in.
                  </p>
                  <div className="bg-powder/60 rounded-xl py-4 px-6 font-mono text-2xl tracking-widest text-classic-navy font-bold">
                    {created.code}
                  </div>
                  <p className="text-xs text-denim">
                    Screenshot or copy this now. You won't see it again after leaving this page.
                  </p>
                  <button
                    onClick={() => { setTab('code'); setCode(created.code) }}
                    className={btnCls}
                  >
                    Continue to platform →
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl text-atlantic-navy mb-1">Join the cohort</h2>
                  <p className="text-denim text-sm mb-6">Create your account to get started.</p>
                  <form onSubmit={handleNew} className="space-y-4">
                    <div>
                      <label className="eyebrow block mb-1.5">Full name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ada Lovelace"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="eyebrow block mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="ada@example.com"
                        className={inputCls}
                      />
                    </div>
                    {newError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                        {newError}
                      </div>
                    )}
                    <button type="submit" disabled={creating} className={btnCls}>
                      {creating ? 'Creating account…' : 'Create account →'}
                    </button>
                  </form>
                </>
              )
            )}

            {/* ── Returning student / coach ── */}
            {tab === 'code' && (
              <>
                <h2 className="font-display text-2xl text-atlantic-navy mb-1">Welcome back</h2>
                <p className="text-denim text-sm mb-6">Enter your access code to continue.</p>
                <form onSubmit={handleSignIn} className="space-y-4">
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
                      className={`${inputCls} font-mono tracking-widest text-center`}
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
                    className={btnCls}
                  >
                    {loading ? 'Checking…' : 'Enter platform →'}
                  </button>
                  <p className="text-center text-xs text-denim">
                    Lost your code? Contact your coach.
                  </p>
                </form>
              </>
            )}

          </div>
        </div>

        <p className="text-center text-denim text-xs mt-6">
          PixelsnFiles © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
