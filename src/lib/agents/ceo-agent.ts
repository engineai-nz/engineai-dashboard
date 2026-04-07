/**
 * CEO agent / orchestrator — Phase 1a.
 *
 * Plain async function in 1a. No durable workflow wrapper — that lands
 * in Phase 1c (Vercel Workflows + outbox + effect IDs). The point of
 * keeping it as a flat function for now is so the read-model + agent
 * boundary can be exercised end-to-end before durability is bolted on.
 *
 * Flow:
 *   1. createRun → runs row in 'running' state
 *   2. Discovery agent → structured findings/assumptions/questions
 *      → appendRunStep('discovery')
 *   3. HandoffEnvelopeSchema validates the discovery → prd transition
 *   4. PRD agent → markdown
 *      → appendRunStep('drafting')
 *      → saveArtifact(kind='prd')
 *   5. markRunComplete
 *
 * On any throw, markRunFailed with the error message.
 */

import { runDiscoveryAgent } from './discovery-agent';
import { runPrdAgent } from './prd-agent';
import {
  createRun,
  appendRunStep,
  saveArtifact,
  markRunComplete,
  markRunFailed,
  type RunRow,
  type ArtifactRow,
} from '@/lib/db/runs';
import { HandoffEnvelopeSchema } from '@/lib/schemas/handoff-envelope';

export type CeoRunResult = {
  run: RunRow;
  artifact: ArtifactRow;
};

export async function runCeoPipeline(input: {
  projectId: string;
  projectName: string;
  brief: string;
  divisionSlug: string;
  tenantId: string;
}): Promise<CeoRunResult> {
  const run = await createRun({
    projectId: input.projectId,
    tenantId: input.tenantId,
  });

  try {
    // Step: discovery
    const discoveryInput = {
      brief: input.brief,
      division_slug: input.divisionSlug,
    };
    const discovery = await runDiscoveryAgent({
      brief: input.brief,
      divisionSlug: input.divisionSlug,
    });
    await appendRunStep({
      runId: run.id,
      tenantId: input.tenantId,
      stepName: 'discovery',
      inputJson: discoveryInput,
      outputJson: discovery as unknown as Record<string, unknown>,
      status: 'complete',
    });

    // Handoff: discovery → drafting (envelope-validated).
    const envelope = HandoffEnvelopeSchema.parse({
      from_step: 'discovery',
      to_step: 'drafting',
      run_id: run.id,
      tenant_id: input.tenantId,
      summary: `Discovery produced ${discovery.findings.length} findings, ${discovery.assumptions.length} assumptions, ${discovery.open_questions.length} open questions.`,
      payload: { discovery: discovery as unknown as Record<string, unknown> },
    });

    // Step: drafting
    const prdMarkdown = await runPrdAgent({
      projectName: input.projectName,
      brief: input.brief,
      divisionSlug: input.divisionSlug,
      discovery,
    });
    await appendRunStep({
      runId: run.id,
      tenantId: input.tenantId,
      stepName: 'drafting',
      inputJson: { handoff: envelope },
      outputJson: { length: prdMarkdown.length },
      status: 'complete',
    });

    // Persist the artifact.
    const artifact = await saveArtifact({
      runId: run.id,
      tenantId: input.tenantId,
      kind: 'prd',
      contentMarkdown: prdMarkdown,
    });

    await markRunComplete({ runId: run.id, tenantId: input.tenantId });

    return { run, artifact };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markRunFailed({
      runId: run.id,
      tenantId: input.tenantId,
      error: message,
    });
    throw err;
  }
}
