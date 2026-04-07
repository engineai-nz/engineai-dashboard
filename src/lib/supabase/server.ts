/**
 * Supabase server client (Phase 1a).
 *
 * Lazy-throws on first call when env vars are missing. Never throws at import
 * time — that breaks Next.js builds. The decisions doc forbids no-op stubs;
 * if the env isn't configured, callers find out the moment they try to use it.
 *
 * Two clients are exported:
 *   - getSupabaseServerClient(): anon-key client for RLS-bound reads
 *   - getSupabaseServiceClient(): service-role client for write paths,
 *     wrapped by sealed-envelope tools in src/lib/agents/tools/
 *
 * Agents NEVER import this file directly. They go through the tool wrappers.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _serverClient: SupabaseClient | null = null;
let _serviceClient: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[supabase] Missing required env var: ${name}. ` +
        `See .env.local.example for the Phase 1a env contract.`,
    );
  }
  return value;
}

export function getSupabaseServerClient(): SupabaseClient {
  if (_serverClient) return _serverClient;
  const url = requireEnv('SUPABASE_URL');
  const anonKey = requireEnv('SUPABASE_ANON_KEY');
  _serverClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return _serverClient;
}

export function getSupabaseServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;
  const url = requireEnv('SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  _serviceClient = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  return _serviceClient;
}
