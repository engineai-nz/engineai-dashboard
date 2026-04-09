/**
 * MCP client for Linear's hosted remote MCP server — Phase 1b.
 *
 * Linear publishes an official Model Context Protocol server at
 * `https://mcp.linear.app/mcp`. It speaks streamable HTTP and is
 * authenticated via a Bearer token in the `Authorization` header.
 * Our code is purely an MCP *client* — we never run a Linear MCP
 * server of our own. See `docs/phase1b-plan.md` and the 2026-04-08
 * decisions.md entry titled "Phase 1b MCP architecture" for the
 * rationale and the full set of locked decisions.
 *
 * This module is the single entry point for all Linear MCP access in
 * the dashboard. Everything else — sealed envelope wrappers, agent
 * tools, dev-only verification routes — goes through
 * `getLinearMcpClient()`. Do not instantiate `Client` or
 * `StreamableHTTPClientTransport` anywhere else.
 *
 * Credential isolation: `process.env.LINEAR_API_KEY` is read ONCE,
 * in `initLinearMcpClient()` below, and never stored outside the
 * transport's internal request headers. No other module in the
 * codebase reads this env var — the Phase 1b sealed envelope rule
 * is "one file, one read" and the grep check in the Phase 1b exit
 * criteria enforces it. If a second reader is ever needed, push the
 * wrapper API through this module instead.
 */

import 'server-only';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const LINEAR_MCP_URL = 'https://mcp.linear.app/mcp';

/**
 * Identification the MCP server sees during the `initialize` handshake.
 * Kept stable across versions — bumping the version here is fine but
 * the name should match `package.json`'s `name` field for traceability.
 */
const CLIENT_INFO = {
  name: 'engineai-dashboard',
  version: '0.1.0',
} as const;

/**
 * Connection timeout for the streamable HTTP transport's initial
 * `initialize` handshake. 15 seconds is generous for a hosted endpoint;
 * if we hit this in practice, the issue is network, not Linear.
 */
const CONNECT_TIMEOUT_MS = 15_000;

/**
 * Module-level singleton state. We cache the connected client so
 * repeated calls in the same process reuse the same session. On
 * connection failure we reset the cached promise so the next caller
 * gets a fresh attempt — otherwise a transient network blip would
 * permanently wedge the module.
 */
let _client: Client | null = null;
let _connecting: Promise<Client> | null = null;

/**
 * Return a connected MCP client for Linear. Lazy — connects on first
 * call, reuses the connection thereafter. Throws if `LINEAR_API_KEY`
 * is missing or the initialize handshake fails.
 */
export async function getLinearMcpClient(): Promise<Client> {
  if (_client !== null) return _client;
  if (_connecting !== null) return _connecting;

  _connecting = (async () => {
    try {
      const client = await initLinearMcpClient();
      _client = client;
      return client;
    } catch (err) {
      // Reset on failure so the next caller retries instead of
      // inheriting a permanently-rejected promise.
      _connecting = null;
      throw err;
    }
  })();

  return _connecting;
}

async function initLinearMcpClient(): Promise<Client> {
  const apiKey = process.env.LINEAR_API_KEY;
  if (apiKey === undefined || apiKey.trim() === '') {
    throw new Error(
      '[mcp/linear] LINEAR_API_KEY is required but not set. ' +
        'Add it to .env.local (dev) or your Vercel env vars (preview/prod). ' +
        'Get a key from https://linear.app/settings/account/security.',
    );
  }

  const transport = new StreamableHTTPClientTransport(new URL(LINEAR_MCP_URL), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  });

  const client = new Client(CLIENT_INFO, { capabilities: {} });

  // Race the connect against an abort timeout so a hung handshake
  // cannot wedge the caller. AbortSignal.timeout throws a DOMException
  // with name 'TimeoutError' which we surface as a regular Error.
  await Promise.race([
    client.connect(transport),
    new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              `[mcp/linear] connection to ${LINEAR_MCP_URL} timed out after ${CONNECT_TIMEOUT_MS}ms`,
            ),
          ),
        CONNECT_TIMEOUT_MS,
      );
    }),
  ]);

  return client;
}

/**
 * Close the cached client. Intended for process-shutdown hooks and
 * test teardown — normal request-path code should not call this.
 */
export async function closeLinearMcpClient(): Promise<void> {
  const cached = _client;
  _client = null;
  _connecting = null;
  if (cached !== null) {
    try {
      await cached.close();
    } catch {
      // Swallow close errors — we're tearing down.
    }
  }
}

/**
 * Test-only: reset module state WITHOUT trying to close the cached
 * client. Useful when tests replace the module singleton via mock
 * injection and want a clean slate between cases. Do NOT call from
 * production code.
 */
export function __resetLinearMcpClientForTesting(): void {
  _client = null;
  _connecting = null;
}
