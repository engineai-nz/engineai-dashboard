/**
 * No-op Supabase client used when NEXT_PUBLIC_SUPABASE_URL /
 * NEXT_PUBLIC_SUPABASE_ANON_KEY are not set (dev / preview / build).
 *
 * Why this exists:
 * Previously, src/lib/supabase.ts and src/lib/supabase-server.ts
 * fell back to a real Supabase client pointed at the literal URL
 * `https://placeholder.supabase.co`. Any consumer that called
 * `.from('table').select()` or `.auth.getUser()` against that stub
 * would trigger an actual fetch to that domain, fail with
 * `ERR_NAME_NOT_RESOLVED`, and spam the dev console with errors on
 * every page load. This file replaces that with a true no-op.
 *
 * Behaviour:
 * - All query-builder methods (.from / .select / .eq / .order / ...)
 *   return the same chainable proxy object
 * - Awaiting the chain resolves to `{ data: [], error: null }`
 * - `.single()` / `.maybeSingle()` resolve to `{ data: null, error: null }`
 * - `.auth.*` returns sensible empty/null shapes; signInWithPassword
 *   returns a clear configuration error so the login UI surfaces it
 *   via the existing branded error mapper
 * - Realtime channels and storage are stubbed to inert objects
 *
 * In production, NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * MUST be set. This stub is a dev convenience, not a production code path.
 *
 * Type-wise we cast to `any` at the boundary because matching the full
 * SupabaseClient type would dwarf the file. The cast is local and clearly
 * documented as a stub.
 */

const NOOP_DATA = { data: [], error: null } as const
const NOOP_SINGLE = { data: null, error: null } as const

/**
 * A query builder that's chainable AND awaitable. Mirrors the
 * PostgrestFilterBuilder thenable pattern Supabase uses internally.
 */
function createNoOpQueryBuilder() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    // Mutators / sources
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    delete: () => builder,
    // Filters
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    gte: () => builder,
    lt: () => builder,
    lte: () => builder,
    like: () => builder,
    ilike: () => builder,
    is: () => builder,
    in: () => builder,
    contains: () => builder,
    containedBy: () => builder,
    match: () => builder,
    not: () => builder,
    or: () => builder,
    filter: () => builder,
    // Modifiers
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    abortSignal: () => builder,
    // Terminal accessors
    single: () => Promise.resolve(NOOP_SINGLE),
    maybeSingle: () => Promise.resolve(NOOP_SINGLE),
    csv: () => Promise.resolve({ data: '', error: null }),
    // Awaitable: `await supabase.from('x').select()` resolves to NOOP_DATA
    then: (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onfulfilled?: ((value: typeof NOOP_DATA) => any) | null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onrejected?: ((reason: unknown) => any) | null,
    ) => Promise.resolve(NOOP_DATA).then(onfulfilled, onrejected),
    catch: (onrejected: ((reason: unknown) => unknown) | null) =>
      Promise.resolve(NOOP_DATA).catch(onrejected),
    finally: (onfinally: (() => void) | null) =>
      Promise.resolve(NOOP_DATA).finally(onfinally),
  }
  return builder
}

const NOOP_AUTH_ERROR = {
  name: 'AuthApiError',
  message:
    'Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable.',
  status: 503,
}

const noOpAuth = {
  signInWithPassword: () =>
    Promise.resolve({ data: { user: null, session: null }, error: NOOP_AUTH_ERROR }),
  signInWithOAuth: () =>
    Promise.resolve({ data: { provider: 'noop', url: null }, error: NOOP_AUTH_ERROR }),
  signUp: () =>
    Promise.resolve({ data: { user: null, session: null }, error: NOOP_AUTH_ERROR }),
  signOut: () => Promise.resolve({ error: null }),
  getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  getSession: () => Promise.resolve({ data: { session: null }, error: null }),
  refreshSession: () =>
    Promise.resolve({ data: { user: null, session: null }, error: null }),
  onAuthStateChange: () => ({
    data: { subscription: { unsubscribe: () => undefined } },
  }),
  exchangeCodeForSession: () =>
    Promise.resolve({ data: { user: null, session: null }, error: NOOP_AUTH_ERROR }),
}

const noOpChannel = {
  on: () => noOpChannel,
  subscribe: () => noOpChannel,
  unsubscribe: () => Promise.resolve('ok' as const),
  send: () => Promise.resolve('ok' as const),
}

const noOpStorageBucket = {
  upload: () => Promise.resolve({ data: null, error: NOOP_AUTH_ERROR }),
  download: () => Promise.resolve({ data: null, error: NOOP_AUTH_ERROR }),
  remove: () => Promise.resolve({ data: null, error: NOOP_AUTH_ERROR }),
  list: () => Promise.resolve({ data: [], error: null }),
  getPublicUrl: () => ({ data: { publicUrl: '' } }),
  createSignedUrl: () =>
    Promise.resolve({ data: null, error: NOOP_AUTH_ERROR }),
}

/**
 * Public factory. Returns a stub typed as `any` to match the
 * SupabaseClient surface without recreating its 1000-line type.
 * Callers receive a normally-typed client thanks to the `as any`
 * at each call site.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createNoOpSupabaseClient(): any {
  // Log once per process so it's obvious in dev that the stub is active.
  // (Skipped in test environments to avoid noisy output.)
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
    if (!globalThis.__supabaseNoopWarned) {
      // eslint-disable-next-line no-console
      console.info(
        '[supabase] running in no-op mode — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable real auth and queries.',
      )
      globalThis.__supabaseNoopWarned = true
    }
  }

  return {
    from: () => createNoOpQueryBuilder(),
    rpc: () => Promise.resolve(NOOP_DATA),
    auth: noOpAuth,
    channel: () => noOpChannel,
    removeChannel: () => Promise.resolve('ok' as const),
    removeAllChannels: () => Promise.resolve(['ok'] as const),
    storage: {
      from: () => noOpStorageBucket,
      listBuckets: () => Promise.resolve({ data: [], error: null }),
    },
    realtime: {
      connect: () => undefined,
      disconnect: () => undefined,
    },
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __supabaseNoopWarned: boolean | undefined
}
