'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { ShieldCheck } from 'lucide-react'

/**
 * Client-side validation for the login form. Mirrors what Supabase will
 * enforce server-side, but runs synchronously so the user gets a branded
 * inline error instead of the browser's native HTML5 validation tooltip
 * (which breaks the Tech Noir aesthetic).
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Identifier is required.' })
    .email({ message: 'Identifier must be a valid email address.' }),
  password: z.string().min(1, { message: 'Access code is required.' }),
})

/**
 * Map Supabase auth error messages to short, branded user-facing strings.
 *
 * Supabase returns network failures (placeholder URL, offline, DNS, etc)
 * as `{ error: { message: "Failed to fetch" } }`, not as a thrown
 * exception, so the same return path handles both bad-credentials and
 * service-unreachable failures.
 */
function mapAuthError(rawMessage: string): string {
  const m = rawMessage.toLowerCase()
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('network request failed')) {
    return 'Authentication service unreachable. Check your connection and retry.'
  }
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'Invalid credentials. Verify your identifier and access code.'
  }
  if (m.includes('email not confirmed')) {
    return 'Email not verified. Check your inbox for the confirmation link.'
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Wait a moment before retrying.'
  }
  return 'Authentication failed. Please try again.'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      })

      if (authError) {
        setError(mapAuthError(authError.message))
        setLoading(false)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError(mapAuthError(err instanceof Error ? err.message : 'unknown'))
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand badge above the card */}
        <div className="mb-7 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] border border-gold/30 bg-gold/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_26px_rgba(196,163,90,0.16)]">
            <span className="font-mono text-[15px] font-semibold uppercase tracking-[0.08em] text-gold">
              EA
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-[1.1rem] font-semibold uppercase tracking-[0.16em] text-[#E8E6E1]">
              EngineAI
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#888]">OS</span>
          </div>
        </div>

        {/* Login card — liquid-glass with gold accent bar */}
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[rgba(12,12,12,0.84)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.42)] md:p-10">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gold" />

          <div className="mb-8 text-center">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.34em] text-[#888]">
              Command Authorisation
            </p>
            <h1 className="text-2xl font-semibold leading-[1.1] tracking-[-0.02em] text-white">
              Executive credentials
              <span className="mt-1 block text-gold">required to proceed.</span>
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="login-email" className="block font-mono text-[10px] uppercase tracking-[0.24em] text-[#888]">
                Identifier &middot; email
              </label>
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
                className="w-full rounded-[1.1rem] border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 font-mono text-[13px] text-white placeholder:text-white/25 outline-none transition-all focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
                placeholder="operator@engineai.co.nz"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="login-password" className="block font-mono text-[10px] uppercase tracking-[0.24em] text-[#888]">
                Access code &middot; password
              </label>
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
                className="w-full rounded-[1.1rem] border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 font-mono text-[13px] text-white outline-none transition-all focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-[1.1rem] border border-signal-error/30 bg-signal-error/[0.06] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-signal-error"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold px-6 py-3.5 text-sm font-semibold tracking-[0.1em] text-black transition duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:brightness-100"
            >
              {loading ? 'Validating...' : 'Initialise Session'}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3 border-t border-white/[0.07] pt-6">
            <ShieldCheck size={13} className="shrink-0 text-signal-live" />
            <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-[#888]">
              Unauthorised access is strictly prohibited. All attempts are logged and audited via the Supervisor Agent.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
