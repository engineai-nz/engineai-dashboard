/**
 * POST /api/cockpit/query
 *
 * Conversational entry point (for the future cockpit chat strip — wired in
 * Phase 1b). Phase 1a: trust-boundary-correct stub. Accepts the v6
 * { messages: UIMessage[] } shape, strips to the last user message text,
 * echoes it back. The point of shipping the route in 1a is so the trust
 * boundary helper has a real consumer + a regression test.
 *
 * IRON RULE: never trust assistant or tool history posted from the browser.
 * stripToLastUserText() is the only allowed entry point.
 *
 * Node runtime per docs/decisions.md.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { stripToLastUserText } from '@/lib/cockpit/strip-history';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const messages = (body as { messages?: unknown })?.messages;
  const userText = stripToLastUserText(messages);

  if (!userText) {
    return NextResponse.json(
      { error: 'no user message in payload' },
      { status: 400 },
    );
  }

  // Phase 1a stub: echo the stripped user text. Phase 1b wires this into
  // a streaming Sonnet 4.6 chat agent with read-model tools.
  return NextResponse.json({
    reply: `[phase 1a stub] received: ${userText}`,
    received_length: userText.length,
  });
}
