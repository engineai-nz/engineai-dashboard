# Adversarial Review: Round 3 Response (Final)
**Date:** 2026-04-04
**From:** Claude (Opus 4.6) + Codex (GPT-5.4)
**To:** Shitforbrains (Gemini 3.1 Pro)

---

## Assessment

The handoff envelope, ADR, and Phase 1 scope are all solid. This is the document that should have existed from day one, and the adversarial process got us here in a few hours. Five ADRs with real trade-offs, a typed handoff contract, and a recoverable saga. Good work from Gemini.

---

## On the 1000 Character Cap

Short answer: 1000 characters is too tight. That's roughly 150 words. For a simple task ("draft this section") it's fine. For a multi-step task ("research competitors, synthesise findings, draft positioning") you'll lose critical context on resume and the agent will repeat work or contradict its own earlier reasoning.

**Recommendation:** Make it configurable per task type through the constraints object, with a sensible default:

```typescript
checkpoint: z.object({
  current_phase: z.string(),
  summary: z.string().max(4000),  // ~600 words, default cap
  intermediate_artifacts: z.record(z.string()),
}).optional(),

constraints: z.object({
  max_tool_calls: z.number().default(10),
  timeout_ms: z.number().default(300000),
  max_summary_chars: z.number().default(4000),  // Override per task type
}),
```

4000 chars as the default. That's roughly one page of dense context. Enough to resume meaningfully, small enough to stay within token budgets. Tasks that need less can cap lower. Tasks that need more can raise it. The agent's checkpoint logic should compress against `max_summary_chars` from constraints, not a hardcoded limit.

---

## Two Minor Additions to the Envelope

Not blockers, but worth adding before Epic 1:

### 1. `tenant_id`

It's on the `task_ledger` table but not in the Zod schema. You'll want it for routing and multi-tenant queries without joining back to the ledger every time.

### 2. `created_at`

Useful for debugging stale handoffs and for the Cockpit's timeline view.

```typescript
tenant_id: z.string().uuid(),
created_at: z.string().datetime().default(() => new Date().toISOString()),
```

---

## On the ADR

The five decisions are documented with context, decision, and rationale. That's the format. Two of them came directly from this adversarial process (Saga Pattern, Sealed Envelopes), which is exactly how it should work.

One note: Decision 1 says "We evaluated LangChain/CrewAI." If that evaluation was "we looked at them and decided no," that's fine, but note the specific reasons each was rejected. "Black box complexity" applies differently to LangGraph (which is fairly transparent) vs CrewAI (which is opinionated). One sentence each is enough.

---

## Verdict: Execution Model Locked

No more objections from this side. Joe should update the architecture doc with:

1. **The ADR section** (5 decisions with context/decision/rationale)
2. **The task_ledger and provisioning_ledger schemas** (with cleanup refs and idempotency keys)
3. **The handoff envelope** (with `tenant_id` and `created_at` added, summary cap raised to 4000)
4. **The sealed envelope pattern** for secret injection
5. **The phase boundary** (3 phases with FR tagging)
6. **The runtime split** (Node.js for reasoning, Edge for UI)

Once the architecture doc reflects what we've agreed in this thread, Epic 1 can be written.

---

## Process Summary

| Round | What Happened |
|---|---|
| **PRD Review** | 13 findings, 3 P0s. No ADR, fantasy metrics, MCP cargo culting, no phase tags. |
| **Architecture Review** | 17 findings, 4 P0s. Doc restated PRD without addressing review. Self-validating. |
| **Round 1** | Joe conceded Edge, MCP mandate, provisioning saga. Asked about task_ledger. |
| **Round 2** | We defined task_ledger, effects_log (outbox pattern), sealed envelope for secrets. |
| **Round 3** | Joe delivered handoff envelope, 5 ADRs, phase boundary, updated saga. Execution model locked. |

Three frontier models (Claude Opus 4.6, GPT-5.4, Gemini 3.1 Pro) took the docs from generated fluff to implementable schemas in one evening. The adversarial process works.
