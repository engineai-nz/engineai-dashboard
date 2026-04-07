/**
 * Discovery agent — Phase 1a.
 *
 * Takes a founder brief and a division slug, returns structured findings
 * and assumptions. Pure LLM call with Zod-typed structured output. No web
 * search, no tools — Phase 1b adds the search MCP.
 *
 * Model: Claude Sonnet 4.6 via @ai-sdk/anthropic. Per-agent swap is one
 * line — change the import below.
 */

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

export const DiscoveryOutputSchema = z.object({
  findings: z
    .array(z.string())
    .min(3)
    .max(8)
    .describe('Concrete observations about the brief, market, and likely scope.'),
  assumptions: z
    .array(z.string())
    .min(2)
    .max(6)
    .describe('Things you are taking on faith and would need to verify.'),
  open_questions: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Things the founder should be asked before drafting the PRD.'),
});

export type DiscoveryOutput = z.infer<typeof DiscoveryOutputSchema>;

const SYSTEM_PROMPT = `You are the Discovery agent for Engine AI's executive cockpit. \
You receive a founder brief and a division slug. Your job is to produce \
structured discovery output: concrete findings, explicit assumptions, and \
open questions that should be answered before a PRD is drafted. \

Be terse and concrete. No filler. No marketing language. Each finding, \
assumption, and question should be one direct sentence. Engineers and \
founders read this — not a board.`;

export async function runDiscoveryAgent(input: {
  brief: string;
  divisionSlug: string;
}): Promise<DiscoveryOutput> {
  const result = await generateObject({
    model: anthropic('claude-sonnet-4-5'),
    schema: DiscoveryOutputSchema,
    system: SYSTEM_PROMPT,
    prompt: `Division: ${input.divisionSlug}\n\nBrief:\n${input.brief}`,
  });
  return result.object;
}
