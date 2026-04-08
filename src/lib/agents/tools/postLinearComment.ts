/**
 * Sealed-envelope wrapper for posting a comment to a Linear issue via
 * the Linear MCP server — Phase 1b.
 *
 * Design contract (the "sealed envelope pattern" in its smallest form):
 *
 *   1. This file does NOT read `process.env.LINEAR_API_KEY`. That
 *      secret is read exactly once in `src/lib/mcp/linear-client.ts`
 *      and never reaches this layer or anything above it. Agents and
 *      route handlers only see the `{ ok, url?, error? }` return
 *      shape. A grep-based CI check in the Phase 1b exit criteria
 *      enforces the "one file, one read" rule.
 *   2. The wrapper ALWAYS writes a `run_steps` row with `step_name =
 *      'linear_post'`, regardless of success or failure. The audit view
 *      in the cockpit is the single source of truth for what happened.
 *   3. Failures never throw out of the wrapper. Linear-post is a post-run
 *      side effect, not part of the run itself, so the CEO pipeline's
 *      `markRunComplete` should fire even if the comment failed. The
 *      caller inspects `result.ok` and carries on.
 *   4. The wrapper is deterministic: the same `{ tenantId, runId,
 *      issueId, commentMarkdown }` inputs produce the same side effects
 *      regardless of agent history. Agent-controlled input never reaches
 *      the Linear API key resolution path — that lives in
 *      `src/lib/mcp/linear-client.ts` and reads env directly.
 *
 * See `docs/phase1b-plan.md` for the full scope and Step 2 of the build
 * order. See the 2026-04-08 decisions.md entry titled "Phase 1b MCP
 * architecture" for the locked decisions this wrapper implements.
 */

import 'server-only';
import { getLinearMcpClient } from '@/lib/mcp/linear-client';
import { appendRunStep } from '@/lib/db/runs';

/**
 * Tool name the Linear MCP server exposes for comment creation.
 *
 * Verified 2026-04-09 against Linear's hosted MCP server via
 * `/api/dev/linear-ping`: Linear uses a unified `save_comment` tool
 * that handles both create and update. When called without an `id`
 * it creates; when called with an `id` it updates the existing
 * comment. Phase 1b only ever creates — we pass `issueId` + `body`
 * and omit `id`.
 */
const LINEAR_MCP_CREATE_COMMENT_TOOL = 'save_comment';

export interface PostLinearCommentInput {
  /**
   * Tenant scope for the audit row. Always `DEV_TENANT_ID` in Phase 1a,
   * real session tenant in Phase 1.5+.
   */
  tenantId: string;
  /**
   * The run whose PRD we are posting. The resulting `linear_post` row
   * in `run_steps` gets foreign-key'd to this run via the existing
   * `appendRunStep` helper.
   */
  runId: string;
  /**
   * Linear issue identifier, e.g. `ENG-123`. Format validated at the
   * API boundary in `src/app/api/cockpit/submit-brief/route.ts`; this
   * wrapper assumes the value is already well-formed.
   */
  issueId: string;
  /**
   * Full PRD markdown to post as the comment body. No length cap in
   * Phase 1b — Linear's own limits apply.
   */
  commentMarkdown: string;
}

export interface PostLinearCommentResult {
  ok: boolean;
  /** URL of the created comment, when the server returns one. */
  url?: string;
  /** Sanitised error message when `ok` is false. */
  error?: string;
}

/**
 * Post a comment to a Linear issue via the hosted Linear MCP server.
 * Always writes an audit row. Never throws.
 */
export async function postLinearComment(
  input: PostLinearCommentInput,
): Promise<PostLinearCommentResult> {
  const auditInput: Record<string, unknown> = {
    issue_id: input.issueId,
    comment_length: input.commentMarkdown.length,
    tool: LINEAR_MCP_CREATE_COMMENT_TOOL,
  };

  try {
    const client = await getLinearMcpClient();
    const response = await client.callTool({
      name: LINEAR_MCP_CREATE_COMMENT_TOOL,
      arguments: {
        issueId: input.issueId,
        body: input.commentMarkdown,
      },
    });

    const url = extractCommentUrl(response);
    const summary = summariseResponse(response);

    await appendRunStep({
      runId: input.runId,
      tenantId: input.tenantId,
      stepName: 'linear_post',
      inputJson: auditInput,
      outputJson: {
        url: url ?? null,
        response_summary: summary,
      },
      status: 'complete',
    });

    return url !== undefined ? { ok: true, url } : { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Best-effort audit row on failure. If the audit write itself fails
    // (e.g. DB hiccup), we log and continue — the original Linear error
    // is still returned to the caller so the real cause isn't masked.
    try {
      await appendRunStep({
        runId: input.runId,
        tenantId: input.tenantId,
        stepName: 'linear_post',
        inputJson: auditInput,
        outputJson: {
          error_message: message,
        },
        status: 'failed',
      });
    } catch (auditErr) {
      const auditMsg =
        auditErr instanceof Error ? auditErr.message : String(auditErr);
      console.error(
        `[agents/tools/postLinearComment] failed to write failure audit row: ${auditMsg}. ` +
          `Original Linear error: ${message}`,
      );
    }
    return { ok: false, error: message };
  }
}

/**
 * Best-effort URL extraction from an MCP tool response. The response
 * shape is loosely specified — content is an array of typed items —
 * so we look across common shapes (structured content first, then a
 * text-content URL match) without being strict. Returns `undefined`
 * if no URL can be found; the audit row still records the full
 * response summary so debugging is possible.
 */
function extractCommentUrl(response: unknown): string | undefined {
  if (response === null || typeof response !== 'object') return undefined;
  const r = response as Record<string, unknown>;

  // Structured content path — many MCP servers return a JSON-shaped
  // `structuredContent` alongside the `content` array.
  const structured = r.structuredContent;
  if (structured !== null && typeof structured === 'object') {
    const s = structured as Record<string, unknown>;
    if (typeof s.url === 'string' && s.url.length > 0) return s.url;
    // Nested shape: { comment: { url: '...' } }
    if (s.comment !== null && typeof s.comment === 'object') {
      const c = s.comment as Record<string, unknown>;
      if (typeof c.url === 'string' && c.url.length > 0) return c.url;
    }
  }

  // Text content path — scan the first text block for a plausible URL.
  const content = r.content;
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item !== null && typeof item === 'object') {
        const i = item as Record<string, unknown>;
        if (i.type === 'text' && typeof i.text === 'string') {
          const match = i.text.match(/https?:\/\/[^\s<>"]+/);
          if (match !== null) return match[0];
        }
      }
    }
  }

  return undefined;
}

/**
 * Compact summary of an MCP tool response for the audit row. Keeps
 * the shape small and deterministic so the cockpit's RunHistory can
 * render it without surprises.
 */
function summariseResponse(response: unknown): Record<string, unknown> {
  if (response === null || typeof response !== 'object') {
    return { raw_type: typeof response };
  }
  const r = response as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if ('isError' in r) out.is_error = r.isError;
  if (Array.isArray(r.content)) {
    out.content_count = r.content.length;
    const firstText = r.content.find(
      (c): c is { type: string; text: string } =>
        c !== null &&
        typeof c === 'object' &&
        (c as { type?: unknown }).type === 'text' &&
        typeof (c as { text?: unknown }).text === 'string',
    );
    if (firstText !== undefined) {
      // Cap at 500 chars so the audit row can't bloat from a verbose response.
      out.first_text_preview = firstText.text.slice(0, 500);
    }
  }
  return out;
}
