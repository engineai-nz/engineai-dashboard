import { createAgent, ToolLoopAgent } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { upsertTaskStatus, getTaskLedgerEntry } from "@/lib/tasks";

/**
 * sreAgent - Specialized Specialist Tier agent for autonomous self-healing.
 * Fulfills FR21 and ADR-002.
 */
export const sreAgent = createAgent({
  model: google("gemini-2.0-flash-001"),
  name: "Supervisor SRE",
  description: "Autonomous self-healing agent for monitoring and repairing Vercel Workflows.",
  system: `You are the Supervisor SRE Agent. Your mission is to ensure 24h+ operational stability.
  You autonomously repair stalled or failed workflows by inspecting the Task Ledger and executing repairs.
  Use NZ English (e.g. organisation, optimise). Be clinical and precise.`,
  tools: {
    inspectTask: {
      description: "Retrieve a task ledger entry for detailed diagnostic analysis.",
      parameters: z.object({ taskId: z.string().uuid() }),
      execute: async ({ taskId }) => {
        const entry = await getTaskLedgerEntry(taskId);
        return entry;
      }
    },
    repairTask: {
      description: "Reset a failed task to 'pending' to trigger a workflow retry.",
      parameters: z.object({ taskId: z.string().uuid(), rationale: z.string() }),
      execute: async ({ taskId, rationale }) => {
        await upsertTaskStatus(taskId, 'pending');
        return { status: 'repaired', rationale };
      }
    }
  }
});
