/**
 * PrdViewer — Phase 1a.
 *
 * Renders an artifact's markdown content in a readable column. Phase 1a
 * uses a deliberate "just plain text in a mono font" rendering — no
 * markdown parser dependency yet. Phase 1b can add react-markdown if the
 * PRD output gets rich enough to need it.
 *
 * Whitespace is preserved with `whitespace-pre-wrap` so the agent's own
 * heading + bullet structure shows through.
 */

export function PrdViewer({ markdown }: { markdown: string }) {
  return (
    <article className="rounded-sm border border-border bg-surface px-6 py-6">
      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-primary">
        {markdown}
      </pre>
    </article>
  );
}
