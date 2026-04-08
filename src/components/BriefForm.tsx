'use client';

/**
 * BriefForm — Phase 1a + 1b.
 *
 * Client component. Posts a structured brief to /api/cockpit/submit-brief
 * and shows the resulting run id (or error). No streaming yet — Phase 1c
 * adds Vercel Workflows + streaming Generative UI cards.
 *
 * Submit blocks until the CEO pipeline finishes. That can be 20-60s for
 * the discovery + drafting LLM calls. The submit button shows a clear
 * loading state.
 *
 * Phase 1b: optional Linear issue ID field. When set and valid, the
 * CEO pipeline posts the resulting PRD as a comment on that Linear
 * issue via the sealed Linear MCP wrapper. When empty, the linear_post
 * step is logged as skipped.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const DIVISIONS = [
  { slug: 'biab', label: 'Business in a Box' },
  { slug: 'skunkworks', label: 'Skunkworks' },
  { slug: 'modular', label: 'Modular' },
  { slug: 'desktop', label: 'Desktop' },
] as const;

// Same regex the API route enforces — keep the two in sync or surface
// a server-side error if they drift. Matches strings like "ENG-123",
// "BIAB-42", etc. The TEAM key is all-caps letters + optional digits.
const LINEAR_ISSUE_ID_PATTERN = /^[A-Z][A-Z0-9]*-\d+$/;

type SubmitResult =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | {
      kind: 'success';
      project_id: string;
      run_id: string;
      artifact_id: string;
    }
  | { kind: 'error'; message: string; project_id?: string };

export function BriefForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [brief, setBrief] = useState('');
  const [division, setDivision] = useState<(typeof DIVISIONS)[number]['slug']>(
    'biab',
  );
  const [linearIssueId, setLinearIssueId] = useState('');
  const [result, setResult] = useState<SubmitResult>({ kind: 'idle' });
  const [isPending, startTransition] = useTransition();

  // Client-side validation for the optional Linear issue ID. Empty is
  // always valid (skips the Linear post). Non-empty must match the
  // pattern or we short-circuit the submit.
  const linearIssueIdTrimmed = linearIssueId.trim();
  const linearIssueIdError =
    linearIssueIdTrimmed !== '' &&
    !LINEAR_ISSUE_ID_PATTERN.test(linearIssueIdTrimmed)
      ? 'format should be TEAM-123 (e.g. ENG-42)'
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (linearIssueIdError !== null) {
      return;
    }
    setResult({ kind: 'pending' });

    const payload: Record<string, unknown> = {
      name,
      brief,
      division_slug: division,
    };
    if (linearIssueIdTrimmed !== '') {
      payload.linear_issue_id = linearIssueIdTrimmed;
    }

    let res: Response;
    try {
      res = await fetch('/api/cockpit/submit-brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      setResult({
        kind: 'error',
        message: err instanceof Error ? err.message : 'network error',
      });
      return;
    }

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      setResult({
        kind: 'error',
        message:
          (typeof body.error === 'string' ? body.error : null) ??
          `submit failed with status ${res.status}`,
        project_id:
          typeof body.project_id === 'string' ? body.project_id : undefined,
      });
      return;
    }

    const success: SubmitResult = {
      kind: 'success',
      project_id: String(body.project_id),
      run_id: String(body.run_id),
      artifact_id: String(body.artifact_id),
    };
    setResult(success);
    setName('');
    setBrief('');
    setLinearIssueId('');
    // Refresh the server components (RunHistory) so the new run shows up.
    startTransition(() => router.refresh());
  }

  const submitting = result.kind === 'pending' || isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm border border-border bg-surface p-6"
    >
      <div className="space-y-2">
        <label
          htmlFor="brief-name"
          className="font-mono text-xs uppercase tracking-wider text-secondary"
        >
          project name
        </label>
        <input
          id="brief-name"
          type="text"
          required
          maxLength={200}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. BIAB landing page rebuild"
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="brief-division"
          className="font-mono text-xs uppercase tracking-wider text-secondary"
        >
          division
        </label>
        <select
          id="brief-division"
          value={division}
          onChange={(e) =>
            setDivision(e.target.value as (typeof DIVISIONS)[number]['slug'])
          }
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-primary focus:border-gold focus:outline-none"
        >
          {DIVISIONS.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="brief-text"
          className="font-mono text-xs uppercase tracking-wider text-secondary"
        >
          brief
        </label>
        <textarea
          id="brief-text"
          required
          minLength={10}
          maxLength={8000}
          rows={6}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Describe the problem, the user, and what done looks like..."
          className="w-full resize-y rounded-sm border border-border bg-background px-3 py-2 font-mono text-sm text-primary placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="brief-linear"
          className="font-mono text-xs uppercase tracking-wider text-secondary"
        >
          linear issue <span className="text-muted">(optional)</span>
        </label>
        <input
          id="brief-linear"
          type="text"
          value={linearIssueId}
          onChange={(e) => setLinearIssueId(e.target.value)}
          placeholder="ENG-42"
          aria-invalid={linearIssueIdError !== null}
          aria-describedby="brief-linear-hint"
          className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-sm uppercase text-primary placeholder:text-muted placeholder:normal-case focus:border-gold focus:outline-none aria-[invalid=true]:border-signal-error"
        />
        <p
          id="brief-linear-hint"
          className={`font-mono text-[10px] ${
            linearIssueIdError !== null ? 'text-signal-error' : 'text-muted'
          }`}
        >
          {linearIssueIdError ??
            'when set, the PRD will post as a comment on this issue after the run completes'}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={submitting || linearIssueIdError !== null}
          className="rounded-sm border border-gold px-4 py-2 font-mono text-xs uppercase tracking-wider text-gold transition-colors hover:bg-gold-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'running pipeline…' : 'submit brief'}
        </button>

        <ResultBadge result={result} />
      </div>
    </form>
  );
}

function ResultBadge({ result }: { result: SubmitResult }) {
  if (result.kind === 'idle') return null;
  if (result.kind === 'pending') {
    return (
      <span className="font-mono text-xs uppercase tracking-wider text-teal">
        discovery → drafting…
      </span>
    );
  }
  if (result.kind === 'success') {
    return (
      <a
        href={`/run/${result.run_id}`}
        className="font-mono text-xs uppercase tracking-wider text-signal-live hover:text-gold"
      >
        run complete · view →
      </a>
    );
  }
  return (
    <span
      className="font-mono text-xs uppercase tracking-wider text-signal-error"
      title={result.message}
    >
      failed · {result.message.slice(0, 48)}
    </span>
  );
}
