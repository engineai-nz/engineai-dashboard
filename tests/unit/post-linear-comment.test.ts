/**
 * Unit tests for `postLinearComment` (src/lib/agents/tools/postLinearComment.ts).
 *
 * Covers the three code paths:
 *   1. Happy path — MCP returns a successful response → audit row
 *      written with status 'complete', result returns `{ ok: true, url? }`.
 *   2. MCP failure — call throws → audit row written with status
 *      'failed', result returns `{ ok: false, error }`. Never throws.
 *   3. Audit-write failure — both MCP and audit write fail → original
 *      MCP error is still returned (not masked by the audit failure).
 *
 * Critical regression: the `server-only` import inside
 * `src/lib/mcp/linear-client.ts` and `postLinearComment.ts` is mocked
 * at the top so jsdom doesn't trip on the browser-detection check.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only so the jsdom environment doesn't throw on import.
vi.mock('server-only', () => ({}));

// Mock the MCP client factory. The wrapper reaches out to
// getLinearMcpClient() which in real life connects to Linear — in tests
// we inject a fake client whose callTool is a Vitest spy.
vi.mock('@/lib/mcp/linear-client', () => ({
  getLinearMcpClient: vi.fn(),
}));

// Mock the Supabase-backed audit helper so we don't hit the real DB.
// appendRunStep is called for both success and failure paths; we assert
// against its invocation args.
vi.mock('@/lib/db/runs', () => ({
  appendRunStep: vi.fn(),
}));

import { postLinearComment } from '@/lib/agents/tools/postLinearComment';
import { getLinearMcpClient } from '@/lib/mcp/linear-client';
import { appendRunStep } from '@/lib/db/runs';

type MockFn = ReturnType<typeof vi.fn>;
const mockGetClient = getLinearMcpClient as unknown as MockFn;
const mockAppend = appendRunStep as unknown as MockFn;

const baseInput = {
  tenantId: 'test-tenant',
  runId: '11111111-1111-1111-1111-111111111111',
  issueId: 'ENG-42',
  commentMarkdown: '# PRD\n\nThis is a test PRD.',
};

function mockClientWith(callToolImpl: (args: unknown) => unknown) {
  const fake = {
    callTool: vi.fn(callToolImpl),
  };
  mockGetClient.mockResolvedValue(fake);
  return fake;
}

describe('postLinearComment', () => {
  beforeEach(() => {
    mockGetClient.mockReset();
    mockAppend.mockReset();
  });

  it('happy path: returns ok + url and writes a complete audit row', async () => {
    const fakeClient = mockClientWith(() => ({
      content: [
        {
          type: 'text',
          text: 'Comment posted: https://linear.app/engineai/issue/ENG-42#comment-abc',
        },
      ],
    }));
    mockAppend.mockResolvedValue({ id: 'step-row-id' });

    const result = await postLinearComment(baseInput);

    expect(result.ok).toBe(true);
    expect(result.url).toBe(
      'https://linear.app/engineai/issue/ENG-42#comment-abc',
    );
    expect(result.error).toBeUndefined();

    // The MCP tool was called with the right shape.
    expect(fakeClient.callTool).toHaveBeenCalledTimes(1);
    const callArg = fakeClient.callTool.mock.calls[0][0] as {
      name: string;
      arguments: { issueId: string; body: string };
    };
    expect(callArg.name).toBe('save_comment');
    expect(callArg.arguments.issueId).toBe('ENG-42');
    expect(callArg.arguments.body).toBe('# PRD\n\nThis is a test PRD.');

    // The audit row was written as complete.
    expect(mockAppend).toHaveBeenCalledTimes(1);
    const auditArg = mockAppend.mock.calls[0][0] as {
      runId: string;
      tenantId: string;
      stepName: string;
      status: string;
      inputJson: Record<string, unknown>;
      outputJson: Record<string, unknown>;
    };
    expect(auditArg.runId).toBe(baseInput.runId);
    expect(auditArg.tenantId).toBe(baseInput.tenantId);
    expect(auditArg.stepName).toBe('linear_post');
    expect(auditArg.status).toBe('complete');
    expect(auditArg.inputJson.issue_id).toBe('ENG-42');
    expect(auditArg.inputJson.comment_length).toBe(
      baseInput.commentMarkdown.length,
    );
  });

  it('returns ok even when the response has no URL (best-effort extraction)', async () => {
    mockClientWith(() => ({
      content: [{ type: 'text', text: 'Done.' }],
    }));
    mockAppend.mockResolvedValue({ id: 'step-row-id' });

    const result = await postLinearComment(baseInput);

    expect(result.ok).toBe(true);
    expect(result.url).toBeUndefined();
    expect(mockAppend).toHaveBeenCalledTimes(1);
    const auditArg = mockAppend.mock.calls[0][0] as {
      status: string;
      outputJson: { url: unknown };
    };
    expect(auditArg.status).toBe('complete');
    expect(auditArg.outputJson.url).toBeNull();
  });

  it('extracts url from structuredContent when present', async () => {
    mockClientWith(() => ({
      structuredContent: {
        comment: { url: 'https://linear.app/engineai/issue/ENG-42#c-xyz' },
      },
      content: [],
    }));
    mockAppend.mockResolvedValue({ id: 'step-row-id' });

    const result = await postLinearComment(baseInput);

    expect(result.ok).toBe(true);
    expect(result.url).toBe('https://linear.app/engineai/issue/ENG-42#c-xyz');
  });

  it('failure path: returns ok=false with error and writes a failed audit row', async () => {
    mockClientWith(() => {
      throw new Error('Linear MCP: 401 Unauthorized');
    });
    mockAppend.mockResolvedValue({ id: 'step-row-id' });

    const result = await postLinearComment(baseInput);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Linear MCP: 401 Unauthorized');
    expect(result.url).toBeUndefined();

    // Audit row was written with status failed.
    expect(mockAppend).toHaveBeenCalledTimes(1);
    const auditArg = mockAppend.mock.calls[0][0] as {
      status: string;
      outputJson: { error_message: string };
    };
    expect(auditArg.status).toBe('failed');
    expect(auditArg.outputJson.error_message).toBe(
      'Linear MCP: 401 Unauthorized',
    );
  });

  it('isError response: MCP tool returns isError:true and wrapper treats it as a failure', async () => {
    // Regression: Linear's save_comment sets isError: true on entity-not-found
    // errors instead of throwing. The wrapper must detect this explicitly or
    // the failure passes through as a success. Confirmed against the real
    // Linear MCP on 2026-04-09 with a bogus issue ID.
    mockClientWith(() => ({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Entity not found: Issue - Could not find referenced Issue.',
        },
      ],
    }));
    mockAppend.mockResolvedValue({ id: 'step-row-id' });

    const result = await postLinearComment(baseInput);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Entity not found');
    expect(result.url).toBeUndefined();

    // Audit row must reflect the failure, not a spurious success.
    expect(mockAppend).toHaveBeenCalledTimes(1);
    const auditArg = mockAppend.mock.calls[0][0] as {
      status: string;
      outputJson: { error_message: string };
    };
    expect(auditArg.status).toBe('failed');
    expect(auditArg.outputJson.error_message).toContain('Entity not found');
  });

  it('extracts url from a JSON-stringified text content (Linear save_comment shape)', async () => {
    // Regression: Linear's save_comment returns the comment object as a
    // JSON-stringified text content item. The extractor must parse it and
    // pull the url field, not just regex-scan for https://.
    mockClientWith(() => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: '4c57eb37-5280-4735-8498-42a752bb9ea8',
            body: '# PRD\n\nlong content here',
            url: 'https://linear.app/engineaico/issue/ENG-121#comment-4c57eb37',
            createdAt: '2026-04-09T04:03:46.859Z',
          }),
        },
      ],
    }));
    mockAppend.mockResolvedValue({ id: 'step-row-id' });

    const result = await postLinearComment(baseInput);

    expect(result.ok).toBe(true);
    expect(result.url).toBe(
      'https://linear.app/engineaico/issue/ENG-121#comment-4c57eb37',
    );
  });

  it('never throws when the MCP client itself fails to initialise', async () => {
    mockGetClient.mockRejectedValue(
      new Error('[mcp/linear] LINEAR_API_KEY is required but not set.'),
    );
    mockAppend.mockResolvedValue({ id: 'step-row-id' });

    // Crucially: no rejection. The wrapper catches and returns.
    const result = await postLinearComment(baseInput);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('LINEAR_API_KEY');
    expect(mockAppend).toHaveBeenCalledTimes(1);
    const auditArg = mockAppend.mock.calls[0][0] as { status: string };
    expect(auditArg.status).toBe('failed');
  });

  it('does not mask the original MCP error when the audit write also fails', async () => {
    mockClientWith(() => {
      throw new Error('Linear MCP: 500 Internal Server Error');
    });
    mockAppend.mockRejectedValue(new Error('Supabase: connection lost'));

    // Suppress expected error log so test output stays clean.
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const result = await postLinearComment(baseInput);

    // Caller sees the ORIGINAL MCP error, not the audit failure.
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Linear MCP: 500 Internal Server Error');

    // And the audit failure was logged to console.error for ops.
    expect(consoleErrorSpy).toHaveBeenCalled();
    const logged = consoleErrorSpy.mock.calls[0][0] as string;
    expect(logged).toContain('Supabase: connection lost');
    expect(logged).toContain('Linear MCP: 500 Internal Server Error');

    consoleErrorSpy.mockRestore();
  });

  it('writes the configured tool name into the audit input_json for debuggability', async () => {
    mockClientWith(() => ({ content: [] }));
    mockAppend.mockResolvedValue({ id: 'step-row-id' });

    await postLinearComment(baseInput);

    const auditArg = mockAppend.mock.calls[0][0] as {
      inputJson: { tool: string };
    };
    // Whatever the current tool constant is, it shows up in the audit
    // row so we can tell from logs which tool name the wrapper tried.
    expect(typeof auditArg.inputJson.tool).toBe('string');
    expect(auditArg.inputJson.tool.length).toBeGreaterThan(0);
  });
});
