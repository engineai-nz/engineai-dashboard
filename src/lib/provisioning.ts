import { createClient } from './supabase-server';

export type SagaState = 'idle' | 'creating_repo' | 'provisioning_db' | 'injecting_secrets' | 'running_ast' | 'active' | 'failed' | 'rolling_back';

export async function updateSagaState(id: string, state: SagaState, error?: any) {
  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from('provisioning_ledger')
    .update({ 
      state, 
      error_log: error ? JSON.stringify(error) : null,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (dbError) throw dbError;
}

export async function updateStepStatus(id: string, step: 'github' | 'supabase' | 'vercel' | 'ast', status: string) {
  const supabase = await createClient();
  const updateData: any = { updated_at: new Date().toISOString() };
  updateData[`${step}_status`] = status;

  const { error: dbError } = await supabase
    .from('provisioning_ledger')
    .update(updateData)
    .eq('id', id);

  if (dbError) throw dbError;
}
