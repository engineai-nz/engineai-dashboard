/**
 * Cockpit home — Phase 1a.
 *
 * Wires the BriefForm (client) and RunHistory (server) into the shell.
 * This is the surface the founder sees: submit a brief, watch the run
 * appear in the history below, click into it for the trace + PRD.
 */

import { BriefForm } from '@/components/BriefForm';
import { RunHistory } from '@/components/RunHistory';

// Cockpit home reads live tenant data on every request — never prerender.
// Without this, next build fails because the dev-tenant guard fires in
// NODE_ENV=production during static export.
export const dynamic = 'force-dynamic';

export default function CockpitHome() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <section>
        <h1 className="font-mono text-xl uppercase tracking-wider text-primary">
          Executive Cockpit
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Phase 1a — Internal Loop Proof. Submit a brief, the CEO agent runs
          Discovery → PRD, the artifact persists.
        </p>
      </section>

      <BriefForm />

      <RunHistory />
    </div>
  );
}
