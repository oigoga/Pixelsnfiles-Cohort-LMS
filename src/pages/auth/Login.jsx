import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (error) setError(error.message || error.status || JSON.stringify(error))
    else setSent(true)
  }

  return (
    <div className="min-h-screen bg-soft-butter flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-3xl font-sans font-bold tracking-[-0.04em] text-atlantic-navy mb-1">
            pixelsn<span className="text-honeycomb">f</span>iles<span className="text-honeycomb">.</span>
          </div>
          <p className="eyebrow mt-2">cohort learning platform</p>
        </div>

        <div className="bg-whipped-cream rounded-2xl p-8 shadow-sm border border-powder">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✉️</div>
              <h2 className="font-display text-2xl text-atlantic-navy mb-2">Check your email</h2>
              <p className="text-denim text-sm leading-relaxed">
                We sent a magic link to <strong className="text-classic-navy">{email}</strong>.
                Click it to sign in — no password needed.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm text-denim underline underline-offset-2"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl text-atlantic-navy mb-1">Welcome back</h1>
              <p className="text-denim text-sm mb-6">Enter your email to receive a sign-in link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="eyebrow block mb-1.5">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-powder bg-soft-butter text-classic-navy placeholder-denim/50 focus:outline-none focus:ring-2 focus:ring-atlantic-navy/30 text-sm"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-atlantic-navy text-soft-butter font-medium py-3 px-6 rounded-xl hover:bg-classic-navy transition-colors text-sm disabled:opacity-60"
                >
                  {loading ? 'Sending…' : 'Send magic link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-denim text-xs mt-6">
          PixelsnFiles © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
