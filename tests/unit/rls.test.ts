/**
 * Phase 1a RLS isolation test.
 *
 * Asserts that the anon Supabase client cannot read rows from any of the
 * four read-model tables, even after the service-role client inserts data.
 *
 * This is the canary that Phase 1a's "RLS on, no anon policies, service-role
 * bypass + app-layer tenant filter" model is actually enforced. If this test
 * goes red, the dev tenant is leaking to anon callers — STOP and fix.
 *
 * Phase 1.5 will add a second test asserting cross-tenant isolation when
 * real auth lands and tenants are session-bound.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

// Vitest doesn't auto-load .env.local — pull it in explicitly.
loadDotenv({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// If the env isn't configured (e.g. on a contributor's first clone), skip
// rather than fail. CI must have the env set or this test is meaningless.
const envReady = Boolean(url && anonKey && serviceKey);
const d = envReady ? describe : describe.skip;

const TEST_TENANT = `test-rls-${Date.now()}`;

d('phase 1a RLS isolation', () => {
  let anon: SupabaseClient;
  let service: SupabaseClient;
  let projectId: string;

  beforeAll(async () => {
    anon = createClient(url!, anonKey!, { auth: { persistSession: false } });
    service = createClient(url!, serviceKey!, {
      auth: { persistSession: false },
    });

    // Service role inserts a project for the test tenant.
    const { data, error } = await service
      .from('projects')
      .insert({
        tenant_id: TEST_TENANT,
        name: 'rls test project',
        brief: 'rls test brief',
        division_slug: 'biab',
      })
      .select('id')
      .single();
    if (error || !data) {
      throw new Error(`seed insert failed: ${error?.message ?? 'no data'}`);
    }
    projectId = data.id;
  });

  afterAll(async () => {
    if (projectId) {
      await service.from('projects').delete().eq('id', projectId);
    }
  });

  it('anon client cannot read projects even after service insert', async () => {
    const { data, error } = await anon
      .from('projects')
      .select('*')
      .eq('tenant_id', TEST_TENANT);
    // RLS denial returns empty data (not an error) for the anon role.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('anon client cannot insert projects', async () => {
    const { error } = await anon.from('projects').insert({
      tenant_id: TEST_TENANT,
      name: 'should not work',
      brief: 'x',
      division_slug: 'biab',
    });
    // RLS write denial surfaces as an error.
    expect(error).not.toBeNull();
  });

  it('service client reads its own row back via tenant filter', async () => {
    const { data, error } = await service
      .from('projects')
      .select('id')
      .eq('tenant_id', TEST_TENANT);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
    expect(data?.[0].id).toBe(projectId);
  });

  // The header of this file claims RLS coverage on ALL FOUR tables.
  // Codex review caught the overclaim — the original tests only exercised
  // `projects`. These four loops close that gap so any future grant or
  // policy mistake on runs/run_steps/artifacts is caught immediately.
  it('anon client cannot read any of the four read-model tables', async () => {
    const tables = ['projects', 'runs', 'run_steps', 'artifacts'] as const;
    for (const table of tables) {
      const { data, error } = await anon.from(table).select('*').limit(1);
      // RLS denial returns empty data (not an error) for the anon role.
      expect(error, `${table} should not error on read`).toBeNull();
      expect(data, `${table} anon read should be empty`).toEqual([]);
    }
  });
});
