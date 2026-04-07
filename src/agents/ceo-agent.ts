import { google } from "@ai-sdk/google";
import { tool } from "ai";
import { z } from "zod";
import { MOCK_PROJECTS } from "@/lib/data";

const DEFAULT_MODEL = "gemini-2.0-flash-001";

export const ceoAgent = {
  model: google(DEFAULT_MODEL),
  system: `You are the CEO Agent, the primary strategic orchestrator for the EngineAI Dashboard. 
Your goal is to provide high-level oversight and real-time metrics to the Founder.

Tone: Professional, strategic, precise, and confident. Use New Zealand English (e.g., "organisation", "optimise").
Style: Minimalist and action-oriented. No corporate fluff.

Capabilities:
- You can query project statuses (e.g., "Jackson Construction").
- You can retrieve financial metrics like Monthly Recurring Revenue (MRR) and Token Burn.
- You provide "Deep Dive" reports when asked.

When a user asks about a specific project or metric, use the appropriate tool to fetch the data and then present it in a strategic context. 
If you don't have the data, be transparent but professional.`,

  tools: {
    getProjectStatus: tool({
      description: 'Get the current status and stage of a specific project.',
      inputSchema: z.object({
        projectName: z.string().describe('The name of the project to query.'),
      }),
      execute: async ({ projectName }) => {
        const project = MOCK_PROJECTS.find(p => 
          p.name.toLowerCase().includes(projectName.toLowerCase())
        );
        if (!project) return { error: `Project "${projectName}" not found in current portfolio.` };
        return {
          name: project.name,
          status: project.status,
          stage: project.stage,
          division: project.division,
          lastUpdated: new Date().toISOString(),
        };
      },
    }),
    getFinancialMetrics: tool({
      description: 'Get financial metrics like MRR or Token Burn.',
      inputSchema: z.object({
        metricType: z.enum(['mrr', 'token_burn']).describe('The type of financial metric to retrieve.'),
        scope: z.enum(['global', 'project']).optional().default('global'),
        projectName: z.string().optional().describe('Project name if scope is project.'),
      }),
      execute: async ({ metricType, scope, projectName }) => {
        // Mock data logic
        if (metricType === 'mrr') {
          return {
            type: 'MRR',
            value: '$142,500',
            trend: '+12% vs last month',
            currency: 'NZD',
            lastUpdated: new Date().toISOString(),
          };
        } else {
          const burnValue = projectName?.toLowerCase().includes('jackson') ? '$1,240' : '$8,420';
          return {
            type: 'Token Burn',
            value: burnValue,
            trend: 'Optimised (-5%)',
            currency: 'USD',
            scope: projectName || 'Global',
            lastUpdated: new Date().toISOString(),
          };
        }
      },
    }),
  },
};
