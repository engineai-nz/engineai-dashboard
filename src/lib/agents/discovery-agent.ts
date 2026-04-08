/**
 * Discovery agent — Phase 1a.
 *
 * Takes a founder brief and a division slug, returns structured findings
 * and assumptions. Pure LLM call with Zod-validated JSON output. No web
 * search, no tools — Phase 1b adds the search MCP.
 *
 * Model: resolved by src/lib/agents/model.ts. Provider-agnostic — flip
 * LLM_PROVIDER + LLM_MODEL in .env.local to swap.
 *
 * Why generateText instead of generateObject: generateObject relies on
 * provider-native tool-calling / JSON-schema mode. Reasoning models like
 * MiniMax-M2 emit <think> blocks and don't reliably honour tool-calling
 * via OpenAI-compat. We ask for raw JSON, strip reasoning tags, extract
 * the first JSON object, then Zod-validate. Works across all providers.
 */

import { generateText } from 'ai';
import { z } from 'zod';
import { getModel, stripReasoningTokens } from './model';

// Agent call timeout. Reasoning models can take 30-60s on long briefs;
// 90s gives headroom without hanging the request indefinitely. Phase 1c
// will wrap this in Vercel Workflows with proper durability + retry.
const DISCOVERY_TIMEOUT_MS = 90_000;
// Sanity cap on output tokens. Discovery output is a small JSON object
// (3-8 findings + 2-6 assumptions + 1-5 questions) — 2000 tokens is
// plenty, and it bounds runaway reasoning models.
const DISCOVERY_MAX_OUTPUT_TOKENS = 2000;

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
open questions that should be answered before a PRD is drafted.

Be terse and concrete. No filler. No marketing language. Each finding, \
assumption, and question should be one direct sentence. Engineers and \
founders read this — not a board.

Output a single JSON object with this exact shape, and nothing else — no \
prose before or after, no markdown code fences, no commentary:

{
  "findings": ["string", ...],          // 3 to 8 items
  "assumptions": ["string", ...],       // 2 to 6 items
  "open_questions": ["string", ...]     // 1 to 5 items
}`;

/**
 * Clean JSON output from reasoning models: strip reasoning tags (centrally
 * via stripReasoningTokens in model.ts), drop ```json fences, and extract
 * the first {...} object if the model added trailing prose.
 */
function cleanModelJson(raw: string): string {
  let cleaned = stripReasoningTokens(raw);
  // Drop an opening fence + optional language tag, and the closing fence.
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  // Extract the first {...} object if the model added trailing prose.
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }
  return cleaned.trim();
}

export async function runDiscoveryAgent(input: {
  brief: string;
  divisionSlug: string;
}): Promise<DiscoveryOutput> {
  const result = await generateText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    prompt: `Division: ${input.divisionSlug}\n\nBrief:\n${input.brief}`,
    abortSignal: AbortSignal.timeout(DISCOVERY_TIMEOUT_MS),
    maxOutputTokens: DISCOVERY_MAX_OUTPUT_TOKENS,
  });

  // Preserve signal on empty responses so we can tell "model timed out /
  // refused / returned nothing" apart from "model returned malformed JSON".
  // Previously an empty string here surfaced as "non-JSON" which lost the
  // distinction — see tasks/lessons.md for the overnight incident.
  const rawPreview = result.text.slice(0, 200);
  if (result.text.trim() === '') {
    throw new Error(
      '[agents/discovery] empty response from model (possible timeout or refusal)',
    );
  }

  const cleaned = cleanModelJson(result.text);
  if (cleaned === '') {
    throw new Error(
      `[agents/discovery] response contained only reasoning tokens after strip. ` +
        `Raw preview (first 200 chars): ${rawPreview}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const preview = cleaned.slice(0, 200);
    throw new Error(
      `Discovery agent returned non-JSON output. First 200 chars: ${preview}`,
      { cause: err },
    );
  }
  return DiscoveryOutputSchema.parse(parsed);
}
