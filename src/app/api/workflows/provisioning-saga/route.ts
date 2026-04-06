import { serve } from "@upstash/workflow/nextjs";
import { z } from "zod";
import { updateSagaState, updateStepStatus, getSagaByProjectId } from "@/lib/provisioning";
import { createRepository, deleteRepository } from "@/lib/github";
import crypto from "crypto";

const ProvisioningPayloadSchema = z.object({
  project_id: z.string().uuid(),
  repo_name: z.string(),
  org_name: z.string().default('engine-ai'),
});

/**
 * ProvisioningSaga - Durable workflow for multi-tenant instance production.
 * Fulfills ADR-004 (Saga Pattern), ADR-005 (Sealed Envelope), and FR12 (Industrial Cloner).
 */
export const { POST } = serve(async (context) => {
  const payload = ProvisioningPayloadSchema.parse(context.requestPayload);
  const { project_id, repo_name, org_name } = payload;

  const initialSaga = await getSagaByProjectId(project_id);
  if (!initialSaga) throw new Error(`CRITICAL: Saga record missing for project ${project_id}`);

  try {
    // Step 1: GitHub Repository Creation
    await context.run("github-provisioning", async () => {
      const idempotencyKey = crypto.randomUUID();
      await updateSagaState(initialSaga.id, 'creating_repo');
      const repo = await createRepository(org_name, repo_name);
      await updateStepStatus(initialSaga.id, 'github', 'completed', idempotencyKey);
      return repo;
    });

    // Step 2: Supabase Project Provisioning (Mocked for Phase 1)
    await context.run("supabase-provisioning", async () => {
      const idempotencyKey = crypto.randomUUID();
      await updateSagaState(initialSaga.id, 'provisioning_db');
      // await supabaseAdmin.projects.create(...)
      await updateStepStatus(initialSaga.id, 'supabase', 'completed', idempotencyKey);
    });

    // Step 3: Secret Injection (Sealed Envelope Pattern)
    await context.run("secret-injection", async () => {
      const idempotencyKey = crypto.randomUUID();
      await updateSagaState(initialSaga.id, 'injecting_secrets');
      // Secrets are handled by the deterministic environment, not passed in payload.
      await updateStepStatus(initialSaga.id, 'vercel', 'completed', idempotencyKey);
    });

    // Finalise
    await updateSagaState(initialSaga.id, 'active');

  } catch (error: any) {
    // Compensating Transaction: Rollback resources if failed
    await context.run("saga-rollback", async () => {
      // Re-fetch saga to avoid stale closure state during failure audit
      const currentSaga = await getSagaByProjectId(project_id);
      if (!currentSaga) return;

      await updateSagaState(currentSaga.id, 'rolling_back', error);

      // Rollback GitHub if it was completed
      if (currentSaga.github_status === 'completed') {
        await deleteRepository(org_name, repo_name);
        await updateStepStatus(currentSaga.id, 'github', 'rolled_back');
      }

      // Rollback Supabase if it was completed (Placeholder for Phase 2)
      if (currentSaga.supabase_status === 'completed') {
        console.log(`SUPABASE ROLLBACK: Decommissioning database for ${project_id}`);
        await updateStepStatus(currentSaga.id, 'supabase', 'rolled_back');
      }

      await updateSagaState(currentSaga.id, 'failed', error);
    });
    throw error;
  }
});
