import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNoOpSupabaseClient } from './supabase-noop'

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // No env vars => return a true no-op client. See supabase-noop.ts
    // for the rationale (kills the placeholder.supabase.co fetch
    // spam that the old fallback caused).
    return createNoOpSupabaseClient()
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
