# Phase 1a Plan — Internal Loop Proof

**Created:** 2026-04-07
**Restructured:** 2026-04-07 (after eng review + Codex outside voice — option A: aggressive re-scope)
**Status:** Active.
**Anchored to:** `docs/prd.md` MVP section + `docs/decisions.md` (the locked Code Combat decisions).

---

## Why this doc exists

The dashboard repo was reset on commit `ece9313` (PR #19). The previous tree was Gemini Flash output that compiled but couldn't be trusted at the leaves. Salvaging would have meant fighting Flash artefacts on every PR.

This doc is the spec for what gets built first in the clean repo. It is intentionally **much narrower than the full PRD MVP**. After eng review on 2026-04-07, the original "Phase 1" plan was found to be quietly de-scoping and overclaiming — pretending to land FR1-FR5 while only implementing fragments of FR1, hand-waving MCP integration, and stacking durable workflows + outbox + idempotency before a single internal loop had ever run end to end.

This restructured plan does the honest thing: **prove one internal loop, with real data flowing through real schemas, before adding any external side effects or durability machinery.**

---

## Source-of-truth hierarchy

When these conflict, trust them in this order:

1. **`docs/decisions.md`** — locked outputs of the dual-agent Code Combat process. **Architectural source of truth.**
2. **`docs/prd.md`** — Joe's product spec. The MVP section is the right *eventual* scope; FR1-21 is the full vision.
3. **`docs/architecture.md`** — coherent skeleton, supporting only. If it contradicts the decisions doc, the decisions doc wins.

---

## Phased structure (the honest version)

The original plan tried to land too much at once. Reality is three smaller phases:

| Phase | Goal | Estimated honest time |
|---|---|---|
| **1a — Internal Loop Proof** *(this doc)* | One persisted workflow run in Supabase → one PRD output → one audit view in the cockpit. No external side effects. No durability. Just prove the loop with real schemas and real data. | **2-3 days** |
| **1b — MCP Integration** | Real runtime architecture for calling Linear / Notion / Supabase MCPs from the deployed Next app. Credentials, auth, where the MCP servers live. Linear comment posting on workflow completion. | ~3-4 days |
| **1c — Durability + Idempotency** | Vercel Workflows wrapping the Discovery → PRD pipeline. Outbox pattern with deterministic `effect_id`. Silent Recovery journey. Mobile E2E. | ~3 days |
| **1.5 — Real Auth** | Supabase magic links replacing `DEV_TENANT_ID`. RLS regression test. | ~half day |

**Phase 1a is what this doc plans.** 1b, 1c, and 1.5 each get their own plan doc when 1a ships. No one writes them yet.

---

## What Phase 1a actually is

One sentence:

> *Submit a project brief to the cockpit. The CEO agent runs a Discovery → PRD workflow against real Supabase tables. The PRD persists. The cockpit's audit view shows the run history with every step, input, output, and decision visible.*

That is the entire scope. No Linear. No mobile. No durability. No idempotency. No multi-MCP. One loop, real data, one pane of glass to see what happened.

### What Phase 1a is NOT

Explicitly out of scope (each lives in a later phase, named above):

- ❌ Any external side effects (Linear, Notion, Slack, email)
- ❌ Vercel Workflows / `@upstash/workflow` durability
- ❌ Outbox pattern + deterministic effect IDs
- ❌ Silent Recovery journey
- ❌ Mobile-viewport Playwright E2E
- ❌ Real auth (uses `DEV_TENANT_ID`)
- ❌ Multi-tenant in practice (Phase 1a is single-tenant)
- ❌ Approval gates (FR2)
- ❌ Manual override (FR3)
- ❌ Division pages (FR4) beyond placeholder routes
- ❌ Audit log drill-down (FR5) beyond a flat run history view
- ❌ Hierarchical agent suite (FR9-21)

These are real and important. They are not for now. They come back, in the named phases above, after Phase 1a ships and proves the single loop works against real data.

---

## Read-model schema (the missing piece from the prior plan)

Codex's outside voice caught this: the prior plan had no canonical data source for what the cockpit actually reads. Phase 1a fixes that with a deliberate read-model on top of the ledger tables from `docs/decisions.md`.

```
projects (one row per founder-submitted brief)
  ├── id (uuid, pk)
  ├── tenant_id (text, default DEV_TENANT_ID, RLS-scoped)
  ├── name (text)
  ├── brief (text)             — the founder's original input
  ├── division_slug (text)     — biab | skunkworks | modular | desktop
  ├── status (enum)            — pending | running | complete | failed
  ├── created_at, updated_at

runs (one row per Discovery → PRD execution)
  ├── id (uuid, pk)
  ├── project_id (fk → projects)
  ├── tenant_id (text, RLS-scoped)
  ├── status (enum)            — pending | running | complete | failed
  ├── started_at, finished_at
  ├── error (text, nullable)

run_steps (one row per agent step within a run)
  ├── id (uuid, pk)
  ├── run_id (fk → runs)
  ├── tenant_id (text, RLS-scoped)
  ├── step_name (text)         — discovery | drafting | review
  ├── input_json (jsonb)
  ├── output_json (jsonb)
  ├── status (enum)
  ├── started_at, finished_at
  ├── tokens_in, tokens_out (int, nullable)

artifacts (one row per produced document — the PRD itself)
  ├── id (uuid, pk)
  ├── run_id (fk → runs)
  ├── tenant_id (text, RLS-scoped)
  ├── kind (text)              — prd
  ├── content_markdown (text)
  ├── created_at
```

Every table has `tenant_id` and an RLS policy enforcing isolation by `current_setting('app.current_tenant', true)`. The dev tenant constant `DEV_TENANT_ID = 'dev-tenant-001'` is set at request time via the `TenantContext` provider.

`task_ledger` and `provisioning_ledger` from `docs/decisions.md` come back in Phase 1c when durability lands. They are not Phase 1a tables.

---

## Build order

The order matters because each step unblocks the next.

### Step 1 — Repo foundations *(~3 hours)*

**Goal:** every safety net Phase 1a needs is in place — tests, CI, deploy preview, env contract, dev tenant, dependency tree.

**Directory layout (pinned now):**

```
src/
  app/                   # Next 16 App Router
    api/cockpit/
  components/            # CockpitShell, RunHistory, ProjectStatusCard, BriefForm
  lib/
    supabase/            # server.ts, client.ts (real SDK, lazy throw)
    agents/              # ceo-agent.ts, discovery-agent.ts, prd-agent.ts
      tools/             # getProjects, createRun, appendRunStep, saveArtifact
    schemas/             # Zod schemas
    tenant/              # dev.ts (DEV_TENANT_ID, throws in prod)
    db/                  # query helpers (read-model)
tests/
  unit/                  # Vitest
supabase/
  migrations/
.github/workflows/       # ci.yml
```

**Tasks:**

- Install deps: `@supabase/supabase-js`, `@supabase/ssr`, `ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`, `zod`. Dev: `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `husky`.
- `src/lib/supabase/{server,client}.ts` against the real Supabase SDK. **Lazy throw** on missing env vars at first call, never at import time.
- `src/lib/tenant/dev.ts` exporting `DEV_TENANT_ID = 'dev-tenant-001'`. Throws at import time in `NODE_ENV=production` unless `ALLOW_DEV_TENANT_IN_PROD` is set. Real auth = Phase 1.5.
- `.env.local.example`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`.
- Vitest configured. `npm run test` runs an empty suite green.
- **GitHub Actions CI** (`.github/workflows/ci.yml`) on every PR: `tsc --noEmit && eslint && next build && vitest run`. Red blocks merge.
- **Vercel project linked, preview deploys per PR.** Set Vercel **password protection** on previews so the public URL isn't a free-for-all (this is the gate Codex flagged — without it, Phase 1a previews are a public agent endpoint).
- Pre-commit hook (`husky`): `tsc --noEmit`. Catches the Turbopack-hides-types lesson locally.
- Add `export const runtime = 'nodejs'` reference comment in `src/app/api/_template-route.ts`. Decisions doc says **Node.js > Edge**.

### Model choice

**Default: Claude Sonnet 4.6 (`claude-sonnet-4-6`) via `@ai-sdk/anthropic`.** Runtime is agent-agnostic via the Vercel AI SDK — swappable per-agent in one line. Reasoning: paid-in-blood lesson that Gemini Flash output was structurally plausible / semantically broken on the prior tree. Sonnet 4.6 is the lower-risk default for the first working CEO loop.

### Step 2 — Cockpit shell *(~2 hours)*

**Goal:** the visible UI surface, rebuilt clean. No agent integration yet.

- `src/app/(cockpit)/layout.tsx` — Tech Noir background + atmospherics from `globals.css`.
- `src/components/CockpitShell.tsx` — top nav (EngineAI OS branding, system status pill, primary CTA). React Context for shared state, **not render-prop** (RSC compat — see decisions.md line 33).
- `src/app/(cockpit)/page.tsx` — home view. Empty inside the shell for now.
- `src/app/(cockpit)/division/[slug]/page.tsx` — placeholder routes for `biab | skunkworks | modular | desktop`. **Labelled "placeholder, lands in Phase 2"** so nobody mistakes them for FR4.

### Step 3 — Real Supabase + read-model *(~3 hours)*

**Goal:** the schema the cockpit reads from is real, and tenant isolation works.

- Get Supabase URL + keys from Joe (or `npx supabase start` for local).
- Migration `0001_phase1a_read_model.sql`: creates `projects`, `runs`, `run_steps`, `artifacts` per the schema above.
- RLS policies on all four tables enforcing `tenant_id = current_setting('app.current_tenant', true)`.
- `TenantContext` provider sets `app.current_tenant = DEV_TENANT_ID` at request time.
- **Vitest test:** create a row as tenant A, switch context to tenant B, assert read returns zero. CI-gated.
- Seed script `supabase/seed.ts` with two synthetic projects under `DEV_TENANT_ID` so the cockpit isn't empty on first load.
- **Loud dev banner** on every `npm run dev` start: `[TENANT] Using DEV_TENANT_ID — auth lands in Phase 1.5`.

### Step 4 — CEO + Discovery + PRD agents *(~4 hours)*

**Goal:** three real agents wired up, talking to real Supabase tables, no durability layer yet.

- `src/lib/agents/ceo-agent.ts` — Claude Sonnet 4.6, system prompt anchored to PRD's "Executive Tap" framing. Job: take a brief, kick off Discovery, route Discovery output to PRD, return the artifact id. Plain async function — no Vercel Workflows yet.
- `src/lib/agents/discovery-agent.ts` — takes `{ brief, division_slug }`, returns `{ findings: string[], assumptions: string[] }`. Pure LLM call with structured output via Zod. No web search in 1a — that's a Phase 1b tool.
- `src/lib/agents/prd-agent.ts` — takes Discovery output + original brief, returns a markdown PRD. Pure LLM call.
- Tools (sealed-envelope wrappers in `src/lib/agents/tools/`): `createRun`, `appendRunStep`, `saveArtifact`, `markRunComplete`, `markRunFailed`. **Agents call these wrappers, never the Supabase SDK directly.** Pattern is in place from day one — when 1c lands and wraps everything in Vercel Workflows, the wrappers don't change.
- API route `src/app/api/cockpit/query/route.ts` — Node runtime. **Trust boundary enforced**: accepts `{ messages: UIMessage[] }`, strips to last user message text only, never trusts forged assistant/tool history. (ENG-97 lesson.)
- **Vitest unit test (CRITICAL regression):** feed the route a payload with forged assistant/tool history, assert it's stripped. Written alongside the route, gated in CI.
- API route `src/app/api/cockpit/submit-brief/route.ts` — POST with `{ name, brief, division_slug }`, creates a `projects` row, kicks off the CEO agent inline (await), returns `{ project_id, run_id, artifact_id }`.

### Step 5 — Cockpit submit + audit view *(~3 hours)*

**Goal:** Phase 1a's user-visible surface. Submit a brief, watch the run, read the PRD.

- `src/components/BriefForm.tsx` — name + brief textarea + division dropdown. POSTs to `/api/cockpit/submit-brief`. Shows a spinner while the agent runs.
- `src/components/RunHistory.tsx` — server component, queries `runs` joined with `run_steps` for the current tenant, renders a flat list: project name, status, step-by-step trace with inputs and outputs as collapsible blocks, tokens used, duration. **This is the audit view.** It's flat, not a drill-down — that comes back in 1c.
- `src/components/PrdViewer.tsx` — given an `artifact_id`, fetches and renders the markdown PRD.
- `src/app/(cockpit)/page.tsx` — wires `BriefForm` + `RunHistory` into the cockpit shell.
- `src/app/(cockpit)/run/[id]/page.tsx` — single-run drill-down with the PRD viewer.

### Step 6 — Manual end-to-end pass + cleanup *(~2 hours)*

**Goal:** Phase 1a exit criterion.

- On the dev server (and on the password-protected Vercel preview), submit a brief. Watch the run history populate. Read the resulting PRD. Verify all four tables (`projects`, `runs`, `run_steps`, `artifacts`) have correct rows with `tenant_id = dev-tenant-001`.
- Submit a brief that will fail (e.g. force the PRD agent to throw mid-run via a `THROW_FOR_TEST` env flag). Verify `runs.status = failed` and `runs.error` is populated. Verify the cockpit shows the failure clearly, not a silent hang.
- Run `tsc --noEmit && npm run lint && npm run test && npm run build` clean.
- Tag the commit `phase1a-shipped`. Open the Phase 1b plan doc.

---

## Definition of done for Phase 1a

> *On the password-protected Vercel preview, Ben submits a project brief through the cockpit. Within ~30 seconds, the run appears in the audit view with every step traced — Discovery findings, PRD draft — and the finished PRD is readable in the cockpit. The failure path also works: a forced failure shows up cleanly in the audit view with the error message visible. All data lives in real Supabase tables under `DEV_TENANT_ID`, with RLS preventing cross-tenant reads.*

When that works once, end to end, **Phase 1a ships**. Phase 1b begins.

---

## Honest timeline

Total: **2-3 days of focused work** from a bare scaffold.

| Step | Time |
|---|---|
| 1 — Repo foundations | 3h |
| 2 — Cockpit shell | 2h |
| 3 — Supabase + read-model | 3h |
| 4 — Three agents + API routes | 4h |
| 5 — Submit + audit view | 3h |
| 6 — Manual e2e pass + cleanup | 2h |
| **Total** | **~17h** |

If a step blows past its budget by >50%, stop and reassess scope. The plan is bounded specifically so this can't sprawl.

---

## Anti-patterns to avoid

Lessons paid for in blood. Each one is explicitly forbidden in Phase 1a:

1. **No no-op stubs.** If a service isn't configured, throw. Silent fallbacks ship things that don't work.
2. **No "scaffold for now."** If something can't be wired properly today, leave it out and document the absence.
3. **No mock data in production code paths.** Mocks live in test files only. The seed script is real Supabase rows, not in-memory fixtures.
4. **No copy-paste from `archive/gemini-flash-scaffold`.** Read for hints, never copy.
5. **No commits without `tsc --noEmit` first.** Pre-commit hook in Step 1 enforces this.
6. **No assistant/tool history accepted from the browser.** API routes strip to last user message only. (ENG-97.)
7. **No skipping the decisions doc.** Re-read before every commit touching agents, schemas, or tools.
8. **No bundling Phase 1b/1c work into Phase 1a PRs.** "While I'm in here..." is how scope dies. If it's not in the build order above, it's a separate PR in a later phase.
9. **No long branches.** Each step is its own branch + PR. Codex review every commit. Merge fast.
10. **No silent failures.** Every error path either throws cleanly or returns a typed error. No `catch {}`.
11. **No overclaiming scope.** Phase 1a implements an internal loop proof, not FR1-FR5. The cockpit shell is *placeholder chrome* for divisions and approval gates that land in later phases. Don't pretend otherwise in commit messages, PR descriptions, or Linear updates.

---

## Decisions made in eng review (2026-04-07)

- **Model:** Claude Sonnet 4.6 default for the CEO/Discovery/PRD agents. Agent-agnostic via AI SDK; per-agent swap is one line.
- **Auth:** Hardcoded `DEV_TENANT_ID` in Phase 1a, real Supabase magic-link auth in Phase 1.5.
- **First MCP:** None in Phase 1a. Linear lands in Phase 1b with a real runtime architecture spike.
- **Durable workflows:** Deferred to Phase 1c. Phase 1a uses plain async functions.
- **Mobile E2E:** Deferred to Phase 1c. Phase 1a is desktop-only manual verification.
- **Tests + CI:** Vitest + GitHub Actions in Step 1, RLS isolation test in Step 3, trust-boundary regression test in Step 4. Playwright lands in Phase 1c.
- **Preview deploy gate:** Vercel password protection on previews. Replaces auth as the "no public agent endpoint" gate until Phase 1.5.

## Still open, not blocking Step 1

- **Supabase environment.** Local via `npx supabase start`, or hosted dev project from day one? Either works; hosted is one less thing to spin up. **Defaulting to hosted unless Joe says otherwise.**
- **Discovery scope.** Pure LLM call on the brief alone (no tools, no web search) for Phase 1a. Web search lands in Phase 1b alongside MCP.

---

## What's in Linear right now

- **M1 — Brand + Build Green:** ENG-94 to ENG-97 (Done, historical record of the salvage attempt + the brand pass).
- **M2 / M3 / M4:** descriptions are stale — they were written assuming the old "Phase 1" framing. **Rewrite against this Phase 1a / 1b / 1c / 1.5 split before starting Step 1.**
- **Cancelled by reset:** ENG-98, 100, 101, 105, 106, 109, 110, 111, 113, 114.
- **Still relevant:** ENG-99 (Supabase env vars), ENG-103 (RLS), ENG-104 (real auth — moves to Phase 1.5), ENG-112 (pre-commit tsc hook), ENG-115 / ENG-116 (Joe carry-overs).

Next session opens with: rewrite Linear M2/M3/M4 against the four-phase split, then start Step 1.
