/**
 * Model provider shim — Phase 1a.
 *
 * Single source of truth for "which LLM does an agent talk to". Agents
 * import getModel() from here instead of any specific provider package.
 * Swapping providers (OpenAI, OpenRouter, Groq, Ollama, a local model,
 * a different Anthropic tier) is a one-line change in this file plus an
 * env var flip — no agent code changes.
 *
 * Why: Claude is expensive and not the only option. Phase 1a is a holding
 * pattern. The agent runtime should be model-agnostic so we can A/B cost
 * and quality without touching agent prompts.
 *
 * Env contract:
 *   LLM_PROVIDER  — 'anthropic' (default) | 'minimax'. Future: 'openai',
 *                   'openrouter', 'ollama', generic 'openai-compatible'.
 *   LLM_MODEL     — provider-specific model id. Default depends on provider.
 *
 *   Provider-specific:
 *     MINIMAX_API_KEY   — required when LLM_PROVIDER=minimax
 *     MINIMAX_BASE_URL  — optional override, default https://api.minimax.io/v1
 *
 * Adding a new provider:
 *   1. npm install the SDK (e.g. @ai-sdk/openai)
 *   2. Add the literal to Provider + DEFAULT_MODELS + resolveProvider()
 *   3. Add a case to the switch below
 *   4. Set LLM_PROVIDER + LLM_MODEL in .env.local
 *   5. No agent code changes needed.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';

type Provider = 'anthropic' | 'minimax';

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: 'claude-sonnet-4-5',
  minimax: 'MiniMax-M2.7',
};

function resolveProvider(): Provider {
  const raw = (process.env.LLM_PROVIDER ?? 'anthropic').toLowerCase();
  if (raw === 'anthropic') return 'anthropic';
  if (raw === 'minimax') return 'minimax';
  throw new Error(
    `[agents/model] Unknown LLM_PROVIDER: ${raw}. ` +
      `Supported: anthropic, minimax. Add a case in src/lib/agents/model.ts to extend.`,
  );
}

/**
 * Strip reasoning-model artefacts from LLM output.
 *
 * Reasoning models (MiniMax-M2, DeepSeek-R1, o1-style) emit their private
 * chain-of-thought inside `<think>`, `<thinking>`, or `<reasoning>` tags.
 * Downstream code (JSON.parse, markdown rendering, Zod validation) never
 * wants to see that prose — it fails JSON parsing and pollutes PRD output.
 *
 * This helper is the single central entry point for stripping those tags.
 * Every agent that calls a reasoning model should run its raw text through
 * this before parsing or returning. Keep the regex generous:
 *   - Case-insensitive (i flag)
 *   - Tag attributes allowed: `<think foo="bar">`
 *   - Cross-line content via [\s\S]*? (non-greedy)
 *   - Backreference \1 ensures the closing tag matches the opener
 *
 * Do NOT tighten this to only `<think>` — tonight's dev-server incident was
 * caused by exactly that mistake in discovery-agent.ts. MiniMax emitted
 * `<thinking>...</thinking>` which the old regex missed, the raw prose hit
 * JSON.parse, and the run failed. One centralised helper per file per rule.
 */
export function stripReasoningTokens(text: string): string {
  return text
    .replace(/<(think|thinking|reasoning)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .trim();
}

export function getModel(): LanguageModel {
  const provider = resolveProvider();
  const modelId = process.env.LLM_MODEL ?? DEFAULT_MODELS[provider];

  switch (provider) {
    case 'anthropic':
      return anthropic(modelId);
    case 'minimax': {
      const apiKey = process.env.MINIMAX_API_KEY;
      if (!apiKey) {
        throw new Error(
          '[agents/model] MINIMAX_API_KEY is required when LLM_PROVIDER=minimax',
        );
      }
      const minimax = createOpenAICompatible({
        name: 'minimax',
        baseURL: process.env.MINIMAX_BASE_URL ?? 'https://api.minimax.io/v1',
        apiKey,
      });
      return minimax(modelId);
    }
    default: {
      // Exhaustiveness check — TS will complain if a Provider value is missed.
      const _exhaustive: never = provider;
      throw new Error(`unreachable: ${String(_exhaustive)}`);
    }
  }
}
