# Adversarial Review: Architecture Decision Document v1
**Date:** 2026-04-04
**Reviewers:** Claude (Opus 4.6), Codex (GPT-5.4)
**Doc Author:** Wardo (via BMAD/Gemini)
**Doc Type:** Architecture Decision Document
**AI-Generated:** Yes (Gemini via BMAD pipeline. Evidence: `GEMINI.md` listed as input in frontmatter; all five AI-generation signals present; buzzword density exceeds the already-flagged PRD; self-validating green checkmarks; zero unknowns; input artifacts do not exist in repo)

---

## Verdict

This document is labelled "Architecture Decision Document" but contains no decisions in any meaningful sense. It restates the PRD's technology choices with more directory structure detail but zero alternatives evaluation, zero failure analysis, and zero cost modelling. It does not address any of the six P0/P1 findings from the prior PRD review. Both reviewers independently reached the same conclusion: this is a generated summary wearing an architecture costume, and it grades itself "READY FOR IMPLEMENTATION" anyway. The project structure and naming patterns are useful scaffolding; everything else needs to be rewritten or added from scratch.

**What works:** The feature-first directory structure is sound. The naming conventions (snake_case DB, kebab-case API, PascalCase components) are sensible and consistent. The Supabase auto-mapping pattern is a good idea. The 3-Document Handover Chain is a clear artefact flow.

---

## Coverage Map

| Expected Section | Status |
|---|---|
| Technology choices with ADR/alternatives | **Missing entirely** |
| Data model / schema | **Missing entirely** |
| Sequence diagrams / flow diagrams | **Missing entirely** |
| API contracts (request/response shapes) | **Missing entirely** |
| Security threat model | **Missing entirely** |
| Cost model / budget ceiling | **Missing entirely** |
| Failure taxonomy / rollback strategy | **Missing entirely** |
| Unknowns / assumptions | **Missing entirely** |
| Phasing / MVP boundary | **Missing entirely** |
| Agent execution model (state machine, handoffs) | **Missing entirely** |
| Provisioning failure handling | **Missing entirely** |
| Performance measurement plan | **Missing entirely** |
| Project structure & naming conventions | **Present and strong** |
| Feature-to-directory mapping | **Present and strong** |
| Technology version pinning | **Present but weak** (versions listed, no justification) |
| Auth pattern | **Present but weak** (approach named, no threat model) |
| Telemetry pattern | **Present but weak** (two channels named, coordination undefined) |
| Requirements-to-structure mapping | **Present but weak** (FR1-14 + FR21 mapped; FR15-20 and NFR9-11 silently dropped) |

---

## P0 - Must Fix Before Implementation

### F001: This Is Not an ADR
**Category:** Architecture and Technology Fitness
**Action type:** `rewrite`
**Source:** `both`

The PRD review's #1 recommendation was: "Write an Architecture Decision Record evaluating at minimum: Vercel AI SDK + Workflows, LangGraph, Temporal/Inngest, CrewAI." The todo.md still lists this as an open task for Joe. This document is titled "Architecture Decision Document" but contains zero alternatives evaluation for any decision. Every technology choice is declared "Mandatory" or "Standardize on" with no trade-off analysis.

**Evidence:** Lines 54-57 ("Mandatory" declarations), lines 115-118 ("Standardize on the new Agent abstraction"), line 128 ("All agentic logic runs on Vercel Edge"). Cross-ref: adversarial-review-v1.md lines 16-35, todo.md line 6.

**Rationale:** An architecture without decision records is a spec that can't be challenged or evolved. When something goes wrong (and it will), there's no record of why a choice was made or what alternatives were rejected.

**Suggested fix:** For each major technology choice (agent framework, durable execution, multi-tenant strategy, edge vs serverless, telemetry pattern), write an ADR with: context, options evaluated, decision, trade-offs accepted. The prior PRD review listed four specific alternatives to evaluate.

### F002: PRD P0 Findings Not Addressed
**Category:** Internal Contradictions
**Action type:** `decision_needed`
**Source:** `both`

The v1 PRD review had 6 P0/P1 findings. The architecture doc resolves none of them:

| Prior Finding | Status in Architecture Doc |
|---|---|
| P0-1: No ADR | Not addressed (see F001) |
| P0-2: MCP 100% mandate is cargo culting | Still present. Line 57: "Universal interface for all third-party integrations" |
| P0-3: FRs not tagged by phase | FRs mapped to directories, not to phases. No MVP boundary. |
| P1-4: Fantasy metrics (100% pass rate, 0% refactor rate) | 500ms and 2s targets repeated without methodology (lines 30, 123) |
| P1-5: Internal contradictions | "Private tool for Ben and Joe" (line 72) vs multi-tenant BIAB factory persists |
| P1-6: Agent execution model is hand-waving | Agent file locations defined, execution semantics still missing |

**Evidence:** Cross-reference adversarial-review-v1.md findings 1-6 against architecture.md.

**Rationale:** Writing an architecture doc that ignores the review of the PRD it's based on defeats the purpose of the review process. The architecture should be the response to those findings, not a parallel document that pretends they don't exist.

**Suggested fix:** Before proceeding, explicitly address each prior P0/P1 finding. Resolve, defer with rationale, or disagree with evidence.

### F003: Provisioning Chain Has No Failure Handling
**Category:** Edge Cases and Failure Modes
**Action type:** `add_section`
**Source:** `both`

The 4-step Automated Provisioning Chain (lines 44-49) is a distributed transaction across GitHub API, Supabase Management API, Vercel API, and AST refactoring. There is no:
- Rollback if any step fails (e.g., GitHub repo created but Supabase provisioning fails = orphaned repo)
- Partial failure cleanup
- Idempotency keys
- Retry strategy with backoff
- State tracking for the provisioning process
- Human recovery path
- Timeout handling

**Evidence:** Lines 44-49. The "Conditional Patching" lifecycle (line 102) is not rollback; it's forward-only patching.

**Rationale:** This is the most dangerous path in the system. It creates resources across three external APIs. Partial failures here leave orphaned resources that are hard to find and clean up. At scale, this becomes an operational nightmare.

**Suggested fix:** Wrap the provisioning chain in a saga pattern or compensating transaction. Each step should have a corresponding undo. Track provisioning state in a dedicated table. Add a manual "recover/retry" path in the Cockpit.

### F004: Self-Validating Architecture
**Category:** AI-Generated Content Smell
**Action type:** `rewrite`
**Source:** `both`

Lines 256-276 are a "validation" section where the document grades itself. Every check is green. Every description is generic praise ("seamless balance," "fully supported," "locked with specific technology versions"). This is not validation. This is generated fluff that creates false confidence.

**Evidence:**
- "Coherence Validation: seamless balance" (line 258)
- "Requirements Coverage Validation: Fully supported" (lines 261-264) — but FR15-20 are silently dropped (see F005)
- "Implementation Readiness: locked with specific versions" (line 266) — version pinning is not readiness
- "READY FOR IMPLEMENTATION / Confidence Level: HIGH" (lines 275-276)

**Rationale:** A document that certifies itself is not trustworthy. Real validation requires external review, prototype spikes, and acknowledged risks.

**Suggested fix:** Delete the self-validation section. Replace with an honest "Risks and Open Questions" section. Let the adversarial review be the validation.

---

## P1 - Serious Gaps

### F005: Requirements Coverage Is Falsely Claimed
**Category:** Internal Contradictions
**Action type:** `resolve_contradiction`
**Source:** `codex`
**Confidence:** high

The "Requirements Coverage Validation" claims full coverage, but the mapping only covers FR1-14 and FR21. FR15-FR20 (Social Media Agent, Automated Reporting, Support Desk, IT Maintenance, OpenClaw Bridge, RBAC) silently vanish. NFR9-NFR11 are also unaccounted for.

**Evidence:** Architecture lines 240-254 vs PRD lines 224-232, 251-255. Codex confirmed via keyword search: FR15-FR20 do not appear anywhere in architecture.md.

**Rationale:** Claiming full coverage while silently dropping 6 FRs and 3 NFRs is either dishonest or the generator lost track. Either way, it means the architecture can't be trusted as a requirements traceability document.

**Suggested fix:** Either map FR15-20 and NFR9-11 to structure locations, or explicitly defer them to later phases with rationale.

### F006: Agent Execution Model Still Missing
**Category:** Architecture and Technology Fitness
**Action type:** `add_section`
**Source:** `both`

The architecture adds `agents/ceo.ts`, `agents/specialist.ts`, `agents/sre.ts` to the directory tree. That's an org chart, not an execution model. Still missing:
- State machine or FSM for agent handoffs
- Ownership/lease model for work items
- Conflict resolution when agents touch the same artefact
- Context window strategy (what gets passed between agents?)
- Idempotency/replay safety for side effects
- Message envelope format
- Retry semantics and duplicate prevention

**Evidence:** Lines 27, 116-118, 217-220. Prior review: adversarial-review-v1.md lines 87-100.

**Suggested fix:** Define the agent execution protocol. What data structure represents a handoff? What state machine governs task lifecycle? What happens when an agent fails mid-task? Draw the sequence diagram.

### F007: Total Isolation Cost Not Evaluated
**Category:** Architecture and Technology Fitness
**Action type:** `decision_needed`
**Source:** `both`

"Every BIAB instance receives a dedicated, isolated Supabase project" (line 99). No comparison to alternatives:
- Shared project with RLS (current Supabase recommended pattern)
- Schema-per-tenant
- Database-per-tenant within one project
- Hybrid isolation by tier

At 50 tenants, that's 50 Supabase projects with 50 Postgres instances, 50 auth configurations, 50 sets of secrets to rotate, and schema migrations that must fan out across all of them.

**Evidence:** Lines 98-101. Line 56 still references RLS as a core concern, but if the main isolation boundary is per-project, the role of RLS changes materially. The security story is muddled.

**Codex addition:** "Separate projects create operational sprawl, secret rotation overhead, migration fan-out, observability fragmentation, and cost. None of that is discussed."

**Suggested fix:** Write the ADR for multi-tenant strategy. Evaluate at least three approaches with cost/complexity trade-offs.

### F008: Vercel Edge for Agent Reasoning Is Questionable
**Category:** Architecture and Technology Fitness
**Action type:** `decision_needed`
**Source:** `both`

"All agentic logic runs on Vercel Edge" (line 128). Vercel Edge Functions have material constraints:
- Response must begin within 25 seconds
- Streaming tops out at 300 seconds
- Limited Node.js API compatibility
- No filesystem access
- Limited memory

LLM agent reasoning with multiple tool calls, retries, and context assembly is not a typical Edge workload. The doc says Workflows handle >5min tasks, but the boundary between Edge agent logic and Workflow durability is not specified.

**Codex addition:** "Vercel's own docs now recommend moving from Edge to Node.js for better performance/reliability" with citation to Vercel Edge runtime docs.

**Suggested fix:** Default to Node.js serverless functions for agent reasoning. Use Edge only where latency matters and the workload fits (e.g., middleware, simple streaming). Document the boundary.

### F009: No Data Model
**Category:** Missing Sections
**Action type:** `add_section`
**Source:** `claude`

For a system with multi-tenant isolation, agent state, workflow state, telemetry, a 6-stage delivery pipeline, and a JSONB knowledge store, there is no database schema anywhere. The only storage detail is "JSONB Knowledge Blob" (line 166) and a table naming convention.

What tables exist? What are the relationships? What columns does RLS enforce on? What does `client_instances` contain (mentioned in naming example, line 141)? What does `research_blob` store?

**Suggested fix:** Add an entity-relationship diagram and table definitions for at least: client instances, agent tasks, workflow state, telemetry events, knowledge blobs, provisioning records.

### F010: Hybrid Telemetry Coordination Undefined
**Category:** Architecture and Technology Fitness
**Action type:** `add_section`
**Source:** `claude`

Two real-time channels push to the same UI: AI SDK Data Streams for active reasoning and Supabase Realtime Broadcast for background status (lines 117-118). Not specified:
- How they coordinate on the client
- What happens when they disagree about state
- Which channel is authoritative
- Reconnection/catch-up strategy
- Client-side reconciliation logic

**Suggested fix:** Define the telemetry protocol. Which channel owns which state? How does the client merge them? What's the fallback if one channel drops?

---

## P2 - Missing Sections

### F011: No Security Threat Model
**Category:** Missing Sections
**Action type:** `add_section`
**Source:** `claude`

Auth pattern defined (Supabase Auth SSR, Magic Links) but no threat model. For a system where AI agents have GitHub write access (FR12-14), Supabase Management API access, and Vercel deployment access, the attack surface is significant. No analysis of: agent privilege escalation, credential exposure in agent context, tenant data leakage via shared agent context, MCP server trust boundaries.

### F012: Internal Naming Contradictions
**Category:** Internal Contradictions
**Action type:** `resolve_contradiction`
**Source:** `codex`

Multiple naming inconsistencies between the text and the directory tree:
- Text says feature folders are `industrial-cloner`, `executive-cockpit`, `intelligence-hub` (lines 153-155). Tree shows `factory`, `cockpit`, `intelligence` (lines 205, 209, 212).
- Text says standard structure includes `components/` (line 92). Tree has no top-level `components/`.
- Text says "All business logic must reside within features/" (line 158). Tree places logic in `agents/`, `workflows/`, and `lib/` outside features.

### F013: No API Contracts
**Category:** Missing Sections
**Action type:** `add_section`
**Source:** `claude`

Endpoint paths named (`/api/industrial-cloner/trigger`, `/api/chat/`) but no request/response shapes, error codes, auth requirements, or rate limits.

### F014: No Rollback / Migration Strategy
**Category:** Edge Cases and Failure Modes
**Action type:** `add_section`
**Source:** `claude`

"Conditional Patching" lifecycle (lines 102-104) mentions auto-applied patches and notification for feature shifts. No rollback if a patch breaks a client instance. No version pinning per client. No canary strategy.

### F015: No Open Questions Section
**Category:** Missing Sections
**Action type:** `add_section`
**Source:** `both`

A greenfield architecture with zero unknowns is a red flag. Real architecture docs acknowledge uncertainty. This one answers everything with generated confidence.

---

## P3 - Cosmetic

### F016: Buzzword Density Exceeds the PRD
**Category:** AI-Generated Content Smell
**Action type:** `narrow_scope`
**Source:** `both`

"Surgical Sovereignty," "Surgical Lock," "Glanceable Certainty," "F1 HUD," "Shift-Lights," "Progressive Ribbon," "Antigravity IDE," "Deep-Link Portals," "Immutable Auditability," "BIAB Factory," "Knowledge Blob," "Master Blueprint," "Factory's DNA." These are marketing terms in a document meant for implementers. Pick one metaphor set and strip the rest.

### F017: Input Artefacts Don't Exist
**Category:** AI-Generated Content Smell
**Action type:** `resolve_contradiction`
**Source:** `both`

Frontmatter (lines 3-8) references 5 input documents in `_bmad-output/` and `GEMINI.md`. None exist in the repo. The lessons.md already warned about this pattern (line 6). The provenance trail is not credible.

---

## Reviewer Disagreements

**None.** Both reviewers converged on the same core issues independently. This is itself a signal: the gaps are not subtle or debatable. They are structural absences.

Codex was more specific on two points:
1. **Vercel Edge limits** - cited specific constraints (25s response start, 300s streaming cap) and noted Vercel's own recommendation to prefer Node.js.
2. **FR15-20 coverage gap** - Codex caught the specific requirement numbers that were silently dropped. Claude flagged the self-validation as unreliable but didn't enumerate the missing FRs.

---

## Questions for Author

These need answers, not fixes:

1. **Was this architecture doc intended to be the ADR?** If so, the alternatives evaluation is missing. If not, when is the ADR being written? It's still listed as an open task in todo.md.

2. **Which FRs are actually in Phase 1?** The architecture hard-bakes BIAB cloning, AST refactoring, and multi-tenant provisioning into the baseline, but the PRD's Phase 1 is only Cockpit + CEO Agent + Discovery-to-PRD. Which is correct?

3. **Is the separate-Supabase-project-per-tenant decision final?** If so, what's the operational plan for managing 50+ projects? If not, what alternatives are being considered?

4. **What happened to FR15-20?** Are they deferred, removed, or was this an oversight in the generation?

5. **Has any spike work been done on the provisioning chain?** The 4-step flow across GitHub/Supabase/Vercel APIs is the riskiest path in the system. Has it been prototyped?

6. **What's the actual budget for Supabase and Vercel at 50 tenants?** The cost model is absent. At scale, per-tenant isolation with separate projects could be expensive.

---

## Recommended Next Steps

1. **Write the ADR.** This is the third time it's been flagged. Evaluate agent framework, durable execution, and multi-tenant strategy against real alternatives.
2. **Address the PRD review findings first.** The architecture should be the response to the PRD review, not a document that ignores it.
3. **Define MVP architecture vs full architecture.** Separate Phase 1 (Cockpit + CEO Agent) from Phase 2/3 (BIAB Factory, full agent swarm).
4. **Add the missing sections.** Data model, execution protocol, failure handling, cost model, threat model, API contracts, unknowns.
5. **Strip the self-validation.** Let external review be the validation.
6. **Resolve naming contradictions.** Make text descriptions match the directory tree.
7. **Spike the provisioning chain.** Prototype the GitHub -> Supabase -> Vercel flow with failure handling before committing to this architecture.

---

*Claude reviewed architecture claims, internal consistency, coverage completeness, and prior review compliance. Codex independently verified against Vercel Edge runtime documentation, cross-referenced requirement IDs between PRD and architecture, and confirmed input artefact absence.*
