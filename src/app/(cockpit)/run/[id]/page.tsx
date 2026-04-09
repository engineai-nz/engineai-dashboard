/**
 * /run/[id] — Phase 1a single-run drill-down.
 *
 * Server component. Loads the run, its steps, and any artifacts for the
 * current tenant. Shows the trace inline. Renders the PRD artifact if
 * one exists.
 *
 * Phase 1c will replace the inline step trace with a proper expandable
 * drill-down + token visualisation. For 1a we want every input + output
 * visible at a glance.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';

// Live DB read per request — never prerender. See comment in (cockpit)/page.tsx.
export const dynamic = 'force-dynamic';

import {
  getRunStepsForRun,
  getArtifactsForRun,
  listRunsForTenant,
  type RunRow,
  type RunStepRow,
} from '@/lib/db/runs';
import { listProjectsForTenant } from '@/lib/db/projects';
import { getCurrentTenantId } from '@/lib/tenant/current';
import { PrdViewer } from '@/components/PrdViewer';

export default async function RunDrillDownPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = getCurrentTenantId();

  // Phase 1a doesn't have a getRunById helper — we filter the tenant list.
  // listRunsForTenant is bounded by RLS + tenant filter, so this is safe and
  // also enforces "you cannot view another tenant's run by id".
  const runs = await listRunsForTenant(tenantId);
  const run = runs.find((r) => r.id === id);
  if (!run) {
    notFound();
  }

  const [steps, artifacts, projects] = await Promise.all([
    getRunStepsForRun({ runId: run.id, tenantId }),
    getArtifactsForRun({ runId: run.id, tenantId }),
    listProjectsForTenant(tenantId),
  ]);

  const project = projects.find((p) => p.id === run.project_id);
  const prdArtifact = artifacts.find((a) => a.kind === 'prd');

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-wider text-muted hover:text-gold"
        >
          ← cockpit
        </Link>
        <h1 className="font-mono text-xl uppercase tracking-wider text-primary">
          {project?.name ?? `run ${run.id.slice(0, 8)}`}
        </h1>
        <RunMeta run={run} divisionSlug={project?.division_slug} />
      </header>

      {project ? (
        <section className="rounded-sm border border-border bg-surface px-6 py-4">
          <p className="font-mono text-xs uppercase tracking-wider text-muted">
            original brief
          </p>
          <p className="mt-2 whitespace-pre-wrap font-mono text-xs text-secondary">
            {project.brief}
          </p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-mono text-sm uppercase tracking-wider text-secondary">
          steps
        </h2>
        {steps.length === 0 ? (
          <p className="font-mono text-xs text-muted">no steps recorded</p>
        ) : (
          <ol className="space-y-3">
            {steps.map((step) => (
              <StepCard key={step.id} step={step} />
            ))}
          </ol>
        )}
      </section>

      {run.error ? (
        <section className="space-y-2">
          <h2 className="font-mono text-sm uppercase tracking-wider text-signal-error">
            error
          </h2>
          <pre className="whitespace-pre-wrap rounded-sm border border-signal-error/40 bg-surface px-4 py-3 font-mono text-xs text-signal-error">
            {run.error}
          </pre>
        </section>
      ) : null}

      {prdArtifact ? (
        <section className="space-y-3">
          <h2 className="font-mono text-sm uppercase tracking-wider text-secondary">
            PRD artifact
          </h2>
          <PrdViewer markdown={prdArtifact.content_markdown} />
        </section>
      ) : null}
    </div>
  );
}

function RunMeta({
  run,
  divisionSlug,
}: {
  run: RunRow;
  divisionSlug: string | undefined;
}) {
  const started = new Date(run.started_at);
  const finished = run.finished_at ? new Date(run.finished_at) : null;
  const duration = finished
    ? `${((finished.getTime() - started.getTime()) / 1000).toFixed(1)}s`
    : '—';
  return (
    <p className="font-mono text-xs text-muted">
      {divisionSlug ?? '?'} · {run.status} ·{' '}
      {started.toLocaleString('en-NZ')} · {duration}
    </p>
  );
}

function StepCard({ step }: { step: RunStepRow }) {
  return (
    <li className="rounded-sm border border-border bg-surface px-4 py-3">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-sm uppercase tracking-wider text-gold">
          {step.step_name}
        </p>
        <span className="font-mono text-xs text-muted">{step.status}</span>
      </div>
      {step.step_name === 'linear_post' ? (
        <LinearPostSummary step={step} />
      ) : null}
      <details className="mt-2">
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-secondary hover:text-primary">
          input + output
        </summary>
        <div className="mt-2 space-y-2">
          <pre className="overflow-x-auto rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs text-secondary">
{`input: ${JSON.stringify(step.input_json, null, 2)}`}
          </pre>
          {step.output_json ? (
            <pre className="overflow-x-auto rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs text-secondary">
{`output: ${JSON.stringify(step.output_json, null, 2)}`}
            </pre>
          ) : null}
        </div>
      </details>
    </li>
  );
}

/**
 * One-line human summary of a linear_post step, rendered above the
 * generic JSON details so the audit view doesn't force the user to
 * expand the payload to understand what happened.
 *
 * Three shapes:
 *   - skipped (no linear_issue_id was set on the brief)
 *   - complete (comment posted — show the URL if we got one back)
 *   - failed (show the error message, run is still complete because
 *     linear post is a post-run side effect per Phase 1b decisions.md)
 */
function LinearPostSummary({ step }: { step: RunStepRow }) {
  const output = (step.output_json ?? {}) as Record<string, unknown>;

  // Skipped path — explicit skip marker in output_json.
  if (output.skipped === true) {
    return (
      <p className="mt-2 font-mono text-xs text-muted">
        linear post skipped · no issue ID on brief
      </p>
    );
  }

  if (step.status === 'failed') {
    const errorMessage =
      typeof output.error_message === 'string'
        ? output.error_message
        : 'unknown error';
    return (
      <p className="mt-2 font-mono text-xs text-signal-error">
        linear post failed · {errorMessage}
      </p>
    );
  }

  if (step.status === 'complete') {
    const url = typeof output.url === 'string' ? output.url : null;
    if (url !== null) {
      return (
        <p className="mt-2 font-mono text-xs text-signal-live">
          linear comment posted ·{' '}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gold"
          >
            view on linear →
          </a>
        </p>
      );
    }
    return (
      <p className="mt-2 font-mono text-xs text-signal-live">
        linear comment posted
      </p>
    );
  }

  // pending / running fallthrough — shouldn't happen in Phase 1b since
  // the pipeline is synchronous, but render something sensible anyway.
  return (
    <p className="mt-2 font-mono text-xs text-muted">
      linear post · {step.status}
    </p>
  );
}
