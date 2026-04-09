/**
 * CEO agent / orchestrator — Phase 1a + 1b.
 *
 * Plain async function. No durable workflow wrapper — that lands in
 * Phase 1c (Vercel Workflows + outbox + effect IDs). The point of
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
 *   5. Phase 1b: if project.linear_issue_id is set, post PRD to Linear
 *      via postLinearComment (sealed wrapper — agent never sees the
 *      Linear API key). If not set, write an explicit skipped
 *      linear_post run_step so the audit view is the single source of
 *      truth. Linear post failures are side effects — they do NOT
 *      fail the run (Phase 1b Decision 7).
 *   6. markRunComplete
 *
 * On any throw before Step 5, markRunFailed with the error message.
 */

import { runDiscoveryAgent } from './discovery-agent';
import { runPrdAgent } from './prd-agent';
import { postLinearComment } from './tools/postLinearComment';
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
import { sanitiseError } from '@/lib/cockpit/sanitize-error';

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
  /**
   * Phase 1b: optional Linear issue ID. When set, the pipeline posts
   * the generated PRD as a comment on this issue after saveArtifact.
   * When null/undefined, an explicit skipped linear_post run_step is
   * written instead so the audit view shows the skip.
   */
  linearIssueId?: string | null;
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
      // Persist the actual PRD markdown in the step output so the audit
      // view's drill-down shows the agent's real output, not just metadata.
      // The same content is also persisted as an artifact below — that is
      // the canonical store; this copy is for the run trace.
      outputJson: {
        prd_markdown: prdMarkdown,
        length: prdMarkdown.length,
      },
      status: 'complete',
    });

    // Persist the artifact.
    const artifact = await saveArtifact({
      runId: run.id,
      tenantId: input.tenantId,
      kind: 'prd',
      contentMarkdown: prdMarkdown,
    });

    // Phase 1b: post PRD as a Linear comment when the brief specified
    // a linear_issue_id. Failures here do NOT fail the run — they are
    // logged as a 'linear_post' run_step via postLinearComment itself.
    // When no issue ID is set, write an explicit skipped step so the
    // audit view shows why nothing was posted.
    if (
      input.linearIssueId !== null &&
      input.linearIssueId !== undefined &&
      input.linearIssueId.trim() !== ''
    ) {
      await postLinearComment({
        tenantId: input.tenantId,
        runId: run.id,
        issueId: input.linearIssueId,
        commentMarkdown: prdMarkdown,
      });
    } else {
      await appendRunStep({
        runId: run.id,
        tenantId: input.tenantId,
        stepName: 'linear_post',
        inputJson: {
          skipped: true,
          reason: 'no_linear_issue_id',
        },
        outputJson: {
          skipped: true,
          message: 'Brief did not specify a Linear issue ID.',
        },
        status: 'complete',
      });
    }

    await markRunComplete({ runId: run.id, tenantId: input.tenantId });

    return { run, artifact };
  } catch (err) {
    // Sanitise: log full error server-side, persist + rethrow only the
    // generic category. runs.error is rendered to the browser at the
    // drill-down, so it must not contain raw infra/provider strings.
    const sanitised = sanitiseError(err);
    await markRunFailed({
      runId: run.id,
      tenantId: input.tenantId,
      error: `[${sanitised.code}] ${sanitised.message}`,
    });
    throw new Error(`[${sanitised.code}] ${sanitised.message}`);
  }
}
