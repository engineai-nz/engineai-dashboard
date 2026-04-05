import { createClient } from './supabase-server';
import { HandoffEnvelope, HandoffEnvelopeSchema } from './schemas/handoff';

/**
 * createLedgerTask (Server Side Only)
 */
export async function createLedgerTask(task: HandoffEnvelope) {
  const validatedTask = HandoffEnvelopeSchema.parse(task);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('task_ledger')
    .insert(validatedTask)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * findTask
 * 
 * Verifies if a task with specific title and status exists for a tenant.
 * Used for saga idempotency and state recovery.
 */
export async function findTask(tenant_id: string, task_title: string, status: string = 'completed') {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('task_ledger')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('task_title', task_title)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * checkTaskExists
 * 
 * Simple boolean check for task existence.
 */
export async function checkTaskExists(tenant_id: string, task_title: string, status: string = 'completed') {
  const task = await findTask(tenant_id, task_title, status);
  return !!task;
}
