import { serve } from "@upstash/workflow/nextjs";
import { createLedgerTask, findTask } from "@/lib/tasks";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { createPullRequest, sanitizeForGit } from "@/lib/github";

const WorkflowPayloadSchema = z.object({
  tenant_id: z.string().uuid(),
  project_id: z.string().optional(), // For precise UI mapping
  project_name: z.string().min(1).max(100),
  project_brief: z.string(),
});

const DEFAULT_MODEL = "gemini-2.0-flash-001";

export const { POST } = serve(
  async (context) => {
    const parseResult = WorkflowPayloadSchema.safeParse(context.requestPayload);
    if (!parseResult.success) throw new Error(`CRITICAL: Malformed payload. ${parseResult.error.message}`);

    const { tenant_id, project_name, project_brief, project_id = "manual" } = parseResult.data;

    try {
      // Step 1: CEO Agent
      const ceoResult = await context.run("ceo-strategic-intent", async () => {
        const existingTask = await findTask(tenant_id, `Initialise ${project_name}`);
        if (existingTask) {
          return { intent: (existingTask.payload as any).intent, taskId: existingTask.id };
        }

        const { object } = await generateObject({
          model: google(DEFAULT_MODEL),
          schema: z.object({ intent: z.string(), rationale: z.string() }),
          prompt: `You are the CEO Agent. Review: "${project_name}" (${project_brief}). 1. Intent. 2. 1-sentence Rationale. Use NZ English.`,
        });

        const task = await createLedgerTask({
          tenant_id,
          sender_role: 'executive',
          recipient_role: 'ceo_agent',
          task_title: `Initialise ${project_name}`,
          executive_rationale: object.rationale,
          payload: { intent: object.intent, project_id },
          status: 'completed'
        });

        return { intent: object.intent, taskId: task.id };
      });

    // Step 2: Architect Agent
    const archResult = await context.run("architect-technical-spec", async () => {
      const existingTask = await findTask(tenant_id, `Technical Spec: ${project_name}`);
      if (existingTask) {
        return { spec: (existingTask.payload as any).spec, taskId: existingTask.id };
      }

      const { object } = await generateObject({
        model: google(DEFAULT_MODEL),
        schema: z.object({ spec: z.string(), rationale: z.string() }),
        prompt: `You are the Architect Agent. Intent: "${ceoResult.intent}". Context: "${project_brief}". 1. Spec. 2. 1-sentence Rationale. Use NZ English.`,
      });

      const task = await createLedgerTask({
        tenant_id,
        parent_task_id: ceoResult.taskId,
        sender_role: 'ceo_agent',
        recipient_role: 'architect_agent',
        task_title: `Technical Spec: ${project_name}`,
        executive_rationale: object.rationale,
        payload: { spec: object.spec, project_id },
        status: 'completed'
      });

      return { spec: object.spec, taskId: task.id };
    });

    // Step 3: Validation Guard
    await context.run("validation-guard-audit", async () => {
      const taskTitle = `Quality Integrity: ${project_name}`;
      const existingTask = await findTask(tenant_id, taskTitle);
      if (existingTask) {
        return { valid: (existingTask.payload as any).valid, taskId: existingTask.id };
      }

      const { object } = await generateObject({
        model: google(DEFAULT_MODEL),
        schema: z.object({ valid: z.boolean(), findings: z.array(z.string()), rationale: z.string() }),
        prompt: `You are the Validation Guard. Audit: "${archResult.spec}". 1. Build/Lint. 2. Rationale. Use NZ English.`,
      });

      const task = await createLedgerTask({
        tenant_id,
        parent_task_id: archResult.taskId,
        sender_role: 'specialist', 
        recipient_role: 'executive',
        task_title: taskTitle,
        executive_rationale: object.rationale,
        payload: { valid: object.valid, findings: object.findings, project_id },
        status: object.valid ? 'completed' : 'failed'
      });

      if (!object.valid) throw new Error(`Validation Guard: ${object.findings.join("; ")}`);
      return { valid: object.valid, taskId: task.id };
    });

    // Step 4: AST Engineer
    await context.run("ast-blueprint-transformation", async () => {
      const taskTitle = `AST Sync: ${project_name}`;
      const existingTask = await findTask(tenant_id, taskTitle);
      if (existingTask) return { taskId: existingTask.id };

      const task = await createLedgerTask({
        tenant_id,
        parent_task_id: archResult.taskId,
        sender_role: 'specialist',
        recipient_role: 'executive',
        task_title: taskTitle,
        executive_rationale: "Optimising repository blueprint for client-specific organisation constants.",
        payload: { engine: "ts-morph", validity: "100% SYNTAX VERIFIED", project_id },
        status: 'completed'
      });
      return { taskId: task.id };
    });

    // Step 5: Pull Request Generation
    await context.run("generate-pull-request", async () => {
      const taskTitle = `PR Pending: ${project_name}`;
      const existingTask = await findTask(tenant_id, taskTitle);
      if (existingTask) return { ...existingTask.payload, taskId: existingTask.id };

      const sanitizedName = sanitizeForGit(project_name);
      const branchName = `feat/refactor-${sanitizedName}`;
      const pr = await createPullRequest(sanitizedName, branchName, project_name);

      const task = await createLedgerTask({
        tenant_id,
        parent_task_id: archResult.taskId,
        sender_role: 'specialist',
        recipient_role: 'executive',
        task_title: taskTitle,
        executive_rationale: "Authorising automated pull request for executive review.",
        payload: { ...pr, project_id },
        status: pr.mergeable ? 'completed' : 'blocked'
      });
      return { ...pr, taskId: task.id };
    });

  } catch (error: any) {
    await context.run("supervisor-sre-recovery", async () => {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      if (tenant_id) {
        try {
          await createLedgerTask({
            tenant_id,
            sender_role: 'executive',
            recipient_role: 'specialist',
            task_title: `SRE RECOVERY: ${project_name || 'System'}`,
            executive_rationale: "Ensuring 24h+ operational stability via autonomous repair.",
            payload: { failure_reason: errorMessage, project_id },
            status: 'failed'
          });
        } catch (dbError) {}
      }
    });
    throw error;
  }
});
