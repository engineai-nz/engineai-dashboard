import { z } from 'zod';

export const AgentRoleSchema = z.enum([
  'executive',
  'manager',
  'specialist',
  'ceo_agent',
  'architect_agent',
  'dev_agent',
  'qa_agent',
  'openclaw',
  'sre_agent',
]);

export type AgentRole = z.infer<typeof AgentRoleSchema>;

export const TaskStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'failed',
  'blocked',
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const HandoffEnvelopeSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  parent_task_id: z.string().uuid().optional().nullable(),
  sender_role: AgentRoleSchema,
  recipient_role: AgentRoleSchema,
  task_title: z.string().min(1),
  executive_rationale: z.string().optional(),
  payload: z.record(z.any()),
  status: TaskStatusSchema.default('pending'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type HandoffEnvelope = z.infer<typeof HandoffEnvelopeSchema>;
