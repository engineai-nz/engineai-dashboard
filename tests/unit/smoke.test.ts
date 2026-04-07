import { describe, it, expect } from 'vitest';
import { DEV_TENANT_ID } from '@/lib/tenant/dev';

describe('phase 1a smoke', () => {
  it('exports the dev tenant constant', () => {
    expect(DEV_TENANT_ID).toBe('dev-tenant-001');
  });
});
