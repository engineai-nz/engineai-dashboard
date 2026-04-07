'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError('Connection failure. Initialise retry.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1f2228] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1f2228] border border-white/10 p-8 rounded-none">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-light font-mono text-white tracking-tighter mb-2 uppercase">COMMAND AUTHORISATION</h1>
          <p className="text-xs font-mono uppercase text-white/40">Executive Credentials Required</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-xs font-mono uppercase text-white/40 block">Identifier (Email)</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              aria-invalid={error ? 'true' : 'false'}
              className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-gold/40 focus:ring-1 focus:ring-gold/20 outline-none transition-all font-mono text-sm rounded-none"
              placeholder="operator@engineai.co.nz"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-xs font-mono uppercase text-white/40 block">Access Code (Password)</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
              aria-invalid={error ? 'true' : 'false'}
              className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-gold/40 focus:ring-1 focus:ring-gold/20 outline-none transition-all font-mono text-sm rounded-none"
            />
          </div>

          {error && (
            <div role="alert" className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono uppercase rounded-none">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-background font-mono font-light py-3 uppercase tracking-[0.1em] hover:bg-gold/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-none"
          >
            {loading ? 'Validating...' : 'Initialise Session'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[10px] font-mono uppercase text-white/20 leading-relaxed">
            Unauthorised access is strictly prohibited. All attempts are logged and audited via the Supervisor Agent.
          </p>
        </div>
      </div>
    </div>
  )
}
