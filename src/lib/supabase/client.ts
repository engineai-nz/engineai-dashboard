/**
 * Supabase browser client (Phase 1a).
 *
 * Used from client components only. Public env vars (NEXT_PUBLIC_*).
 * Lazy-throws on first call when env vars are missing.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (_browserClient) return _browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      '[supabase/client] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'See .env.local.example.',
    );
  }
  _browserClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return _browserClient;
}
