/**
 * Phase 1a dev tenant.
 *
 * Phase 1a runs without real auth — every request is scoped to a single
 * hardcoded tenant. Real Supabase magic-link auth lands in Phase 1.5.
 *
 * The guard fires at call time (assertDevTenantAllowed), not at import
 * time. Import-time throws break `next build`, which legitimately runs
 * in NODE_ENV=production. Call-time throws still catch any actual prod
 * request that tries to use the dev tenant.
 *
 * See docs/phase1-plan.md "Phase 1.5 — Real Auth" for the removal plan.
 */

export const DEV_TENANT_ID = 'dev-tenant-001';

export function assertDevTenantAllowed(): void {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_DEV_TENANT_IN_PROD !== 'true'
  ) {
    throw new Error(
      '[tenant/dev] DEV_TENANT_ID is not allowed in production. ' +
        'Real auth lands in Phase 1.5. Set ALLOW_DEV_TENANT_IN_PROD=true ' +
        'only for deliberate dev/preview deploys.',
    );
  }
}
