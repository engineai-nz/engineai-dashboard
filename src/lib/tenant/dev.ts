/**
 * Phase 1a dev tenant.
 *
 * Phase 1a runs without real auth — every request is scoped to a single
 * hardcoded tenant. Real Supabase magic-link auth lands in Phase 1.5.
 *
 * This module throws at import time in production unless the explicit
 * `ALLOW_DEV_TENANT_IN_PROD` escape hatch is set. That is intentional: we
 * never want a prod build to silently fall through to a single-tenant constant.
 *
 * See docs/phase1-plan.md "Phase 1.5 — Real Auth" for the removal plan.
 */

export const DEV_TENANT_ID = 'dev-tenant-001';

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
