import { createClient } from './supabase-server';
import { HandoffEnvelope, HandoffEnvelopeSchema } from './schemas/handoff';

/**
 * createLedgerTask (Server Side Only)
 * Persists a handoff or step execution to the high-integrity Task Ledger.
 * Uses upsert for idempotency based on (workflow_run_id, step_key).
 */
export async function createLedgerTask(task: HandoffEnvelope) {
  const validatedTask = HandoffEnvelopeSchema.parse(task);
  const supabase = await createClient();

  // Map envelope to database columns
  const dbRecord = {
    id: validatedTask.id,
    workflow_run_id: validatedTask.workflow_run_id,
    step_key: validatedTask.step_key,
    tenant_id: validatedTask.tenant_id,
    agent_role: validatedTask.recipient,
    status: validatedTask.status,
    checkpoint: validatedTask.checkpoint || {},
    tool_cache: validatedTask.tool_cache || [],
    effects_log: validatedTask.effects_log || [],
    created_at: validatedTask.created_at,
    updated_at: new Date().toISOString(),
    attempts: 0,
    max_attempts: validatedTask.constraints?.max_tool_calls || 3,
  };

  const { data, error } = await supabase
    .from('task_ledger')
    .upsert(dbRecord, { onConflict: 'workflow_run_id,step_key' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * upsertTaskStatus (Server Side Only)
 * Specifically handles status transitions and progress updates (checkpoints).
 * Can be used to partially update a task ledger entry.
 */
export async function upsertTaskStatus(
  workflow_run_id: string,
  step_key: string,
  update: Partial<Pick<HandoffEnvelope, 'status' | 'checkpoint' | 'tool_cache' | 'effects_log'>> & { last_error?: string; attempts?: number }
) {
  const supabase = await createClient();
  
  const dbUpdate: any = {
    workflow_run_id,
    step_key,
    ...update,
    updated_at: new Date().toISOString(),
  };

  if (update.status === 'completed') {
    dbUpdate.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('task_ledger')
    .upsert(dbUpdate, { onConflict: 'workflow_run_id,step_key' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * checkTaskExists
 * Verifies if a specific workflow step has reached a certain status.
 */
export async function checkTaskExists(workflow_run_id: string, step_key: string, status: string = 'completed') {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('task_ledger')
    .select('id')
    .eq('workflow_run_id', workflow_run_id)
    .eq('step_key', step_key)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

/**
 * getTaskLedgerEntry
 * Retrieves the full context for a resumable step.
 */
export async function getTaskLedgerEntry(workflow_run_id: string, step_key: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('task_ledger')
    .select('*')
    .eq('workflow_run_id', workflow_run_id)
    .eq('step_key', step_key)
    .maybeSingle();

  if (error) throw error;
  return data;
}
