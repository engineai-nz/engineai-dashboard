/**
 * RunHistory — Phase 1a server component.
 *
 * Reads the current tenant's projects + runs from Supabase via the
 * service-role wrappers (sealed envelope — no key in the browser) and
 * renders a flat list. Each row links to /run/[id] for the drill-down.
 *
 * This is the cockpit's audit view in 1a. Step 5 ships it flat;
 * Phase 1c adds the proper drill-down with step inputs, outputs, and
 * tokens visible inline.
 */

import Link from 'next/link';
import { listProjectsForTenant, type ProjectRow } from '@/lib/db/projects';
import { listRunsForTenant, type RunRow } from '@/lib/db/runs';
import { getCurrentTenantId } from '@/lib/tenant/current';

export async function RunHistory() {
  const tenantId = getCurrentTenantId();
  const [projects, runs] = await Promise.all([
    listProjectsForTenant(tenantId),
    listRunsForTenant(tenantId),
  ]);

  const projectsById = new Map<string, ProjectRow>(
    projects.map((p) => [p.id, p]),
  );

  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between">
        <h2 className="font-mono text-sm uppercase tracking-wider text-secondary">
          run history
        </h2>
        <span className="font-mono text-xs text-muted">
          {runs.length} run{runs.length === 1 ? '' : 's'} · {projects.length}{' '}
          project{projects.length === 1 ? '' : 's'}
        </span>
      </header>

      {runs.length === 0 ? (
        <EmptyState hasProjects={projects.length > 0} />
      ) : (
        <ul className="divide-y divide-border rounded-sm border border-border bg-surface">
          {runs.map((run) => {
            const project = projectsById.get(run.project_id);
            return <RunRowItem key={run.id} run={run} project={project} />;
          })}
        </ul>
      )}

      {projects.length > 0 && runs.length === 0 ? (
        <ProjectsList projects={projects} />
      ) : null}
    </section>
  );
}

function RunRowItem({
  run,
  project,
}: {
  run: RunRow;
  project: ProjectRow | undefined;
}) {
  const started = new Date(run.started_at);
  const finished = run.finished_at ? new Date(run.finished_at) : null;
  const durationMs = finished ? finished.getTime() - started.getTime() : null;

  return (
    <li>
      <Link
        href={`/run/${run.id}`}
        className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-background"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm text-primary">
            {project?.name ?? `(project ${run.project_id.slice(0, 8)}…)`}
          </p>
          <p className="font-mono text-xs text-muted">
            {project?.division_slug ?? '?'} ·{' '}
            {started.toLocaleString('en-NZ')}
            {durationMs !== null ? ` · ${(durationMs / 1000).toFixed(1)}s` : ''}
          </p>
        </div>
        <StatusBadge status={run.status} />
      </Link>
    </li>
  );
}

function ProjectsList({ projects }: { projects: ProjectRow[] }) {
  return (
    <div className="space-y-2 rounded-sm border border-border bg-surface px-4 py-3">
      <p className="font-mono text-xs uppercase tracking-wider text-muted">
        projects without runs (seed data or failed inserts)
      </p>
      <ul className="space-y-1">
        {projects.map((p) => (
          <li
            key={p.id}
            className="font-mono text-xs text-secondary"
          >
            · {p.name}{' '}
            <span className="text-muted">({p.division_slug})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ hasProjects }: { hasProjects: boolean }) {
  return (
    <div className="rounded-sm border border-border bg-surface px-6 py-8 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-muted">
        {hasProjects
          ? 'projects exist but no runs yet · submit a brief above'
          : 'no runs yet · submit a brief above to start the discovery → prd loop'}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: RunRow['status'] }) {
  const styles: Record<RunRow['status'], string> = {
    pending: 'text-muted',
    running: 'text-teal',
    complete: 'text-signal-live',
    failed: 'text-signal-error',
  };
  return (
    <span
      className={`font-mono text-xs uppercase tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
  );
}
