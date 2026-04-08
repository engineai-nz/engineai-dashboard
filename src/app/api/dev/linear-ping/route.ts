/**
 * Dev-only verification handle for the Linear MCP client — Phase 1b Step 1.
 *
 * Calls `tools/list` on the Linear MCP server and returns the raw tool
 * descriptors as JSON. Used to verify the `LINEAR_API_KEY` is valid
 * and to discover the exact name of the comment-creation tool so
 * `src/lib/agents/tools/postLinearComment.ts` can hardcode it correctly.
 *
 * DELETE THIS ROUTE before the Phase 1b PR lands — see Step 7 of
 * `docs/phase1b-plan.md` exit criteria.
 *
 * Security: gated behind `NODE_ENV !== 'production'` AND the existing
 * `ALLOW_DEV_TENANT_IN_PROD` convention, so it cannot leak a Linear
 * tool listing or bearer error text from a production deployment even
 * if the file accidentally survives a merge.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getLinearMcpClient } from '@/lib/mcp/linear-client';

function isDevOnlyAllowed(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  // Same escape hatch as src/lib/tenant/dev.ts — if ops deliberately
  // sets ALLOW_DEV_TENANT_IN_PROD, the dev tooling stays available.
  return process.env.ALLOW_DEV_TENANT_IN_PROD === '1';
}

export async function GET() {
  if (!isDevOnlyAllowed()) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  try {
    const client = await getLinearMcpClient();
    const tools = await client.listTools();
    // Include server info so we can eyeball version / implementation
    // identification from the initialize handshake.
    const serverInfo = client.getServerVersion();
    const serverCapabilities = client.getServerCapabilities();

    return NextResponse.json({
      ok: true,
      server: serverInfo,
      capabilities: serverCapabilities,
      tools,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
