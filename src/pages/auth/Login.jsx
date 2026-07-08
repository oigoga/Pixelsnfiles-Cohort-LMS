import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Generates a personal code: first 5 letters of name + 4 digits
// e.g. "Sarah Jones" → SARAH-4829
function generateCode(name) {
  const prefix = name.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'PNF'
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${suffix}`
}

export default function Login() {
  const { session, profile, createStudentCode, signInWithCode } = useAuth()
  const [tab, setTab] = useState('new') // 'new' | 'returning'

  // New-student state
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [codeReady, setCodeReady] = useState(false)
  const [copied, setCopied] = useState(false)

  // Returning-student state
  const [returnCode, setReturnCode] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Already signed in → redirect
  if (session) {
    const dest = profile?.role === 'coach' ? '/coach/overview' : '/student/dashboard'
    return <Navigate to={dest} replace />
  }

  // ── New student: step 1 — generate the code ──────────────
  async function handleGenerate(e) {
    e.preventDefault()
    setError('')
    const code = generateCode(name)
    setGeneratedCode(code)
    setCodeReady(true)
  }

  // ── New student: step 2 — enter the platform ─────────────
  async function handleCreate() {
    setError('')
    setLoading(true)
    // Try with generated code; if clash, regenerate once
    let code = generatedCode
    let result = await createStudentCode(name, email, code)
    if (result.error?.includes('clash')) {
      code = generateCode(name)
      setGeneratedCode(code)
      result = await createStudentCode(name, email, code)
    }
    setLoading(false)
    if (result.error) setError(result.error)
    // On success, AuthContext profile updates → Navigate above fires
  }

  // ── Returning student ─────────────────────────────────────
  async function handleReturn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signInWithCode(returnCode)
    setLoading(false)
    if (err) setError(err)
  }

  async function copyCode() {
    await navigator.clipboard.writeText(generatedCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-3xl font-sans font-bold tracking-[-0.04em] text-atlantic-navy mb-1">
            pixelsn<span className="text-honeycomb">f</span>iles<span className="text-honeycomb">.</span>
          </div>
          <p className="eyebrow mt-2">cohort learning platform</p>
        </div>

        <div className="bg-white rounded-2xl border border-powder shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-powder">
            <button
              onClick={() => { setTab('new'); setError(''); setCodeReady(false) }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === 'new'
                  ? 'text-atlantic-navy border-b-2 border-atlantic-navy bg-white'
                  : 'text-denim bg-powder/30 hover:bg-powder/60'
              }`}
            >
              I'm new here
            </button>
            <button
              onClick={() => { setTab('returning'); setError('') }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === 'returning'
                  ? 'text-atlantic-navy border-b-2 border-atlantic-navy bg-white'
                  : 'text-denim bg-powder/30 hover:bg-powder/60'
              }`}
            >
              I have a code
            </button>
          </div>

          <div className="p-8">

            {/* ── NEW STUDENT ───────────────────────────────── */}
            {tab === 'new' && !codeReady && (
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <h2 className="font-display text-2xl text-atlantic-navy mb-1">Welcome</h2>
                  <p className="text-denim text-sm mb-5">
                    Enter your details and we'll generate your personal access code.
                  </p>
                </div>
                <div>
                  <label className="eyebrow block mb-1.5">Your first name</label>
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Sarah"
                    className="w-full px-4 py-3 rounded-xl border border-powder bg-white text-classic-navy
                               placeholder-denim/40 focus:outline-none focus:ring-2 focus:ring-atlantic-navy/30 text-sm"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1.5">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-powder bg-white text-classic-navy
                               placeholder-denim/40 focus:outline-none focus:ring-2 focus:ring-atlantic-navy/30 text-sm"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!name.trim() || !email.trim()}
                  className="w-full bg-atlantic-navy text-white font-medium py-3 px-6 rounded-xl
                             hover:bg-classic-navy transition-colors text-sm disabled:opacity-40"
                >
                  Generate my code →
                </button>
              </form>
            )}

            {/* ── NEW STUDENT: code reveal ───────────────────── */}
            {tab === 'new' && codeReady && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl text-atlantic-navy mb-1">Your personal code</h2>
                  <p className="text-denim text-sm">
                    This is your login for every session. Save it somewhere safe — your phone notes, a screenshot, or copy it now.
                  </p>
                </div>

                {/* Code display */}
                <div className="bg-teal-50 border-2 border-dashed border-teal-300 rounded-2xl p-6 text-center">
                  <p className="eyebrow mb-2">Your code</p>
                  <div className="font-mono text-3xl font-bold text-atlantic-navy tracking-widest mb-4">
                    {generatedCode}
                  </div>
                  <button
                    onClick={copyCode}
                    className="px-5 py-2 rounded-lg border-2 border-atlantic-navy text-atlantic-navy
                               text-sm font-semibold hover:bg-atlantic-navy hover:text-white transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy code'}
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  ⚠️ You'll need this code every time you log in. There's no way to recover it if you lose it.
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full bg-atlantic-navy text-white font-medium py-3 px-6 rounded-xl
                             hover:bg-classic-navy transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Setting up your account…' : "I've saved it — enter the platform →"}
                </button>

                <button
                  onClick={() => setCodeReady(false)}
                  className="w-full text-denim text-xs underline underline-offset-2 hover:text-classic-navy"
                >
                  ← Go back
                </button>
              </div>
            )}

            {/* ── RETURNING STUDENT ─────────────────────────── */}
            {tab === 'returning' && (
              <form onSubmit={handleReturn} className="space-y-4">
                <div>
                  <h2 className="font-display text-2xl text-atlantic-navy mb-1">Welcome back</h2>
                  <p className="text-denim text-sm mb-5">
                    Enter your personal code to pick up where you left off.
                  </p>
                </div>
                <div>
                  <label className="eyebrow block mb-1.5">Your access code</label>
                  <input
                    type="text"
                    required
                    value={returnCode}
                    onChange={e => setReturnCode(e.target.value.toUpperCase())}
                    placeholder="SARAH-4829"
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
                  disabled={loading || returnCode.trim().length < 4}
                  className="w-full bg-atlantic-navy text-white font-medium py-3 px-6 rounded-xl
                             hover:bg-classic-navy transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Checking…' : 'Enter platform →'}
                </button>
                <p className="text-center text-xs text-denim">
                  Lost your code? Contact your coach.
                </p>
              </form>
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
