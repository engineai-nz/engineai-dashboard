/**
 * Run + run_step + artifact query helpers.
 *
 * Service-role wrappers. Always filter by tenant_id. Agents call these,
 * never @supabase/supabase-js directly.
 */

import { getSupabaseServiceClient } from '@/lib/supabase/server';

export type RunStatus = 'pending' | 'running' | 'complete' | 'failed';

export type RunRow = {
  id: string;
  project_id: string;
  tenant_id: string;
  status: RunStatus;
  started_at: string;
  finished_at: string | null;
  error: string | null;
};

export type RunStepRow = {
  id: string;
  run_id: string;
  tenant_id: string;
  step_name: string;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown> | null;
  status: RunStatus;
  started_at: string;
  finished_at: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
};

export type ArtifactRow = {
  id: string;
  run_id: string;
  tenant_id: string;
  kind: string;
  content_markdown: string;
  created_at: string;
};

export async function createRun(input: {
  projectId: string;
  tenantId: string;
}): Promise<RunRow> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('runs')
    .insert({
      project_id: input.projectId,
      tenant_id: input.tenantId,
      status: 'running',
    })
    .select('*')
    .single();
  if (error || !data) {
    throw new Error(`[db/runs] createRun failed: ${error?.message ?? 'no row'}`);
  }
  return data as RunRow;
}

export async function appendRunStep(input: {
  runId: string;
  tenantId: string;
  stepName: string;
  inputJson: Record<string, unknown>;
  outputJson: Record<string, unknown>;
  status: RunStatus;
  tokensIn?: number;
  tokensOut?: number;
}): Promise<RunStepRow> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('run_steps')
    .insert({
      run_id: input.runId,
      tenant_id: input.tenantId,
      step_name: input.stepName,
      input_json: input.inputJson,
      output_json: input.outputJson,
      status: input.status,
      finished_at: new Date().toISOString(),
      tokens_in: input.tokensIn ?? null,
      tokens_out: input.tokensOut ?? null,
    })
    .select('*')
    .single();
  if (error || !data) {
    throw new Error(
      `[db/runs] appendRunStep failed: ${error?.message ?? 'no row'}`,
    );
  }
  return data as RunStepRow;
}

export async function saveArtifact(input: {
  runId: string;
  tenantId: string;
  kind: string;
  contentMarkdown: string;
}): Promise<ArtifactRow> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('artifacts')
    .insert({
      run_id: input.runId,
      tenant_id: input.tenantId,
      kind: input.kind,
      content_markdown: input.contentMarkdown,
    })
    .select('*')
    .single();
  if (error || !data) {
    throw new Error(
      `[db/runs] saveArtifact failed: ${error?.message ?? 'no row'}`,
    );
  }
  return data as ArtifactRow;
}

export async function markRunComplete(input: {
  runId: string;
  tenantId: string;
}): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from('runs')
    .update({
      status: 'complete',
      finished_at: new Date().toISOString(),
    })
    .eq('id', input.runId)
    .eq('tenant_id', input.tenantId);
  if (error) {
    throw new Error(`[db/runs] markRunComplete failed: ${error.message}`);
  }
}

export async function markRunFailed(input: {
  runId: string;
  tenantId: string;
  error: string;
}): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error: dbError } = await supabase
    .from('runs')
    .update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      error: input.error,
    })
    .eq('id', input.runId)
    .eq('tenant_id', input.tenantId);
  if (dbError) {
    throw new Error(`[db/runs] markRunFailed failed: ${dbError.message}`);
  }
}

export async function listRunsForTenant(
  tenantId: string,
): Promise<RunRow[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('started_at', { ascending: false });
  if (error) {
    throw new Error(`[db/runs] listRunsForTenant failed: ${error.message}`);
  }
  return (data ?? []) as RunRow[];
}

export async function getRunStepsForRun(input: {
  runId: string;
  tenantId: string;
}): Promise<RunStepRow[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('run_steps')
    .select('*')
    .eq('run_id', input.runId)
    .eq('tenant_id', input.tenantId)
    .order('started_at', { ascending: true });
  if (error) {
    throw new Error(`[db/runs] getRunStepsForRun failed: ${error.message}`);
  }
  return (data ?? []) as RunStepRow[];
}

export async function getArtifactsForRun(input: {
  runId: string;
  tenantId: string;
}): Promise<ArtifactRow[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('run_id', input.runId)
    .eq('tenant_id', input.tenantId)
    .order('created_at', { ascending: true });
  if (error) {
    throw new Error(`[db/runs] getArtifactsForRun failed: ${error.message}`);
  }
  return (data ?? []) as ArtifactRow[];
}
