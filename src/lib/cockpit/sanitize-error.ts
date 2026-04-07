/**
 * Error sanitisation at the cockpit boundary.
 *
 * Phase 1a fix for the leakage Codex flagged: API routes used to return
 * `err.message` straight to the browser, the CEO pipeline persisted the
 * same raw message to runs.error, and the run drill-down rendered it
 * verbatim. That happily exposes DB hostnames, provider names, env-var
 * names, and stack traces.
 *
 * The full error is still logged server-side for debugging. The browser
 * + the runs.error column get a stable, generic code per category.
 *
 * Categories are coarse on purpose: Phase 1a only needs "did the LLM
 * fail / did the DB fail / did the agent fail / something else". Phase
 * 1c can refine when durable workflows give us proper step-level errors.
 */

export type SanitisedError = {
  code:
    | 'llm_failed'
    | 'db_failed'
    | 'tenant_violation'
    | 'validation_failed'
    | 'agent_failed'
    | 'unknown';
  message: string;
};

export function sanitiseError(err: unknown): SanitisedError {
  // Always log the raw error server-side for debugging.
  console.error('[cockpit] error:', err);

  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes('tenant ownership')) {
    return {
      code: 'tenant_violation',
      message: 'Tenant ownership violation. The run was rejected.',
    };
  }
  if (lower.includes('[db/')) {
    return {
      code: 'db_failed',
      message: 'A database operation failed. The run was not persisted.',
    };
  }
  if (
    lower.includes('anthropic') ||
    lower.includes('api key') ||
    lower.includes('llm_provider') ||
    lower.includes('rate limit') ||
    lower.includes('429') ||
    lower.includes('overloaded')
  ) {
    return {
      code: 'llm_failed',
      message: 'The language model call failed. Try again in a moment.',
    };
  }
  if (lower.includes('zod') || lower.includes('invalid')) {
    return {
      code: 'validation_failed',
      message: 'The agent returned output that failed validation.',
    };
  }
  return {
    code: 'agent_failed',
    message: 'The agent pipeline failed. Check server logs for details.',
  };
}
