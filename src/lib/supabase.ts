import { createBrowserClient } from '@supabase/ssr'
import { createNoOpSupabaseClient } from './supabase-noop'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // No env vars => return a true no-op client. This avoids the
    // ERR_NAME_NOT_RESOLVED spam from the previous fallback that
    // pointed at the literal URL `https://placeholder.supabase.co`.
    // In production these env vars MUST be set.
    return createNoOpSupabaseClient()
  }

  return createBrowserClient(url, key)
}
