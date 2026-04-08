/**
 * POST /api/cockpit/submit-brief
 *
 * Phase 1a: structured brief submission. Body shape:
 *   { name: string, brief: string, division_slug: string }
 *
 * Creates a projects row, runs the CEO pipeline inline (await), returns
 * { project_id, run_id, artifact_id }. No streaming in 1a — Phase 1c
 * adds Vercel Workflows + streaming Generative UI.
 *
 * Node runtime per docs/decisions.md.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createProject, updateProjectStatus } from '@/lib/db/projects';
import { runCeoPipeline } from '@/lib/agents/ceo-agent';
import { getCurrentTenantId } from '@/lib/tenant/current';
import { sanitiseError } from '@/lib/cockpit/sanitize-error';

const KNOWN_DIVISIONS = ['biab', 'skunkworks', 'modular', 'desktop'] as const;

const BodySchema = z.object({
  name: z.string().min(1).max(200),
  brief: z.string().min(10).max(8000),
  division_slug: z.enum(KNOWN_DIVISIONS),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid body', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const tenantId = getCurrentTenantId();

  const project = await createProject({
    tenantId,
    name: parsed.data.name,
    brief: parsed.data.brief,
    divisionSlug: parsed.data.division_slug,
  });

  // Transition to 'running' immediately so the audit view never shows a
  // project stuck in 'pending' while its pipeline is mid-execution. The
  // CEO pipeline manages its own `runs` row lifecycle — this is the
  // project-level mirror.
  await updateProjectStatus({ id: project.id, tenantId, status: 'running' });

  try {
    const result = await runCeoPipeline({
      projectId: project.id,
      projectName: project.name,
      brief: project.brief,
      divisionSlug: project.division_slug,
      tenantId,
    });
    await updateProjectStatus({
      id: project.id,
      tenantId,
      status: 'complete',
    });
    return NextResponse.json({
      project_id: project.id,
      run_id: result.run.id,
      artifact_id: result.artifact.id,
    });
  } catch (err) {
    // The CEO pipeline already sanitised the error before throwing, but
    // pass it through sanitiseError again so any error originating outside
    // the pipeline (e.g. createProject failure path that would otherwise
    // never reach here) is still safe.
    const sanitised = sanitiseError(err);
    // Best-effort rollback of the project row to 'failed' so the audit view
    // doesn't leave an orphan 'pending' or 'running' project behind. If THIS
    // update also fails, log it but still return the original pipeline error
    // so the user sees the real cause, not the rollback failure.
    await updateProjectStatus({
      id: project.id,
      tenantId,
      status: 'failed',
    }).catch((updateErr) => {
      console.error(
        '[submit-brief] failed to mark project as failed after pipeline error:',
        updateErr,
      );
    });
    return NextResponse.json(
      {
        project_id: project.id,
        error_code: sanitised.code,
        error: sanitised.message,
      },
      { status: 500 },
    );
  }
}
