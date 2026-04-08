'use client';

/**
 * CockpitShell — top-level chrome for the Engine AI cockpit.
 *
 * Provides:
 *   - Top nav with EngineAI OS branding, system status pill, primary CTA
 *   - Shared cockpit state via React Context (system override flag)
 *
 * Why Context and not render-prop: render-prop trips on the
 * server -> client component boundary in Next 16 ("Functions are not
 * valid as a child of Client Components"). React Context is the
 * RSC-compatible alternative. See docs/decisions.md (2026-04-07).
 */

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type CockpitState = {
  systemOverride: boolean;
  setSystemOverride: (value: boolean) => void;
};

const CockpitContext = createContext<CockpitState | null>(null);

export function useCockpit(): CockpitState {
  const ctx = useContext(CockpitContext);
  if (!ctx) {
    throw new Error('useCockpit must be used inside <CockpitShell>');
  }
  return ctx;
}

export function CockpitShell({ children }: { children: ReactNode }) {
  const [systemOverride, setSystemOverride] = useState(false);

  const value = useMemo<CockpitState>(
    () => ({ systemOverride, setSystemOverride }),
    [systemOverride],
  );

  return (
    <CockpitContext.Provider value={value}>
      <div className="flex min-h-screen flex-col bg-background text-primary">
        <TopNav />
        <main className="flex-1 px-8 py-10">{children}</main>
      </div>
    </CockpitContext.Provider>
  );
}

function TopNav() {
  const { systemOverride, setSystemOverride } = useCockpit();
  return (
    <header className="flex items-center justify-between border-b border-border px-8 py-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm tracking-wider text-gold">
          ENGINEAI · OS
        </span>
        <span className="text-xs text-secondary">cockpit</span>
      </div>

      <div className="flex items-center gap-6">
        <StatusPill />
        <button
          type="button"
          onClick={() => setSystemOverride(!systemOverride)}
          className={`font-mono text-xs uppercase tracking-wider transition-colors ${
            systemOverride
              ? 'text-signal-error'
              : 'text-secondary hover:text-primary'
          }`}
        >
          {systemOverride ? 'override · on' : 'override · off'}
        </button>
        <button
          type="button"
          className="rounded-sm border border-gold px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-gold transition-colors hover:bg-gold-muted"
        >
          New Brief
        </button>
      </div>
    </header>
  );
}

function StatusPill() {
  // Phase 1a: hardcoded "live". Real status comes from /api/cockpit/health
  // in Phase 1b. The shell is intentionally chrome-only at this step.
  return (
    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-secondary">
      <span className="h-1.5 w-1.5 rounded-full bg-signal-live" />
      <span>system · live</span>
      <span className="text-muted">·</span>
      <span className="text-muted">dev-tenant-001</span>
    </div>
  );
}
