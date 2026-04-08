/**
 * Division placeholder route — Phase 1a chrome only.
 *
 * IMPORTANT: This is a *placeholder*, not FR4. The PRD's FR4 (division-scoped
 * agent dashboards) lands in Phase 2. Phase 1a only proves the route exists
 * and is reachable from the cockpit shell. Do not stuff division logic in
 * here without updating docs/phase1-plan.md.
 */

const KNOWN_DIVISIONS = ['biab', 'skunkworks', 'modular', 'desktop'] as const;
type Division = (typeof KNOWN_DIVISIONS)[number];

function isKnownDivision(slug: string): slug is Division {
  return (KNOWN_DIVISIONS as readonly string[]).includes(slug);
}

export default async function DivisionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const known = isKnownDivision(slug);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          division
        </p>
        <h1 className="mt-1 font-mono text-xl uppercase tracking-wider text-primary">
          {slug}
        </h1>
      </header>

      <div className="rounded-sm border border-border bg-surface px-6 py-8">
        {known ? (
          <p className="font-mono text-xs uppercase tracking-wider text-muted">
            placeholder · division view lands in phase 2 (fr4)
          </p>
        ) : (
          <p className="font-mono text-xs uppercase tracking-wider text-signal-error">
            unknown division · expected one of:{' '}
            {KNOWN_DIVISIONS.join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
}
