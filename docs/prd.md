---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish"]
inputDocuments: ["_bmad-output/planning-artifacts/A-Product-Brief/product-brief.md", "_bmad-output/planning-artifacts/research/technical-agent-orchestration-frameworks-research-2026-04-04.md"]
documentCounts: {briefCount: 1, researchCount: 1, brainstormingCount: 0, projectDocsCount: 0}
classification:
  projectType: "SaaS B2B / Agentic OS"
  domain: "AI Automation & Business Orchestration"
  complexity: "High"
  projectContext: "Greenfield"
workflowType: 'prd'
---

# Product Requirements Document - EngineAI Dashboard

**Author:** Wardo
**Date:** 2026-04-04

## Executive Summary

The **EngineAI Dashboard** is the autonomous operational nervous system designed to transition Engine AI from founder-led operations to founder-led orchestration. It unifies a fragmented tool stack (Linear, Notion, Telegram, Drive) into a single "Executive Cockpit," enabling founders to oversee a "Digital Assembly Line" of specialized AI agents. This system automates the 6-stage delivery pipeline—from Discovery to MRR—aiming for a 24-hour turnaround for full-stack production builds. Built as a "battle-hardened" internal tool, it serves as the production-grade blueprint for a rapidly deployable "Business in a Box" template for SME clients.

### What Makes This Special

*   **Action-Oriented Orchestration:** Unlike passive tracking tools, the dashboard is an "Agentic OS" that initiates autonomous actions (e.g., generating SOWs, triggering builds) through a hierarchical board of ENGINE Agents.
*   **Managerial Transparency:** It eliminates "black box" operational blindness by enforcing total visibility into agent reasoning and handoffs, allowing founders to delegate with 100% confidence.
*   **Decoupled Intelligence:** It leverages **Vercel AI SDK v6** and **Model Context Protocol (MCP)** to provide a modular, high-accuracy execution layer that is structurally separated from the oversight UI, ensuring reliability and ease of replication.

## Project Classification

*   **Project Type:** SaaS B2B / Agentic OS
*   **Domain:** AI Automation & Business Orchestration
*   **Complexity:** High (Multi-agent orchestration, complex tool integrations)
*   **Project Context:** Greenfield (New core system architecture)

## Success Criteria

### User Success

*   **Founder-Orchestrator:** Reclaim 80% of administrative time by delegating 100% of document generation (PRDs, SOWs) to the "Digital Assembly Line."
*   **SME Client:** Experience "Operational Peace" by receiving a fully functional, branded business engine within 24 hours of onboarding.

### Business Success

*   **Scalability:** Support 10x client growth with zero increase in founder-level administrative headcount.
*   **Consistency:** Achieve a 100% "Golden Template" pass rate where agent outputs require no manual correction before client delivery.

### Technical Success

*   **Durability:** 100% task completion rate for long-running workflows (Discovery -> Build) using Vercel Workflows to handle retries and state recovery.
*   **Orchestration Accuracy:** 92%+ accuracy in multi-agent handoffs, verified by the "CEO Agent" audit logs.

### Measurable Outcomes

*   **TTB (Time to Build):** < 24 hours from input to production-ready deployment.
*   **Refactor Rate:** 0% manual edits required for the first 5 end-to-end client deliveries.

## Product Scope

### MVP - Minimum Viable Product

*   **Core Dashboard:** Unified "Executive Cockpit" for internal Engine AI operations.
*   **Digital Assembly Line:** Autonomous execution of the 6-stage pipeline (Discovery to MRR).
*   **Integrations:** Linear (Task tracking), Notion (Knowledge base), Supabase (Durable state), Vercel AI SDK v6 (Orchestration).

### Growth Features (Post-MVP)

*   **BIAB Cloning:** Automated GitHub template replication and environment injection for SME clients.
*   **Notification Hub:** Real-time agent status updates via Telegram/Discord.
*   **Client Portal:** Simplified dashboard view for non-technical SME owners.

### Vision (Future)

*   **Agent Marketplace:** Plug-and-play BMB modules for industry-specific automations (e.g., Real Estate Agent, Legal Clerk).
*   **Autonomous Optimization:** Agents that self-correct the pipeline based on "Token Burn" and "Conversion" metrics.

## User Journeys

### 1. The "Executive Tap" (Founder-Orchestrator)
**Narrative:** Ben, a high-level strategist, uses the dashboard to move from "doing" to "directing." He initiates a complex 6-stage delivery pipeline with a single tap, overseeing the autonomous creation of production-grade client deliverables while on the move.
**Value:** Strategic Freedom and Unified Clarity.

### 2. The "Silent Recovery" (Agentic / Technical Edge Case)
**Narrative:** An autonomous agent encounters a technical bottleneck during a long-running scrape. The system uses durable Vercel Workflows to self-correct and log the reasoning for the "CEO Agent" to review. The founder is kept informed but not burdened with the "fix."
**Value:** Operational Confidence and Managerial Transparency.

### 3. The "Business in a Box" (SME Client)
**Narrative:** Sarah, a non-technical business owner, experiences "Instant Professionalism" as she onboards to her cloned dashboard. Her "Agent Swarm" immediately begins triaging leads and automating her backend, giving her the "Operational Peace" she was promised.
**Value:** Instant Professionalism and Flywheel Momentum.

### Journey Requirements Summary
*   **Mobile-Responsive Oversight:** Real-time status and "Approval" actions optimized for mobile.
*   **Managerial Audit Logs:** Transparent, readable logs of agent reasoning and "thought loops."
*   **Durable State Management:** Persistent tracking for long-running autonomous workflows (24h+).
*   **White-Label/Multi-Tenant UI:** Ability to clone the dashboard structure with tenant-specific branding and agent configurations.
*   **Integrations Cockpit:** A simplified UI for non-technical users to connect third-party tools (Stripe, Gmail, etc.) via MCP.

## Domain-Specific Requirements

### Compliance & Regulatory
*   **Multi-Tenant Isolation:** Cryptographically enforced data separation in Supabase to prevent cross-client data leakage.
*   **Immutable Audit Logs:** Non-deletable logs of all agent "thought loops," tool calls, and state transitions.

### Technical Constraints
*   **Durable Execution:** All autonomous pipelines must be wrapped in Vercel Workflows to ensure 100% completion regardless of transient failures.
*   **Schema Enforcement:** Mandatory Zod validation for all agent-to-tool communications.
*   **Latency Targets:** < 500ms for UI state updates; < 2s for "Agent Thinking" visual feedback.

### Integration Requirements
*   **MCP Standardization:** All third-party tool integrations (Google, Linear, etc.) must utilize Model Context Protocol servers.
*   **Webhook Resilience:** Robust retry logic for all inbound and outbound event triggers.

### Risk Mitigations
*   **Mandatory Approval Gates:** High-leverage financial or structural actions require explicit human sign-off via the "Executive Cockpit."
*   **Reasoning Fallbacks:** Automated escalation to the "CEO Agent" or human operator upon sub-agent failure or confidence drops below 85%.

## Innovation & Novel Patterns

### Detected Innovation Areas
*   **Agentic Orchestration Engine:** A shift from passive data tracking to active, event-driven autonomous execution of a 6-stage delivery pipeline.
*   **Hierarchical Executive Board:** A novel governance structure for AI agents that enforces "Managerial Transparency" through a CEO-led audit trail.
*   **Durable Agentic State:** Implementation of persistent, self-healing agent workflows using Vercel Workflows, enabling 24h+ autonomous task completion.

### Market Context & Competitive Landscape
*   **The "Anti-SaaS" Approach:** While traditional SaaS centralizes data, the EngineAI Dashboard decentralizes intelligence via BMB modules while centralizing oversight. 
*   **White-Label Replication:** Unlike bespoke AI builds, this is designed for "git clone" scalability, making high-tier AI agency infrastructure accessible to SMEs.

### Validation Approach
*   **The "Golden Template" Audit:** Comparing agent-generated outputs (PRDs, SOWs) against manually perfected versions to achieve a 100% match rate.
*   **Stress-Testing Handoffs:** Simulating API failures and site-structure changes to verify the "Silent Recovery" capabilities of Vercel Workflows.

### Risk Mitigation
*   **The "Manual Override":** A persistent "HITL" (Human-in-the-loop) requirement for all high-leverage outputs (Financial, Structural).
*   **Reasoning Transparency:** If an agent's confidence score drops, the UI forces a "Show Reasoning" state to allow immediate human audit.

## SaaS B2B / Agentic OS Specific Requirements

### Project-Type Overview
The EngineAI Dashboard is a specialized SaaS B2B platform designed for autonomous business orchestration. It functions as an "Agentic OS" where the primary users are high-level human orchestrators and a hierarchical class of autonomous digital employees.

### Technical Architecture Considerations

### Tenant Model (Isolated Replication)
*   **Blueprint-to-Instance:** The dashboard architecture must support a "One-Click Clone" model.
*   **Data Isolation:** Each white-label instance requires an isolated Supabase environment to ensure zero data leakage between SME clients.
*   **Centralized Oversight (Internal):** A separate "Agency View" for Engine AI founders to monitor cross-instance performance and token burn.

### RBAC Matrix (Human & Agentic)
*   **Owner (Human):** Root permissions; can override any agent reasoning or tool call.
*   **Manager Agent (CEO):** Permissions to read/write across all modules and trigger sub-workflows.
*   **Worker Agent (Specialist):** Restricted permissions to specific MCP tools (e.g., the "Finance Agent" cannot read the "Onboarding Agent's" logs).
*   **Client (Human):** Restricted access to branded dashboard metrics and specific approval gates.

### Integration List
*   **Project Management:** Linear (via MCP).
*   **Knowledge Base:** Notion (via MCP).
*   **Communication:** Telegram/Discord (Real-time notifications), Gmail (Lead capture).
*   **Financials:** Stripe (MRR tracking), Stripe (Token billing/burn monitoring).
*   **Code/Ops:** GitHub (Deployment triggers), Google Drive (Asset storage).

### Implementation Considerations

### Subscription & Usage Tiers
*   **Internal Tier:** Unlimited token usage, full pipeline control.
*   **BIAB Standard Tier:** Limited agent slots (e.g., 3 specialized agents), per-client token burn quotas.
*   **Enterprise Tier:** Custom agent builds, white-label branding, unlimited BMB module access.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy
*   **MVP Approach:** Problem-Solving (Internal Agency Automation).
*   **Resource Requirements:** 1 Senior Full-Stack Dev (Agentic focus), 1 System Architect (Workflow/Supabase).

### MVP Feature Set (Phase 1)
**Core User Journeys Supported:**
*   The "Executive Tap" (Founders initiate pipeline).
*   The "Silent Recovery" (Autonomous self-healing).

**Must-Have Capabilities:**
*   Unified Oversight UI (Cockpit).
*   CEO Agent & Triage logic.
*   Discovery-to-PRD autonomous workflow.
*   Linear/Notion/Supabase MCP connections.

### Post-MVP Features
**Phase 2 (Growth):**
*   "One-Click Clone" white-label mechanism.
*   Telegram/Discord notification hub.
*   SME Client simplified view.

### Phase 3 (Expansion):
*   Plug-and-play BMB Agent Marketplace.
*   Full autonomous lead-to-MRR lifecycle (zero-tap).

### Risk Mitigation Strategy
*   **Technical Risks:** Early PoC for Vercel Workflows; Zod schema enforcement for all tool calls.
*   **Market Risks:** User-testing the "Executive Cockpit" with founders daily to ensure "glanceable certainty."
*   **Resource Risks:** Prioritizing the 6-stage pipeline over "Nice-to-have" UI animations.

## Functional Requirements

### Executive Oversight & Portfolio Management (The Cockpit)
*   **FR1: [Mobile Oversight]** Founders can query system state (MRR, Project stages, Token burn) via Natural Language (Mobile/Telegram) and receive real-time Generative UI summaries.
*   **FR2: [Manual Override]** Founder-Orchestrators can manually initiate, pause, or terminate any stage of the autonomous pipelines.
*   **FR3: [Approval Gates]** Founders can review, approve, or reject high-leverage agent outputs (PRDs, SOWs, PRs) before they are finalized.
*   **FR4: [Division Routing]** The Dashboard provides separate, specialized views for each product division (**BIAB, SkunkWorks, Modular, Desktop**) with tailored KPIs and financial metrics for each.
*   **FR5: [Audit Drill-down]** Founders can drill down into any specific agent task to view detailed reasoning, tool-call logs, and handoff history.

### The Intelligence Hub (The Bleeding Edge)
*   **FR6: [Intelligence Hub]** The System includes a dedicated "Founders' Knowledge Centre" containing a living knowledge base, industry research archives, and an "Ideation Incubator."
*   **FR7: [Automated Intel Curation]** A specialized **Research Agent** autonomously scans pre-defined technical and industry sources to push summarized "Bleeding Edge" updates to the Hub.
*   **FR8: [The Idea Forge]** Founders can input raw ideas or voice notes into the Hub, triggering a **Brainstorming Agent** to generate initial technical feasibility assessments or BMB workflow sketches.

### Core System Implementation (The Engine)
*   **FR9: [Full Hierarchical Suite]** The System possesses a full workforce (Executive, Managerial, and Specialist tiers) initialized in the `.agent/` directory and active within the Vercel AI SDK environment.
*   **FR10: [Agentic Workforce]** The System assigns specific agents (Marketing, Finance, Product, Support) to govern and execute tasks across the portfolio divisions.
*   **FR11: [BMB Hot-Loading]** The Dashboard can ingest new Agent and Workflow definitions created via the **BMAD Builder** and activate them within the live environment without a reboot.

### Autonomous Production & Git Engineering
*   **FR12: [Industrial Cloner]** The System autonomously clones 'Golden Templates' and executes **AST-based Code Refactoring** to inject client-specific logic and schemas.
*   **FR13: [PR Management]** Agents autonomously manage the Git lifecycle: committing changes, opening Pull Requests, and resolving basic merge conflicts.
*   **FR14: [Validation Guard]** The System runs automated build and lint checks on all agent-generated code before notifying founders for review.

### Specialized Departmental Workflows
*   **FR15: [Social Content Loop]** The Marketing Agent can research trends, draft branded content, and execute scheduled posts to LinkedIn/X via MCP.
*   **FR16: [Report Engine]** The Data Agent queries Supabase/Linear to generate weekly performance reports and Markdown-based slide decks.
*   **FR17: [Account & Support Desk]** The Client Services Agent triages client queries and provides real-time status updates by querying the internal Workflow Supervisor.
*   **FR18: [IT & Infrastructure]** The Support Agent performs system-level tasks (API key rotation, log monitoring, RLS management) via MCP.

### Multi-Agent Interoperability
*   **FR19: [OpenClaw Bridge]** The System provides an **Agent-to-Agent Communication Gateway**, enabling external "OpenClaw" agents to securely query internal dashboard agents for data.
*   **FR20: [Handoff Integrity]** The System enforces a standard communication protocol for all internal and external agent handshakes.
*   **FR21: [The Supervisor]** A dedicated **SRE Agent** monitors all active Vercel Workflows and autonomously attempts 'Self-Healing' upon detecting stalls or errors.

## Non-Functional Requirements

### Performance
*   **NFR1: [Responsiveness]** Core dashboard UI elements must respond to human interactions within 500ms.
*   **NFR2: [Agent Feedback]** Generative UI cards or "Agent Reasoning" indicators must begin streaming within 2s of a query.
*   **NFR3: [Data Freshness]** Business health metrics (MRR, Token Burn) must synchronize with source-of-truth integrations (Stripe, Supabase) at least every 60 seconds.

### Security
*   **NFR4: [Multi-Tenant Isolation]** Cryptographically enforced data separation must ensure that no tenant can access another's logs, schemas, or third-party API keys.
*   **NFR5: [Tool-Call Validation]** All autonomous agent tool calls must be strictly validated against Zod schemas before execution.
*   **NFR6: [Immutable Audit]** System logs must be tamper-proof and retained for at least 12 months for compliance and "Managerial Transparency" audits.

### Reliability & Durability
*   **NFR7: [Durable Workflows]** 100% of autonomous workflows spanning > 5 minutes must use Vercel Workflows to survive serverless timeout or cold-start events.
*   **NFR8: [Self-Healing Rate]** The System should autonomously resolve > 90% of transient API or handoff failures without human intervention.

### Scalability
*   **NFR9: [Tenant Throughput]** The Dashboard must support simultaneous operations for up to 50 concurrent SME client instances.
*   **NFR10: [Rapid Deployment]** The white-label cloning process (Git clone + Supabase setup + Env injection) must complete in under 60 minutes.

### Integration
*   **NFR11: [MCP Standardization]** 100% of external system integrations (Linear, Notion, Drive, etc.) must utilize standardized Model Context Protocol servers.

