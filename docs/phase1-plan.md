# Phase 1 Plan

**Created:** 2026-04-07
**Status:** Active — this is what we're building next.
**Anchored to:** `docs/prd.md` MVP section + `docs/decisions.md` (the locked Code Combat decisions).

---

## Why this doc exists

The dashboard repo was reset on commit `ece9313` (PR #19). The previous tree was Gemini Flash output that compiled but couldn't be trusted at the leaves — silent runtime bugs, fake-success Supabase stubs, broken hooks, half-done SDK migrations. Salvaging would have meant fighting Flash artefacts on every PR.

This doc is the spec for what gets built first in the clean repo. It is intentionally narrower than the full PRD — Phase 1 is bounded by the PRD's own MVP section, not the full FR1-21 vision. Everything in FR9-21 is **Phase 2/3** and explicitly out of scope until Phase 1 lands and proves the loop.

---

## Source-of-truth hierarchy

When these conflict, trust them in this order:

1. **`docs/decisions.md`** — locked outputs of the dual-agent Code Combat process. 5 ADRs, the HandoffEnvelope schema, the task_ledger + provisioning_ledger schemas, the sealed envelope pattern, the 3-phase FR boundary. **This is the architectural source of truth.**
2. **`docs/prd.md`** — Joe's product spec. Honest about scope (the MVP section is the right scope; FR9-21 is the full vision).
3. **`docs/architecture.md`** — coherent skeleton, but flowery. Treat as supporting, not load-bearing. If it contradicts the decisions doc, the decisions doc wins.

---

## What Phase 1 actually is

The PRD's own MVP section says Phase 1 is exactly five things:

1. **Unified Oversight UI (Cockpit)** — covers FR1-FR5
2. **CEO Agent + Triage logic**
3. **Discovery → PRD autonomous workflow** — one workflow, end to end
4. **Linear / Notion / Supabase MCP connections**
5. **Two user journeys supported:** "Executive Tap" + "Silent Recovery"

That's it. Five things. The decisions doc reinforces this with its 3-phase FR boundary: *Phase 1 = Cockpit + CEO + Specialist only.*

### What Phase 1 is NOT

Explicitly out of scope until Phase 1 ships:

- ❌ FR9 — Full hierarchical agent suite beyond CEO + one specialist
- ❌ FR10 — Agentic workforce assigned to all four divisions
- ❌ FR11 — BMB hot-loading of agent definitions
- ❌ FR12 — Industrial Cloner / AST refactoring
- ❌ FR13 — Autonomous PR management with merge conflict resolution
- ❌ FR14 — Validation Guard build/lint checks on agent code
- ❌ FR15 — Marketing Agent social posting
- ❌ FR16 — Data Agent report engine
- ❌ FR17 — Client Services Agent support desk
- ❌ FR18 — Support Agent IT/infrastructure tasks
- ❌ FR19 — OpenClaw bridge
- ❌ FR20 — Generalised handoff protocol (the *concept* applies; implementation only for the one Phase 1 workflow)
- ❌ FR21 — SRE Agent self-healing
- ❌ NFR9 — 50 concurrent SME tenants

These are real and important. They are not for now. They come back into scope after Phase 1 ships and proves the single loop works.

---

## Build order (when next session starts)

The order matters because each step unblocks the next.

### Step 1 — Repo foundations *(~1 hour)*

**Goal:** every line of plumbing is something we wrote with intent.

- Add `lib/supabase/server.ts` and `lib/supabase/client.ts` against the **real** Supabase SDK. No no-op stub. Throw clearly on missing env vars.
- Set up `.env.local.example` listing the env vars Phase 1 needs (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` or `ANTHROPIC_API_KEY`).
- Add Vercel AI SDK v6 deps directly: `ai`, `@ai-sdk/react`, `@ai-sdk/google` (or `@ai-sdk/anthropic`).
- Add Zod, define an empty `lib/schemas/` dir for the HandoffEnvelope to land in.
- Add a pre-commit hook that runs `tsc --noEmit` (lesson learned the hard way — Turbopack hides type errors).
- Decide: Node runtime or Edge for API routes. Decisions doc says **Node.js > Edge**. Honour it.

### Step 2 — Cockpit shell *(~2 hours)*

**Goal:** the visible UI surface from PR #18, rebuilt clean.

- `app/(cockpit)/layout.tsx` — wraps everything in the Tech Noir background + ambient atmospherics already defined in `globals.css`.
- `components/CockpitShell.tsx` — top nav (EngineAI OS branding, system status pill, manual override toggle, primary CTA). Use a React Context for shared cockpit state, not render-prop (RSC compat — this lesson is in the prior tree, see decisions doc).
- `app/(cockpit)/page.tsx` — the actual home cockpit view. For Step 2 it can be empty inside the shell. We just want the chrome.
- Verify all four divisions (`BIAB`, `SkunkWorks`, `Modular`, `Desktop`) get a route under `(cockpit)/division/[slug]/page.tsx` per FR4. Empty pages are fine — routing only.

### Step 3 — Real Supabase + tenant context *(~1 hour)*

**Goal:** every query is scoped by `tenant_id` from day one.

- Get Supabase URL + keys from Joe (or `npx supabase start` for a local instance).
- First migration: `task_ledger` and `provisioning_ledger` tables per the schemas in `docs/decisions.md`.
- RLS policies on both tables enforcing `tenant_id` isolation. Test with two synthetic tenants — confirm A cannot read B's rows.
- `TenantContext` provider (server-side) that reads the tenant id from session and threads it into the cockpit layout.

### Step 4 — CEO Agent + first tool *(~2 hours)*

**Goal:** one real agent, one real tool, real data flowing.

- `agents/ceo-agent.ts` — Vercel AI SDK v6 `Agent` class, system prompt anchored to the PRD's "Executive Tap" journey, model = whichever makes sense (Gemini 2.5 Pro or Claude Sonnet 4.6).
- One real tool: `getProjectStatus(divisionSlug)` that queries `task_ledger` and returns a real result.
- API route at `app/api/cockpit/query/route.ts` — Node runtime, not Edge. Trust boundary is enforced: route accepts `{ messages: UIMessage[] }` from the browser, strips to the **last user message text only**, never trusts forged assistant/tool history (lesson learned the hard way — see ENG-97).

### Step 5 — Cockpit query loop *(~2 hours)*

**Goal:** FR1 working end-to-end.

- `components/CommandStrip.tsx` — uses v6 `useChat` + `DefaultChatTransport({ api: '/api/cockpit/query' })`.
- Renders text parts and `tool-<name>` parts from the assistant response.
- One Generative UI card: `ProjectStatusCard` rendering the `getProjectStatus` tool output.
- Submit a query like *"what's the status of BIAB?"* and see real data come back. **This is the Phase 1 demo moment.**

### Step 6 — Discovery → PRD workflow *(~1 day)*

**Goal:** the headline durable workflow.

- Pick the smallest credible workflow shape from the PRD: founder submits a project name + brief, the system runs Discovery (lightweight research) → drafts a PRD → writes both to `task_ledger`.
- Wrap it in Vercel Workflows per NFR7 (any task > 5 min must be durable).
- HandoffEnvelopeSchema in `lib/schemas/` — implement the Zod schema from `docs/decisions.md` exactly. Every transition between Discovery and Drafting validates against it.
- Outbox pattern: deterministic `effect_id = hash(run + step + type + params)` so retries don't double-run side effects.
- Sealed envelope pattern: agents trigger Supabase writes via deterministic functions that inject the service-role key — agents themselves never see secrets.

### Step 7 — One MCP connection *(~half day)*

**Goal:** prove the MCP integration shape.

- Pick the easiest of the three: probably **Linear** (we already have a working MCP in this Claude Code session, so the auth shape is known).
- One real call: when Discovery → PRD finishes, post the PRD link as a comment on a Linear issue.
- Notion + Supabase MCPs come after — same pattern, pasted.

### Step 8 — User journey verification *(~half day)*

**Goal:** Phase 1 exit criterion.

- Walk the **"Executive Tap"** journey end to end on a real device. Founder opens cockpit on phone → submits Discovery brief → sees Generative UI status cards stream in → opens the PRD when it's done → it's posted to Linear.
- Walk the **"Silent Recovery"** journey: kill the workflow midway, confirm Vercel Workflows resumes from the last step on retry.
- Both green = Phase 1 ships.

---

## Definition of done for Phase 1

The whole thing collapses to one sentence:

> *"On a phone, with no laptop, Ben can submit a project brief to the cockpit, watch the Discovery → PRD workflow run in real time via streaming Generative UI cards, and end up with a finished PRD posted to Linear — without touching the codebase, the database, or any third-party tool directly."*

When that works once, end to end, against real Supabase and a real Linear MCP, **Phase 1 ships**. Everything else is Phase 2.

---

## Anti-patterns to avoid

Lessons paid for in blood by the prior tree. Each one is explicitly forbidden in Phase 1:

1. **No no-op stubs.** If a service isn't configured, throw. Silent fallbacks are how you ship things that don't work.
2. **No "scaffold for now."** If something can't be wired properly today, leave it out and document the absence. A proper missing thing is better than a fake present thing.
3. **No mock data in production code paths.** Mocks live in test files only.
4. **No copy-paste from `archive/gemini-flash-scaffold`.** Read it for hints about routes, schemas, agent boundaries. Never copy. Every line we write is something we understood as we wrote it.
5. **No commits without `tsc --noEmit` first.** Turbopack hides type errors. Pre-commit hook in Step 1 enforces this; until then, do it manually.
6. **No assistant/tool history accepted from the browser.** Mobile query routes strip to the last user message text only. (See ENG-97 for the prior incident.)
7. **No skipping the decisions doc.** Re-read `docs/decisions.md` before every commit that touches an agent, a schema, or a workflow.
8. **No bundling Phase 2 work into Phase 1 PRs.** "While I'm in here..." is how scope dies.
9. **No long branches.** Each step in the build order is its own branch + PR. Codex review every commit. Merge fast.
10. **No silent failures.** Every error path either throws cleanly or returns a typed error. No `catch {}`, no fallback values that pretend success.

---

## Open questions for Joe (decide before Step 1)

- **Model choice.** PRD says Vercel AI SDK v6 is mandatory; doesn't pin a model. Gemini 2.5 Pro (matches BMAD lineage) or Claude Sonnet 4.6 (matches our review process)?
- **Supabase environment.** Local via `npx supabase start` for dev, or do we want a hosted dev project from day one?
- **First MCP integration.** Linear is easiest for me. Do you want to start with Notion or Supabase instead?
- **Discovery → PRD scope.** How lightweight is "Discovery" in Phase 1? Just a search + summarise, or does it actually need to interview the founder via the cockpit?
- **Auth.** Magic links per the architecture doc, or just stub a single hardcoded tenant for dev and add real auth in M3?

---

## What's in Linear right now

- **M1 — Brand + Build Green:** ENG-94 to ENG-97 (Done, historical record of the salvage attempt + the brand pass).
- **M2 / M3 / M4:** descriptions are stale — they were written assuming the salvage path. Need rewriting against this Phase 1 plan next session.
- **Cancelled by reset:** ENG-98, 100, 101, 105, 106, 109, 110, 111, 113, 114 (all referenced files now in `archive/gemini-flash-scaffold`, not in master).
- **Still relevant:** ENG-99 (Supabase env vars), ENG-102 (Playwright — needs rephrasing), ENG-103 (RLS), ENG-104 (real auth), ENG-112 (pre-commit tsc hook), ENG-115 / ENG-116 (Joe carry-overs).

Next session opens with: read this doc, rewrite M2/M3/M4 in Linear against the build order above, then start Step 1.
