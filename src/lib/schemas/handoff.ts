import { z } from 'zod';
import * as crypto from 'node:crypto';

export const AgentRoleSchema = z.enum([
  'ceo',
  'manager',
  'executive',
  'architect',
  'developer',
  'qa',
  'specialist',
  'sre',
  'openclaw',
  'system',
  'user'
]);

export type AgentRole = z.infer<typeof AgentRoleSchema>;

export const TaskStatusSchema = z.enum([
  'pending',
  'active',
  'running',
  'checkpoint',
  'completed',
  'failed',
  'blocked',
  'dead_letter'
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const HandoffEnvelopeSchema = z.object({
  id: z.string().uuid().default(() => crypto.randomUUID()),
  workflow_run_id: z.string(),
  step_key: z.string(),
  tenant_id: z.string().uuid(),
  sender: AgentRoleSchema,
  recipient: AgentRoleSchema,
  status: TaskStatusSchema.default('pending'),
  payload: z.record(z.unknown()), 
  checkpoint: z.object({
    current_phase: z.string(),
    summary: z.string().max(4000),           // Recursive summary of conversation
    intermediate_artifacts: z.record(z.string()),
  }).optional(),
  tool_cache: z.array(z.object({
    id: z.string(),
    name: z.string(),
    args: z.record(z.unknown()),
    result: z.unknown(),
    timestamp: z.string().datetime(),
  })).default([]),
  effects_log: z.array(z.object({
    effect_id: z.string(),                   // hash(run_id + step + type + params)
    type: z.string(),
    status: z.enum(['pending', 'completed', 'failed']),
    result: z.unknown().optional(),
    executed_at: z.string().datetime().optional(),
  })).default([]),
  constraints: z.object({
    max_tool_calls: z.number().default(10),
    timeout_ms: z.number().default(300000),
    max_summary_chars: z.number().default(4000),
  }),
  created_at: z.string().datetime().default(() => new Date().toISOString()),
});

export type HandoffEnvelope = z.infer<typeof HandoffEnvelopeSchema>;

/**
 * generateEffectId
 * Deterministic hash for side-effect idempotency.
 */
export function generateEffectId(workflow_run_id: string, step_key: string, type: string, params: unknown) {
  // Simple deterministic string representation for hashing
  const raw = `${workflow_run_id}:${step_key}:${type}:${JSON.stringify(params)}`;
  
  try {
    return crypto.createHash('sha256').update(raw).digest('hex');
  } catch (err) {
    // Fallback: simple hash (not cryptographically secure but deterministic for idempotency)
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `eff_${Math.abs(hash).toString(16)}`;
  }
}
