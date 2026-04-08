/**
 * Phase 1a project read-model query helpers.
 *
 * These wrap the service-role Supabase client and ALWAYS filter by tenant_id.
 * Agent tools (src/lib/agents/tools/) call these wrappers — they never touch
 * the Supabase SDK directly. This is the sealed-envelope pattern in its
 * smallest form: the agent never sees the service-role key.
 */

import 'server-only';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export type ProjectStatus = 'pending' | 'running' | 'complete' | 'failed';

export type ProjectRow = {
  id: string;
  tenant_id: string;
  name: string;
  brief: string;
  division_slug: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

export async function listProjectsForTenant(
  tenantId: string,
): Promise<ProjectRow[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (error) {
    throw new Error(`[db/projects] listProjectsForTenant failed: ${error.message}`);
  }
  return (data ?? []) as ProjectRow[];
}

export async function createProject(input: {
  tenantId: string;
  name: string;
  brief: string;
  divisionSlug: string;
}): Promise<ProjectRow> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({
      tenant_id: input.tenantId,
      name: input.name,
      brief: input.brief,
      division_slug: input.divisionSlug,
    })
    .select('*')
    .single();
  if (error || !data) {
    throw new Error(
      `[db/projects] createProject failed: ${error?.message ?? 'no row returned'}`,
    );
  }
  return data as ProjectRow;
}

/**
 * Update a project's status. Used by the submit-brief route to transition
 * projects through the lifecycle (pending → running → complete/failed) so
 * the audit view never shows a project stuck in 'pending' after a run has
 * already started or failed. Tenant-scoped as defence in depth even though
 * project IDs are globally unique — mirrors the read helpers' pattern.
 */
export async function updateProjectStatus(input: {
  id: string;
  tenantId: string;
  status: ProjectStatus;
}): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from('projects')
    .update({
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('tenant_id', input.tenantId);
  if (error) {
    throw new Error(
      `[db/projects] updateProjectStatus(${input.status}) failed: ${error.message}`,
    );
  }
}
