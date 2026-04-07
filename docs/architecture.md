---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/A-Product-Brief/product-brief.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/research/technical-agent-orchestration-frameworks-research-2026-04-04.md
  - GEMINI.md
workflowType: 'architecture'
project_name: 'EngineAI Dashboard'
user_name: 'Wardo'
date: '2026-04-04'
lastStep: 8
status: 'complete'
completedAt: '2026-04-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The system is an **Agentic OS** driven by a hierarchical workforce (Executive, Managerial, Specialist) built on **Vercel AI SDK v6**. The core architectural driver is the **Industrial Cloner (FR12)**, which executes AST-based refactoring to transform a "Master Template" into a branded client instance. The **SRE Agent (FR21)** provides monitoring for the **24h+ Digital Assembly Line**, ensuring handoff integrity across 6 stages (Discovery to MRR).

**Non-Functional Requirements:**
Architecture is governed by **Reliability (NFR7)** via Vercel Workflows for state recovery and **Security (NFR4)** through cryptographically enforced multi-tenant isolation in Supabase. Performance targets require **500ms UI responsiveness** and **2s agent reasoning feedback**.

**Scale & Complexity:**
- **Primary Domain:** Autonomous Business Orchestration / "BIAB Factory"
- **Complexity Level:** High (Multi-tenant provisioning, AST-refactoring, Durable swarms)
- **Estimated Architectural Components:** ~12 (Executive Cockpit, Workflow Engine, MCP Gateway, AST Refactorer, GitHub/Vercel Provisioner, Intelligence Hub).

### The "BIAB Factory" Reproduction Engine

**1. The Master Template (The Seed):**
- **Injection-Ready Scaffold:** Next.js 16 base with a `_blueprint/` directory containing `BLUEPRINT.json` metadata and `setup.ts` for AST transformations.
- **Template Slots:** Code-level markers (e.g., `/* @bmad-inject branding */`) for deterministic refactoring.
- **BMAD-Lite Runtime:** A lightweight agentic execution layer bundled with the template, removing the need for the full BMAD CLI in client instances.

**2. Automated Provisioning Chain:**
- **Step 1:** GitHub API triggers a repo generation from the Master Template.
- **Step 2:** Supabase Management API provisions an isolated database organization and project.
- **Step 3:** Vercel API creates the project, links the GitHub repo, and injects Supabase secrets into Environment Variables.
- **Step 4:** The deployment triggers the `setup.ts` AST-refactorer to inject branding (via `BRAND.md` tokens) and agent configurations.

**3. The 3-Document Handover Chain:**
- `audit.json` (Discovery Input) -> `statement-of-work.md` (Strategic Pitch) -> `technical-blueprint.json` (Cloner Instructions).

### Technical Constraints & Dependencies
- **Vercel AI SDK v6:** Mandatory for hierarchical agent loops and MCP tool support.
- **Vercel Workflows:** Mandatory for any autonomous task spanning > 5 minutes to survive serverless timeouts.
- **Supabase:** Source-of-truth for multi-tenant memory, RLS policies, and encrypted secret storage.
- **Model Context Protocol (MCP):** Universal interface for all third-party integrations (Linear, Gmail, Drive).

### Cross-Cutting Concerns Identified
- **Surgical Sovereignty:** The "Surgical Lock" protocol that pauses durable workflows and yields 100% control to the human "Conductor."
- **Deep-Link Portals:** The bridge between the Web Cockpit and the local **Antigravity IDE** for manual refactors.
- **Immutable Auditability:** Non-deletable, tamper-proof logs of agent "thought loops" to eliminate operational blindness.

## Starter Template Evaluation

### Primary Technology Domain
**Full-Stack Agentic OS / Executive Cockpit** (Next.js 16 + Vercel AI SDK v6 + Supabase).

### Selected Starter: Hybrid `create-next-app` + Vercel AI SDK v6 Scaffold

**Rationale for Selection:**
As a private, high-performance tool for Ben and Joe, the architecture prioritizes **"Glanceable Certainty"** and **"Surgical Intervention"** over generic SaaS features. We bypass multi-tenant boilerplates in favor of a lean **Next.js 16.2** core, manually layering in the **Vercel AI SDK** and **Workflows** to ensure absolute control over the "Factory" reproduction logic.

**Initialization Command:**

```bash
npx create-next-app@latest engineai-dashboard --typescript --tailwind --eslint --app --turbopack --empty --yes
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
**Next.js 16.2** on **React 19.2**. Includes an `AGENTS.md` file by default to guide AI coding agents in following project conventions.

**Styling Solution:**
**Tailwind CSS 4.0**, providing the foundation for the "F1 HUD" cockpit and dynamic brand injection.

**Build Tooling:**
**Turbopack** (stable) for Rust-based development speed. Stable **Partial Pre-Rendering (PPR)** and the `use cache` directive enable high-performance telemetry streaming.

**Code Organization:**
Standard App Router structure (`app/`, `components/`, `lib/`). Extended with `agents/` for the resident swarm and `workflows/` for durable execution logic.

## Core Architectural Decisions

### Data Architecture & Provisioning

**Provisioning Strategy: Total Isolation (Supabase Management API)**
- **Decision:** Every "Business in a Box" instance receives a dedicated, isolated Supabase project.
- **Rationale:** Ensures maximum security (NFR4) and prevents cross-tenant data leakage. Enables client-specific database scaling and custom schema extensions.

**Lifecycle Strategy: Conditional Patching**
- **Decision:** Non-breaking "Structural Patches" (security/performance) are auto-applied via GitHub Actions. "Feature Shifts" (UI/branding updates) trigger a notification in the Cockpit for human review.
- **Rationale:** Maintains 24-hour delivery standards while preserving "Surgical Sovereignty" over visual or functional changes.

### Authentication & Security

**Auth Provider: Supabase Auth (SSR Mode)**
- **Decision:** Use `@supabase/ssr` for cookie-based session management in Next.js 16.
- **Handover Method:** **Magic Links** for initial client onboarding to minimize "Time-to-Value."
- **Security Pattern:** Middleware-based session proxying for all protected routes in the Executive Cockpit.

### API & Communication Patterns

**Orchestration: Vercel AI SDK v6 (Agent Class)**
- **Decision:** Standardize on the new `Agent` abstraction for reusable agent logic.
- **Telemetry:** **Hybrid Stream/Broadcast.** Use AI SDK Data Streams for active reasoning and **Supabase Realtime (Broadcast)** for background status updates (Progressive Ribbon).

### Frontend Architecture

**State Management: RSC-First + Zustand (v5.0.11)**
- **Decision:** Server Components handle 90% of the data. Zustand provides the lightweight client-side store for real-time HUD telemetry.
- **Performance:** Use Next.js 16 `use cache` for expensive tool-call results to ensure < 500ms responsiveness.

### Infrastructure & Deployment

**Hosting: Vercel (Edge & Workflows)**
- **Decision:** All agentic logic runs on Vercel Edge. All tasks > 5 mins are wrapped in **Vercel Workflows** (NFR7).
- **Reproduction Loop:** GitHub Template Repository API for instant "Master Blueprint" cloning.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
4 areas where AI agents could make different choices, resolved through standard protocols.

### Naming Patterns

**Database Naming:**
Strict `snake_case` for all tables and columns (e.g., `client_instances`, `research_blob`).

**API Naming:**
`kebab-case` for endpoint paths (e.g., `/api/industrial-cloner/trigger`). Structured response wrapper: `{ data, error, metadata }`.

**Code Naming:**
`PascalCase.tsx` for components, `kebab-case` for routes/files, and `camelCase` for logic/variables.

### Structure Patterns

**Project Organization: Feature-First**
Files are grouped by feature domain in `src/features/`. 
- `features/industrial-cloner/`: Repositories, provisioners, and AST logic.
- `features/executive-cockpit/`: Telemetry cards, F1 HUD, and manual overrides.
- `features/intelligence-hub/`: Research agents and JSONB knowledge stores.

**File Structure Patterns:**
Next.js App Router (`app/`) is reserved for routing and metadata only. All business logic must reside within the corresponding `features/` directory.

### Format Patterns

**Data Exchange Formats:**
Automated **Data Transformer** pattern: Code uses `camelCase`, while the Supabase client wrapper automatically maps to `snake_case` for database persistence.

**Intelligence Storage:**
Flexible **JSONB "Knowledge Blob"** for the Intelligence Hub, allowing agents to store unstructured research data without schema migrations.

### Communication Patterns

**Event System Patterns:**
`domain:action` (e.g., `factory:clone_started`) for Supabase Realtime Broadcasts.

**State Management Patterns:**
RSC-First for data loading. Zustand used exclusively for high-frequency "Live HUD" telemetry updates.

### Enforcement Guidelines

**All AI Agents MUST:**
- Validate all tool calls against Zod schemas.
- Adhere to `BRAND.md` tokens via Tailwind CSS variables.
- Wrap tasks > 5 mins in Vercel Workflows.
- Use AST-based refactoring for "Factory" reproduction to eliminate dead code.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
engineai-dashboard/
├── .github/
│   └── workflows/
│       └── factory-patches.yml      # CI for client template updates
├── .agent/                          # Local agent context (BMAD specific)
├── public/
│   └── branding/                    # Base assets for brand injection
├── src/
│   ├── app/                         # Next.js 16 App Router (Routing only)
│   │   ├── (auth)/                  # Magic Link & SSO routes
│   │   ├── (cockpit)/               # Main dashboard layout/routes
│   │   ├── api/                     # Route Handlers
│   │   │   ├── factory/             # Cloner webhooks
│   │   │   └── chat/                # AI SDK stream endpoints
│   │   └── layout.tsx
│   ├── features/                    # Feature-First Business Logic
│   │   ├── cockpit/
│   │   │   ├── components/          # TelemetryCard, ProgressiveRibbon
│   │   │   ├── hooks/               # useTelemetry, useSurgicalLock
│   │   │   └── store.ts             # Zustand "Shift-Lights" store
│   │   ├── intelligence/
│   │   │   ├── agents/              # ResearchAgent.ts
│   │   │   └── KnowledgeBlob.tsx    # JSONB explorer component
│   │   ├── factory/
│   │   │   ├── provisioners/        # github.ts, vercel.ts, supabase.ts
│   │   │   ├── refactor/            # setup.ts (AST Engine)
│   │   │   └── REPRODUCTION_MAP.yml # The Factory's DNA
│   │   └── shared/                  # Common UI & Utils
│   ├── agents/                      # Vercel AI SDK Agent Definitions
│   │   ├── ceo.ts
│   │   ├── specialist.ts
│   │   └── sre.ts
│   ├── workflows/                   # Vercel Workflows (Durable Logic)
│   │   ├── delivery-pipeline.ts     # 6-stage lifecycle
│   │   └── self-healing.ts          # SRE auto-fix logic
│   ├── lib/                         # Core infrastructure
│   │   ├── supabase/                # server.ts, client.ts (Auto-Mapping)
│   │   ├── mcp/                     # Standardized tool connectors
│   │   └── utils.ts                 # tailwind-merge, etc.
│   ├── middleware.ts                # SSR Session Proxy
│   └── AGENTS.md                    # Rules for Resident Agents
├── _blueprint/                      # Master Template Seed (Isolated Workspace)
├── tailwind.config.ts               # With BRAND.md CSS variables
├── next.config.ts                   # withWorkflow wrapper
├── package.json
└── tsconfig.json
```

### Requirements to Structure Mapping

**Executive Oversight (The Cockpit):**
- **Requirements:** FR1-FR5 (Mobile Oversight, Manual Override, Approval Gates).
- **Location:** `src/features/cockpit/`.

**The Intelligence Hub:**
- **Requirements:** FR6-FR8 (Founders' Knowledge Centre, Automated Intel, Idea Forge).
- **Location:** `src/features/intelligence/`.

**The BIAB Factory (Industrial Cloner):**
- **Requirements:** FR12-FR14 (Industrial Cloner, PR Management, Validation Guard).
- **Location:** `src/features/factory/`.

**Agentic Workforce & Durable Logic:**
- **Requirements:** FR9-FR11, FR21 (Hierarchical Suite, BMB Hot-Loading, The Supervisor).
- **Location:** `src/agents/` and `src/workflows/`.

## Architecture Validation Results

### Coherence Validation ✅
The architecture achieves a seamless balance between the **Private Executive Cockpit** and **Isolated Client Nodes**. The choice of **Total Isolation** via the Supabase Management API fulfills security mandates, while the **Hybrid Telemetry Bridge** (Stream/Broadcast) ensures real-time UI responsiveness for long-running workflows.

### Requirements Coverage Validation ✅
- **FR12-14 (Factory):** Fully supported via the `features/factory/` provisioners and isolated `_blueprint/` seed.
- **FR1-5 (Cockpit):** Supported by the RSC-first data fetching and Zustand "Shift-Lights" telemetry.
- **FR6-8 (Intelligence):** Supported by the JSONB "Knowledge Blob" and Research Agent classes.

### Implementation Readiness Validation ✅
The architecture is locked with specific technology versions (Next.js 16.2, Vercel AI SDK v6, Zustand v5.0.11). The **Data Transformer** pattern and **Feature-First** structure provide the necessary guardrails for multiple AI agents to implement concurrently without conflicts.

### Architecture Completeness Checklist
- [x] Project context and complexity assessed
- [x] Critical decisions documented with verified versions
- [x] Feature-First structure and boundaries established
- [x] Naming, formatting, and communication patterns defined
- [x] Requirements-to-structure mapping verified

**Overall Status: READY FOR IMPLEMENTATION**
**Confidence Level: HIGH**
