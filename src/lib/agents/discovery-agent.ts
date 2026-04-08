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
import { getModel } from './model';

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
 * Strip reasoning-model artefacts so the raw response can be JSON-parsed.
 * Handles <think>...</think> blocks (MiniMax, DeepSeek-R1) and ```json
 * fences that some models add despite instructions.
 */
function cleanModelJson(raw: string): string {
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
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
  });

  const cleaned = cleanModelJson(result.text);
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
