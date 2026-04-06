import { createClient } from './supabase-server';

export type SagaState = 'idle' | 'creating_repo' | 'provisioning_db' | 'injecting_secrets' | 'running_ast' | 'active' | 'failed' | 'rolling_back';

export interface ProvisioningSaga {
  id: string;
  project_id: string;
  github_repo_url?: string;
  supabase_project_id?: string;
  vercel_project_id?: string;
  state: SagaState;
  github_status: string;
  supabase_status: string;
  vercel_status: string;
  ast_status: string;
  github_cleanup_ref?: string;
  supabase_cleanup_ref?: string;
  vercel_cleanup_ref?: string;
  github_idempotency_key?: string;
  supabase_idempotency_key?: string;
  vercel_idempotency_key?: string;
  retry_count: number;
  error_log?: any;
  created_at: string;
  updated_at: string;
}

export async function getSagaByProjectId(projectId: string): Promise<ProvisioningSaga | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('provisioning_ledger')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createSaga(projectId: string): Promise<ProvisioningSaga> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('provisioning_ledger')
    .insert({ 
      project_id: projectId,
      state: 'idle',
      github_status: 'pending',
      supabase_status: 'pending',
      vercel_status: 'pending',
      ast_status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSaga(id: string, updates: Partial<ProvisioningSaga>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('provisioning_ledger')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

export async function updateSagaState(id: string, state: SagaState, error?: any) {
  const supabase = await createClient();
  const errorLog = error ? { 
    message: error.message || "Unknown error", 
    stack: error.stack, 
    raw: error 
  } : null;

  const { error: dbError } = await supabase
    .from('provisioning_ledger')
    .update({ 
      state, 
      error_log: errorLog,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (dbError) throw dbError;
}

export async function updateStepStatus(id: string, step: 'github' | 'supabase' | 'vercel' | 'ast', status: string, key?: string) {
  const supabase = await createClient();
  const updateData: any = { updated_at: new Date().toISOString() };
  updateData[`${step}_status`] = status;
  if (key) {
    updateData[`${step}_idempotency_key`] = key;
  }

  const { error: dbError } = await supabase
    .from('provisioning_ledger')
    .update(updateData)
    .eq('id', id);

  if (dbError) throw dbError;
}
