/**
 * Phase 1a tenant resolver.
 *
 * Single source of truth for "what tenant is this request scoped to". In
 * Phase 1a, this always returns DEV_TENANT_ID — there is no real auth.
 * Phase 1.5 replaces the body of this function with a session lookup.
 *
 * Server-only. Never import from a client component.
 */

import 'server-only';
import { DEV_TENANT_ID, assertDevTenantAllowed } from './dev';

export function getCurrentTenantId(): string {
  // Phase 1.5 will read from a Supabase auth session here.
  // Call-time guard: throws in prod unless ALLOW_DEV_TENANT_IN_PROD is set.
  assertDevTenantAllowed();
  return DEV_TENANT_ID;
}

let _bannerLogged = false;

/**
 * Loud one-time banner so devs can't miss that they're running on the
 * dev tenant constant. Called from src/app/(cockpit)/layout.tsx on the
 * first server render.
 */
export function logDevTenantBannerOnce(): void {
  if (_bannerLogged) return;
  _bannerLogged = true;
  console.log(
    `\n[TENANT] Using DEV_TENANT_ID=${DEV_TENANT_ID} — real auth lands in Phase 1.5\n`,
  );
}
