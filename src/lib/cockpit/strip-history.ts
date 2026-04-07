/**
 * Trust boundary helper.
 *
 * Mobile / browser callers post `{ messages: UIMessage[] }` to cockpit
 * routes. Anything past the last user message in that array is forged —
 * the server must never re-feed assistant or tool history that the
 * browser claims happened. ENG-97 lesson, paid in blood on the prior tree.
 *
 * stripToLastUserText() is the ONLY allowed entry point for trusting any
 * field on a posted UIMessage[].
 */

type Part = { type: string; text?: string } | Record<string, unknown>;
type UIMessage = {
  role?: string;
  content?: string;
  parts?: Part[];
  [key: string]: unknown;
};

export function stripToLastUserText(messages: unknown): string | null {
  if (!Array.isArray(messages)) return null;

  // Walk from the end, find the last entry whose role === 'user'. Ignore
  // anything else — assistant, tool, system, unknown.
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as UIMessage;
    if (!m || typeof m !== 'object') continue;
    if (m.role !== 'user') continue;

    // Prefer plain string content (v5 shape).
    if (typeof m.content === 'string' && m.content.trim().length > 0) {
      return m.content.trim();
    }

    // Fall back to the v6 parts array — only the 'text' parts, joined.
    if (Array.isArray(m.parts)) {
      const text = m.parts
        .filter(
          (p): p is { type: string; text: string } =>
            typeof p === 'object' &&
            p !== null &&
            (p as { type?: unknown }).type === 'text' &&
            typeof (p as { text?: unknown }).text === 'string',
        )
        .map((p) => p.text)
        .join('\n')
        .trim();
      if (text.length > 0) return text;
    }

    // Last user message had no readable text — stop scanning.
    return null;
  }

  return null;
}
