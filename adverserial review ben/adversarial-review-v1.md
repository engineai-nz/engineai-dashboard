# Adversarial Review: EngineAI Dashboard PRD v1
**Date:** 2026-04-04
**Reviewers:** Claude (Opus 4.6), Codex (GPT-5.4)
**PRD Author:** Wardo (via BMAD/Gemini)

---

## Verdict

This PRD is a strategy deck wearing a product-spec costume. The vision is strong but the document collapses agent loops, workflow durability, integration protocols, governance, and commercial promises into one blob of buzzwords and calls it an architecture. Before Joe writes epics, the following must be resolved.

---

## P0 - Must Fix Before Epics

### 1. Agent Architecture Has No Decision Record
**Both reviewers flagged this as the #1 issue.**

The PRD commits to Vercel AI SDK v6 + Vercel Workflows + MCP as if they form one coherent execution layer. They don't.

| Component | What it actually does | What the PRD thinks it does |
|---|---|---|
| **Vercel AI SDK v6** | TypeScript SDK for LLM streaming, tool calling, structured output | Full multi-agent orchestration backbone |
| **Vercel Workflows** | Durable step-function execution (separate product, separate billing) | Self-healing agent recovery built into AI SDK |
| **MCP** | Protocol for exposing tools/resources to LLMs | Universal integration bus, governance model, agent-to-agent comms |

**Required action:** Write an Architecture Decision Record (ADR) evaluating at minimum:
- Vercel AI SDK + Workflows (current choice)
- LangGraph (purpose-built stateful multi-agent workflows)
- Temporal or Inngest (production-grade durable execution)
- CrewAI (hierarchical agent teams - half the PRD already imitates this framing)

**Codex verdict:** "Vercel AI SDK v6 is a defensible choice for a TypeScript agent layer and typed UI streaming, but it is not, by itself, the right answer to multi-agent orchestration with durable workflows." The honest architecture if staying on Vercel: AI SDK for agent loops, Workflow for durability, Supabase for app state, MCP selectively, direct APIs where MCP adds friction.

**Refs:** prd.md L24, L26, L63, L83, L104, L121, L232, L247

### 2. MCP Misunderstanding
NFR11 mandates 100% of integrations use MCP. This is cargo culting.

- MCP doesn't replace direct APIs, webhooks, OAuth, RBAC, or tenant isolation
- Stripe billing, webhook handlers, and operational control planes are worse through MCP
- FR19 (OpenClaw Bridge) describes agent-to-agent comms via MCP. MCP isn't designed for that.

**Required action:** Classify integrations into MCP-suitable (tool exposure to LLMs) vs direct API (webhooks, billing, auth). Drop the 100% mandate.

**Refs:** prd.md L95, L109, L150, L155-158, L255

### 3. FRs Not Tagged by Phase
21 functional requirements with no phase labels. The MVP section (L173-183) says Cockpit + CEO Agent + Discovery-to-PRD + 3 MCP connections. But FR4 (division dashboards), FR6-8 (intelligence hub), FR11 (hot-loading), FR12-14 (autonomous code/PRs), FR15-18 (social/reports/support/IT), FR19 (OpenClaw bridge) are all listed without phase assignment.

**Required action:** Tag every FR as MVP / Phase 2 / Phase 3 / Backlog before writing epics.

**Refs:** prd.md L199-232

---

## P1 - Serious Gaps

### 4. Success Criteria Are Fantasy Metrics
| Claim | Problem |
|---|---|
| 100% Golden Template pass rate | Zero-defect rate. Not real. No measurement methodology. |
| 0% Refactor Rate (first 5 deliveries) | No AI system produces zero-edit production output. |
| 92%+ handoff accuracy | How measured? What's a "handoff"? What's "accurate"? |
| < 24h to production-ready deployment | For what scope? Landing page vs full-stack app? |
| 100% task completion rate (NFR7) | Network partitions, API deprecations, token expiry exist. |
| 90% self-healing rate (NFR8) | Self-healing what? Needs failure type taxonomy. |

**Codex addition:** "Verified by the CEO Agent audit logs" means the system grades its own homework.

**Required action:** Replace slogans with measurable targets. Define baseline, measurement method, acceptable threshold, and evaluator for each.

**Refs:** prd.md L39, L45, L49-50, L54-55, L128, L247-248

### 5. Internal Contradictions
| Contradiction | Location |
|---|---|
| "Greenfield" classification but "battle-hardened" in summary | L9 vs L20 |
| MVP is "internal agency automation" but success criteria promise SME delivery | L170 vs L40 |
| "Zero founder headcount increase" but mandatory approval gates | L45 vs FR3 (L204) |
| Multi-tenant isolation (NFR4) vs one-click clone (Phase 2) - different architectural approaches | L100 vs L143 vs L185 |
| Full 6-stage pipeline in summary, but Phase 1 only commits to Discovery-to-PRD | L20 vs L181 |
| "One-click clone" is Phase 2 but NFR10 already requires <60min clone time | L185 vs L252 |

**Required action:** Resolve each contradiction. Clearly separate aspirational vision from Phase 1 commitments.

### 6. Agent Execution Model Is Hand-waving
FR9/FR10/FR20/FR21 and the RBAC matrix define an org chart, not an execution model. Missing:
- State machine for handoffs
- Ownership/lease model for work items
- Conflict resolution when agents touch the same artifact
- Context window strategy
- Idempotency/replay safety for side effects
- Duplicate side-effect prevention across retries

**Codex:** "The PRD says 'standard communication protocol' and moves on. That is hand-waving over the hardest part."

**Required action:** Define the actual execution model. How does Agent A hand work to Agent B? What data structure? What happens on failure mid-handoff?

**Refs:** prd.md L24, L92, L149, L214-215, L231-232

---

## P2 - Missing Sections

### 7. No Cost Model
"Token burn" appears as a UI metric, a centralized oversight feature, a tiering concept, and a future optimisation target. But there's no:
- Per-tenant budget caps or enforcement
- Cost alerts or circuit breakers
- Model routing economics
- Margin assumptions
- "Internal Tier: Unlimited token usage" is not a business model, it's a warning

**Required action:** Add cost modelling section. At 50 tenants running autonomous workflows, the API bill could be enormous.

### 8. Missing Edge Cases
| Gap | Impact |
|---|---|
| Token budget exhaustion mid-workflow | Workflow hangs or produces garbage |
| API rate limiting (Linear, Notion, GitHub) at 50 tenants | Cascading failures |
| Rollback after agent deploys bad code (FR12-14) | Approval gates aren't rollback |
| Agent version pinning during hot-load (FR11) | In-flight workflows break |
| Agent conflict resolution | Two agents modifying same resource |
| Model fallback policy | Primary model goes down |
| Branch/environment recovery after autonomous code changes | FR13 gives agents git power |

### 9. No Unknowns Section
A greenfield PRD that has answers for everything is a red flag. Real PRDs say "we don't know X yet." This one doesn't.

**Required action:** Add an explicit Unknowns/Assumptions section covering at least: model reliability, API stability of dependencies, actual build time benchmarks, tenant scaling characteristics.

---

## P3 - Gemini Smell (Cosmetic but Telling)

### 10. Buzzword Density
The PRD uses 7+ metaphors that conflict with each other: nervous system, assembly line, cockpit, agentic OS, bleeding edge, flywheel, forge. Pick one framing and stick with it.

### 11. Symmetrical Structure
Every section has exactly the right number of bullet points. Real PRDs are messy and lopsided because some areas need more detail. This reads as generated.

### 12. Passive Voice on Hard Problems
"Must be wrapped in Vercel Workflows" (by whom?), "must utilize standardized MCP servers" (who builds them?), "must support 50 concurrent instances" (based on what capacity planning?).

### 13. Missing Input Artifacts
The frontmatter references `technical-agent-orchestration-frameworks-research-2026-04-04.md` but this file doesn't exist in the repo. The research trail looks performative.

---

## Recommended Next Steps

1. **Write the ADR** for agent architecture before anything else. This is the foundation.
2. **Tag all FRs by phase.** No epic writing until MVP boundary is crisp.
3. **Replace fantasy metrics** with measurable, baselined targets.
4. **Resolve contradictions** (greenfield vs battle-hardened, MVP scope vs success criteria).
5. **Add missing sections:** Cost model, Unknowns, Execution model, Failure taxonomy.
6. **Strip the marketing copy.** A PRD is for builders, not investors.

---

*Claude reviewed the PRD structure, architecture claims, and internal consistency. Codex independently verified against primary documentation for Vercel AI SDK 6, Vercel Workflow, MCP, LangGraph, CrewAI, Temporal, and Inngest.*
