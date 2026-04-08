/**
 * HandoffEnvelope — Phase 1a slice.
 *
 * Validates every transition between agents in the Discovery → PRD pipeline.
 * Per docs/decisions.md, the full envelope has a 4000-char summary cap and
 * deterministic effect IDs for the outbox pattern. The outbox + effect_id
 * machinery lands in Phase 1c when durable workflows wrap the pipeline.
 *
 * Phase 1a uses just the structural fields: from-step, to-step, payload,
 * summary (capped). This is the contract that Phase 1c will extend, not
 * replace.
 */

import { z } from 'zod';

export const HANDOFF_SUMMARY_MAX = 4000;

export const HandoffEnvelopeSchema = z.object({
  from_step: z.string().min(1),
  to_step: z.string().min(1),
  run_id: z.string().uuid(),
  tenant_id: z.string().min(1),
  summary: z.string().max(HANDOFF_SUMMARY_MAX),
  payload: z.record(z.string(), z.unknown()),
});

export type HandoffEnvelope = z.infer<typeof HandoffEnvelopeSchema>;
