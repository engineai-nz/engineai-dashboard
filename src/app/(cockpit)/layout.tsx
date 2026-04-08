import type { ReactNode } from 'react';
import { CockpitShell } from '@/components/CockpitShell';
import { logDevTenantBannerOnce } from '@/lib/tenant/current';

export default function CockpitLayout({ children }: { children: ReactNode }) {
  // Server-side: loud banner on first render so devs cannot miss that
  // requests are scoped to DEV_TENANT_ID. Replaced in Phase 1.5.
  logDevTenantBannerOnce();
  return <CockpitShell>{children}</CockpitShell>;
}
