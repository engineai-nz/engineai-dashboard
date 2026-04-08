/**
 * PRD agent — Phase 1a.
 *
 * Takes the original brief and Discovery output, drafts a markdown PRD.
 * Pure LLM call. No tools.
 *
 * Output is plain markdown so it can be persisted to artifacts.content_markdown
 * and rendered in the cockpit's PrdViewer (Step 5).
 */

import { generateText } from 'ai';
import type { DiscoveryOutput } from './discovery-agent';
import { getModel, stripReasoningTokens } from './model';

// Agent call timeout. PRDs are longer outputs than Discovery JSON, so
// we allow a bit more headroom. 90s matches Discovery — if this becomes
// a problem we can tune per-agent.
const PRD_TIMEOUT_MS = 90_000;
// PRD output is full markdown (8 sections, numbered FRs). 4000 tokens
// fits a thorough PRD comfortably. Prevents runaway reasoning models.
const PRD_MAX_OUTPUT_TOKENS = 4000;

const SYSTEM_PROMPT = `You are the PRD agent for Engine AI's executive cockpit. \
You receive the original founder brief, the division, and structured \
Discovery output. You produce a Product Requirements Document in markdown.

Structure (in this exact order, use these exact headings):
# {Project name}
## Problem
## Goals
## Non-goals
## Users
## Functional requirements
## Constraints + assumptions
## Open questions
## Definition of done

Rules:
- NZ English throughout.
- Direct, terse, no corporate filler. No em dashes.
- Functional requirements are numbered (FR1, FR2...).
- Each FR is one sentence describing observable behaviour.
- Carry forward Discovery's open_questions verbatim into Open questions.
- Carry forward Discovery's assumptions verbatim into Constraints + assumptions.
- Definition of done is one sentence — what the founder will see when this ships.`;

export async function runPrdAgent(input: {
  projectName: string;
  brief: string;
  divisionSlug: string;
  discovery: DiscoveryOutput;
}): Promise<string> {
  // Failure-path test hook (Step 6 e2e). Set THROW_FOR_TEST=1 to force the
  // PRD agent to throw mid-run so we can verify runs.status=failed and the
  // cockpit surfaces the error cleanly. Never set in production.
  if (process.env.THROW_FOR_TEST === '1') {
    throw new Error('THROW_FOR_TEST: forced PRD agent failure for e2e test');
  }

  const userPrompt = [
    `Project name: ${input.projectName}`,
    `Division: ${input.divisionSlug}`,
    '',
    'Original brief:',
    input.brief,
    '',
    'Discovery findings:',
    ...input.discovery.findings.map((f) => `- ${f}`),
    '',
    'Discovery assumptions:',
    ...input.discovery.assumptions.map((a) => `- ${a}`),
    '',
    'Discovery open questions:',
    ...input.discovery.open_questions.map((q) => `- ${q}`),
  ].join('\n');

  const result = await generateText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    abortSignal: AbortSignal.timeout(PRD_TIMEOUT_MS),
    maxOutputTokens: PRD_MAX_OUTPUT_TOKENS,
  });

  // Reasoning models (MiniMax, o1-style) emit <think> blocks that would
  // otherwise leak directly into the persisted PRD markdown. Strip them
  // centrally — see src/lib/agents/model.ts for the helper.
  const stripped = stripReasoningTokens(result.text);
  if (stripped === '') {
    throw new Error(
      '[agents/prd] PRD was empty after reasoning-token strip (possible timeout or refusal)',
    );
  }
  return stripped;
}
