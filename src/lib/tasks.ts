import { createClient } from './supabase-server';
import { HandoffEnvelope, HandoffEnvelopeSchema } from './schemas/handoff';

/**
 * createLedgerTask (Server Side Only)
 * Persists a handoff or step execution to the high-integrity Task Ledger.
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
    agent_role: validatedTask.recipient, // The role currently responsible for the step
    status: validatedTask.status,
    checkpoint: validatedTask.checkpoint || {},
    effects_log: validatedTask.effects_log || [],
    created_at: validatedTask.created_at,
  };

  const { data, error } = await supabase
    .from('task_ledger')
    .insert(dbRecord)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * checkTaskExists
 * 
 * Verifies if a specific workflow step has reached a certain status.
 * Used for saga idempotency and avoiding duplicate side effects.
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
