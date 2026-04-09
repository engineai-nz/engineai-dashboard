# Phase 1b Plan — MCP Runtime Spike (Linear Posting)

**Created:** 2026-04-08
**Status:** Approved. Decisions locked 2026-04-08 during the overnight session — see `docs/decisions.md` for the dated entry. Phase 1a framing audit returned **CLEAN RESET** (95%+ confidence), so Phase 1b builds on a sound foundation.
**Depends on:** `fix/phase1a-p0s` (the three P0 fixes from the overnight adversarial review — think-token centralisation, agent timeouts, orphan project rollback). This plan's branch sits on top of that branch.
**Anchored to:** `docs/phase1-plan.md` (the Phase 1a plan), `docs/decisions.md` (architectural source of truth), `docs/prd.md` MVP section.

---

## Why this doc exists

Phase 1a proved the internal loop — Discovery → PRD persists to real Supabase tables, the audit view shows every step, one pane of glass. No external side effects. No durability. That was the whole point: prove the loop before adding anything that can fail across a network boundary.

Phase 1b adds the first external side effect: when a run finishes successfully, post the generated PRD as a comment on a pre-specified Linear issue, via a Linear MCP server. This is a **runtime architecture spike** — the first time the dashboard calls an MCP from the deployed Next.js app. The point of Phase 1b is to prove the runtime contract for one MCP end-to-end (where it lives, how credentials flow, how agents talk to it without violating the sealed envelope, how failures show up in the audit trail) before adding any other MCPs.

The cost of getting this wrong is that every future MCP integration inherits the same mistake. The cost of being patient and proving one integration cleanly is one extra phase. The trade is obviously correct.

---

## Source-of-truth hierarchy

Same as 1a:

1. **`docs/decisions.md`** — architectural source of truth.
2. **`docs/prd.md`** — Joe's product spec. MVP section for scope, FR1-21 for the full vision.
3. **`docs/phase1-plan.md`** — the Phase 1a plan. Its "what Phase 1a is NOT" list is carried forward here unless an item is explicitly pulled into 1b by this doc.
4. **`docs/architecture.md`** — supporting only. Decisions doc wins on any conflict.

---

## What Phase 1b actually is

One sentence:

> *When a Phase 1a run finishes successfully, and the brief specified an optional Linear issue ID, the system posts the generated PRD as a comment on that issue via a Linear MCP server. Agents never see the Linear API key — a deterministic Node wrapper injects it and returns success/fail to the agent. The audit view shows the Linear post as a first-class `run_step`.*

That is the entire scope. One MCP server. One tool on that MCP (comment creation on an existing issue). One trigger (successful run completion). One tenant (still `DEV_TENANT_ID`). One happy path and one failure path, both visible in the audit view.

### What Phase 1b is NOT

Explicitly out of scope. Each lives in a later phase or gets a separate spike doc when its time comes.

- ❌ Notion MCP. Defer until Linear is stable.
- ❌ Supabase-as-MCP. The dashboard already calls Supabase through the sealed wrappers — no value in MCP-wrapping it.
- ❌ Telegram / Discord / Slack notifications. Phase 2 per PRD.
- ❌ Gmail / Stripe / Google Drive integrations. Phase 2+.
- ❌ BMB hot-loading (FR11). Not this phase, not the next one either.
- ❌ OpenClaw bridge (FR19). Out of scope.
- ❌ MCP tool discovery UI. No user-facing MCP management yet.
- ❌ Multi-MCP routing or tool whitelisting. One MCP means no routing layer needed.
- ❌ Approval gates (FR3). Linear comments post automatically on success. No human gate in 1b.
- ❌ Real auth. `DEV_TENANT_ID` continues. That's Phase 1.5.
- ❌ Multi-tenant Linear credentials. One Linear workspace, one API key. Per-tenant credential storage lands alongside real auth.
- ❌ Durable workflows (`@upstash/workflow`). Same plain async pattern as 1a. Durability is Phase 1c.
- ❌ Retry logic with exponential backoff. One attempt. If Linear is down, record the failure cleanly and move on.
- ❌ Posting on failed runs. 1b only posts PRDs on successful runs. Failure posting is 1c.
- ❌ Posting updates to Linear as the run progresses. Only the final PRD, only once, only on completion.
- ❌ Creating new Linear issues from the dashboard. Comment-on-existing only.

---

## Architecture decisions — locked 2026-04-08

All eight calls were locked during the overnight session. See `docs/decisions.md` for the dated entry with full rationale. The summary table below is the canonical reference for build order.

| # | Decision | Locked value |
|---|---|---|
| 1 | MCP server runtime | **Linear's official hosted remote MCP server at `https://mcp.linear.app/mcp`.** We are the *client*, not running a server. This is a streamable-HTTP remote MCP endpoint maintained by Linear. No local lifecycle, no process management, no module to instantiate. Discovered during the spike — the earlier "in-process" option is moot because Linear hosts the server itself. |
| 2 | Linear API key storage | **Environment variable** `LINEAR_API_KEY` on Vercel, single Engine AI workspace. Passed as `Authorization: Bearer <key>` on the streamable-HTTP transport. Per-tenant credentials land alongside real auth in Phase 1.5. |
| 3 | Wrapper → MCP auth | **Bearer token** in the `Authorization` header of the streamable-HTTP transport. Falls out of Decision 2 — no additional auth layer beyond the existing API key. |
| 4 | MCP client implementation | **`@modelcontextprotocol/sdk`** (the official TypeScript MCP SDK). Imports: `Client` from `@modelcontextprotocol/sdk/client/index.js` and `StreamableHTTPClientTransport` from `@modelcontextprotocol/sdk/client/streamableHttp.js`. Exact-pinned in `package.json`. No Linear-specific package needed — the client speaks the MCP protocol, the server happens to be Linear's. |
| 5 | Linear tool scope | **One tool only:** comment creation on an existing issue. First call of `tools/list` will confirm the exact tool name (likely `createComment` or similar). No `create_issue`, no search, no update, no labels. |
| 6 | How user specifies target issue | **Optional `linear_issue_id` text field on `BriefForm`** with client-side validation against `/^[A-Z]+-\d+$/`. One new nullable column on `projects`. |
| 7 | Failure policy | **Run still marks complete; failure logged as a `linear_post` `run_step` with `status='failed'` and a non-empty `error`**. No retry. No silent hang. Audit view surfaces the failure. |
| 8 | Response time budget | **3 seconds soft target, no hard SLA.** If synchronous posting becomes a UX problem, the fix is async posting in Phase 1c durability, not a bolt-on retry in 1b. |

### Why these answers (one line each)

1. **Linear-hosted remote** — Linear publishes an official MCP server at `mcp.linear.app/mcp`, so there is no hosting decision to make. Our code is purely an MCP client. Original plan assumed we would install and run a server; discovery corrected that assumption.
2. **Env var** — Phase 1a is single-tenant; a per-tenant credentials table is premature until real auth lands.
3. **Bearer token** — trivially supported by the streamable-HTTP transport via `requestInit.headers`.
4. **Official SDK** — `@modelcontextprotocol/sdk` is the canonical TypeScript MCP client. No reason to roll our own HTTP plumbing.
5. **One tool** — the scope discipline from Phase 1a carries forward. One tool, one path, one failure mode to reason about.
6. **Optional form field** — explicit, discoverable, and the auto-detect alternative is a false-positive hazard.
7. **Soft failure** — the Linear post is a side effect, not part of the run. Conflating the two invites the wrong error handling.
8. **Soft SLA** — hard SLAs drive the wrong behaviour in Phase 1b. Durability work belongs in 1c.

---

## Read-model schema additions

Minimal. One new column, one new run_step value, and optionally one new table depending on Decision 2.

```sql
-- Proposed migration: 0002_phase1b_linear_issue_id.sql

ALTER TABLE projects
  ADD COLUMN linear_issue_id text;
-- Nullable. Format expected: /^[A-Z]+-\d+$/. Validated client-side and in the API route.

-- If Decision 2 = B, also add:
-- CREATE TABLE linear_credentials (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   tenant_id text NOT NULL,
--   api_key_encrypted text NOT NULL,  -- pgsodium if available
--   workspace_slug text NOT NULL,
--   created_at timestamptz DEFAULT now()
-- );
-- ALTER TABLE linear_credentials ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY linear_credentials_tenant_isolation
--   ON linear_credentials FOR ALL
--   USING (tenant_id = current_setting('app.current_tenant', true));
```

`run_steps.step_name` gains a new valid value: `linear_post`. The column is already `text`, so no schema change is needed — just update the Zod enum, the tests, and the audit view's renderer.

---

## Build order

Seven steps. Run `tsc --noEmit && npm run lint && npm run test && npm run build` after each. No commits without that gate green.

### Step 1 — MCP client spike *(~2-3 hours)*

The original plan called this "MCP runtime spike" and envisioned installing and running a local Linear MCP server. During research it became clear Linear hosts the server themselves at `https://mcp.linear.app/mcp`, so our job is purely writing a client. Scope collapsed accordingly.

- Install exact-pinned: `npm install --save-exact @modelcontextprotocol/sdk`. Just the SDK. No Linear-specific package.
- New module at `src/lib/mcp/linear-client.ts`. Responsibilities:
  - Lazy-instantiate an MCP `Client` with `StreamableHTTPClientTransport` pointed at `https://mcp.linear.app/mcp`.
  - Pass `Authorization: Bearer ${process.env.LINEAR_API_KEY}` via `requestInit.headers`.
  - Throw loudly at first use if `LINEAR_API_KEY` is missing — no silent no-ops.
  - Module-level singleton so multiple `postLinearComment` calls in the same process reuse the same client.
  - Export a `getLinearMcpClient()` function and a `closeLinearMcpClient()` for test teardown.
- Commit a disposable dev-only route at `src/app/api/dev/linear-ping/route.ts` gated behind `NODE_ENV !== 'production'` that calls `client.listTools()` and returns the result as JSON. This is the manual verification handle for "does the connection actually work". It MUST be deleted before the Phase 1b PR lands.
- Do not proceed to Step 2 until the spike route returns a real tool list from Linear.

Known risk: a reported issue in the MCP SDK ([#495](https://github.com/modelcontextprotocol/typescript-sdk/issues/495)) notes custom headers set on `StreamableHTTPClientTransport` may not reach the server in some versions. If the spike route fails with an auth error, check the SDK version and that issue's status before blaming Linear.

### Step 2 — Sealed envelope wrapper *(~2-3 hours)*

- Create `src/lib/agents/tools/postLinearComment.ts`.
  - Signature: `postLinearComment(input: { tenantId: string; issueId: string; commentMarkdown: string; runId: string }): Promise<{ ok: boolean; url?: string; error?: string }>`
  - Deterministic. No agent-controlled input reaches the `LINEAR_API_KEY` resolution path.
  - Writes a `run_steps` row with `step_name = 'linear_post'` regardless of outcome so the audit view always shows the attempt.
  - Uses `appendRunStep` from `src/lib/db/runs.ts` — the same path the existing CEO pipeline uses.
- Vitest unit tests (mock the MCP call):
  - Happy path: returns `{ ok: true, url }` and writes a `complete` step.
  - Failure path: returns `{ ok: false, error }` and writes a `failed` step with a non-empty error.
  - Regression test: assert agent-controlled `tenantId` or `issueId` cannot reach key resolution.

### Step 3 — Supabase migration for `projects.linear_issue_id` *(~30 min)*

- New migration `supabase/migrations/0002_phase1b_linear_issue_id.sql`:
  ```sql
  ALTER TABLE projects ADD COLUMN linear_issue_id text;
  ```
- Update `ProjectRow` type in `src/lib/db/projects.ts` to include `linear_issue_id: string | null`.
- Extend `createProject` to accept and persist the optional field.
- No RLS changes — the column lives on an already-RLS-enabled table.

### Step 4 — CEO agent Linear posting *(~2 hours)*

- After `saveArtifact` succeeds in `ceo-agent.ts`, read `linear_issue_id` from the project row.
- If set: call `postLinearComment({ tenantId, issueId, commentMarkdown: prdMarkdown, runId: run.id })`.
- If not set: write a `linear_post` `run_step` with `status = 'skipped'` and a descriptive `error` like `'no linear_issue_id on project'` (even though it's not technically an error — it's a skipped attempt that needs to show up in the audit trail).
- Vitest unit tests:
  - Skip path fires when `linear_issue_id` is null.
  - Post path fires exactly once on the happy path.
  - Handoff envelope is still validated (no regressions on existing Phase 1a behaviour).

### Step 5 — BriefForm UI update *(~1 hour)*

- Add an optional `Linear issue ID` text field to `src/components/BriefForm.tsx`.
- Client-side validation: optional, but if present must match `/^[A-Z]+-\d+$/`. Show validation inline.
- POST to `/api/cockpit/submit-brief` includes the new field.
- API route validates server-side (never trust the client) and persists to `projects.linear_issue_id` via the extended `createProject`.
- Vitest test: submit-brief route accepts and rejects the field as expected.

### Step 6 — Audit view rendering *(~1 hour)*

- `RunHistory` already iterates `run_steps`. Add rendering for `step_name = 'linear_post'`:
  - On `complete`: "Linear comment posted" with the URL as a link.
  - On `failed`: "Linear post failed: {error}" in the Tech Noir accent-red.
  - On `skipped`: "Linear post skipped (no issue ID)" in muted text.
- No new component — extend the existing step renderer.
- Manual visual check in the cockpit shell. Screenshot before/after in the PR.

### Step 7 — Manual end-to-end pass + cleanup *(~2 hours)*

Phase 1b's exit criterion. Mirror of Phase 1a Step 6.

- Submit a brief with a real test Linear issue ID (use a disposable issue in Engine AI's Linear workspace). Verify PRD generates, Linear comment appears, audit shows `linear_post` step complete with link.
- Submit a brief with no Linear ID. Verify skip path.
- Submit a brief with malformed ID `not-valid`. Verify client rejection.
- Submit a brief with a valid-looking but nonexistent ID (e.g. `ZZZ-999999`). Verify graceful failure in audit, run still marks complete.
- Temporarily set `LINEAR_MCP_FORCE_FAIL=1`. Verify forced failure in audit cleanly.
- Delete the dev-only `/api/dev/linear-ping` scratch route from Step 1.
- Confirm no `process.env.LINEAR_*` references exist outside `src/lib/agents/tools/postLinearComment.ts`.
- Run the full quality gate clean: `npm run typecheck && npm run lint && npm run test && npm run build`.
- Tag the head commit `phase1b-shipped`.

---

## Pre-requisites before Step 1

- **`fix/phase1a-p0s` must be in the base chain.** This branch is based on it, so it's already there. If anything pulls that branch out, restore it before building.
- **Local `master` synced with remote.** Per memory, the Phase 1a merge commit `2d07e11` lives on remote but local master is behind. Run `git pull origin master` before opening the Phase 1b PR so the eventual merge is clean.
- **Phase 1a framing audit verdict: CLEAN RESET** — already verified overnight. See the morning briefing in `tasks/todo.md`.

---

## Honest timeline

| Step | Time |
|---|---|
| 1 — MCP runtime spike | 3-4h |
| 2 — Sealed envelope wrapper + tests | 2-3h |
| 3 — Supabase migration for linear_issue_id | 30min |
| 4 — CEO agent Linear integration | 2h |
| 5 — BriefForm UI update | 1h |
| 6 — Audit view rendering | 1h |
| 7 — Manual e2e pass + cleanup | 2h |
| **Total** | **~11-14h** |

If any step blows past its budget by more than 50%, **stop and reassess.** In particular: if Step 1 blows past 6 hours, that means the in-process runtime choice is not working, and Decision 1 needs to be revisited. Do not push through a bad runtime decision with brute force.

---

## Anti-patterns to avoid

Lessons paid for in blood, some in Phase 1a and some new for Phase 1b. Each one is explicitly forbidden.

**Carried forward from Phase 1a (all still apply):**

1. **No no-op stubs.** If the MCP server isn't configured, throw at first use.
2. **No "scaffold for now."** If an architectural decision isn't locked, stop.
3. **No mock data in production code paths.** Mocks live in test files only.
4. **No copy-paste from `archive/gemini-flash-scaffold`.** Read for hints, never copy.
5. **No commits without `tsc --noEmit` first.** Pre-commit hook enforces this.
6. **No assistant/tool history accepted from the browser.** API routes strip to last user message only.
7. **No skipping the decisions doc.** Re-read before every commit touching agents, schemas, or tools.
8. **No bundling Phase 1c work into Phase 1b PRs.** Durability belongs in 1c. No "while I'm here" async shims.
9. **One branch for Phase 1b, one PR at the end.** Steps 2-8 all land as commits on `ben/phase1b`. Local checks run after every step. One PR + one Codex review when the demo works.
10. **No silent failures.** Every error path either throws cleanly or returns a typed error. No `catch {}`.
11. **No overclaiming scope.** Phase 1b implements exactly one MCP with exactly one tool on exactly one trigger. Don't pretend otherwise in commit messages, PR descriptions, or Linear updates.

**New for Phase 1b:**

12. **No secret exposure to agents.** CI grep rule: `process.env.LINEAR_*` references must not appear outside `src/lib/agents/tools/postLinearComment.ts`. Block merge on violation.
13. **No hand-rolled MCP client.** Use the official SDK. If the official SDK doesn't have what we need, stop and revisit Decision 4.
14. **No direct calls to Linear's REST or GraphQL API from agent code.** The only code that talks to Linear is `postLinearComment.ts`. Everything else goes through the wrapper.
15. **No "while I'm in the routing layer, let me add Notion/Slack/Telegram too."** One MCP. One tool. One trigger. Scope discipline is not negotiable.
16. **No background or async Linear posting in 1b.** Synchronous wrapper only. Async posting is part of Phase 1c durability, where it belongs.
17. **No error swallowing on Linear failure.** Every failure path logs a `linear_post` step with `status = 'failed'` and a non-empty `error` string. The audit view surfaces it.
18. **No caret-range version pinning for the MCP SDK.** Exact-pin. MCP SDK upgrades should be deliberate, reviewed events — not the result of an `npm install`.
19. **No tool whitelisting config files.** One MCP, one allowed tool, enforced in code. No config layer until there's more than one MCP.

---

## Still open, not blocking

Minor tactical items to resolve during the build rather than up front:

- **Test Linear workspace.** Default: a disposable test issue in Engine AI's own Linear workspace. Don't complicate with a separate sandbox workspace.
- **Linear API rate limits.** Probably fine for single-user 1b traffic but worth confirming before Step 7.
- **Dev-only route location.** Using `src/app/api/dev/linear-ping/route.ts` — clean and discoverable. Delete before the PR merges.
- **Linear comment body format.** Include a header line with the run ID and a link back to the cockpit audit view so the Linear comment is self-explanatory when someone reads it. Small addition, trivial to include.

---

## Definition of done for Phase 1b

> *On the dev environment, Ben submits a project brief through the cockpit with a valid Linear issue ID. The CEO pipeline runs. The PRD generates, saves to the `artifacts` table, and within a few seconds appears as a comment on the specified Linear issue. The audit view shows a `linear_post` `run_step` with status `complete` and a link to the Linear comment. The failure path also works: a submission with `LINEAR_MCP_FORCE_FAIL=1` shows the failure in the audit view with a clear error message, and the run is still marked `complete`. All data still lives under `DEV_TENANT_ID`. No secrets appear in agent logs or audit rows.*

When that works once, end to end, **Phase 1b ships.** Phase 1c begins with a plan doc modelled on this one.

---

## What's in Linear right now

Picked up from `phase1-plan.md` and needs a refresh now that Phase 1b scope is locked:

- **M2** — description is stale from the pre-reset framing. Rewrite against the scope in this plan.
- **ENG-115, ENG-116** — Joe carry-overs from the pre-reset era. Check relevance before starting, cancel anything no longer applicable.
- **Any pre-reset MCP tickets** — cancel or rewrite. Do not leave zombie tickets pointing at the old plan.

New tickets to create, one per step above:
- ENG-XXX: Phase 1b Step 1 — MCP runtime spike
- ENG-XXX: Phase 1b Step 2 — sealed envelope wrapper
- ENG-XXX: Phase 1b Step 3 — Supabase migration for linear_issue_id
- ENG-XXX: Phase 1b Step 4 — CEO agent Linear posting
- ENG-XXX: Phase 1b Step 5 — BriefForm UI
- ENG-XXX: Phase 1b Step 6 — audit view rendering
- ENG-XXX: Phase 1b Step 7 — manual e2e pass + cleanup

---

## Footnote — about this plan

This plan was drafted overnight on 2026-04-08 by Ben's Claude Code session. The initial draft flagged every architectural decision as OPEN pending a co-founder call, because project CLAUDE.md forbade unilateral architectural decisions. Ben reviewed the eight calls mid-session, approved the defaults I proposed, and delegated ownership of the overnight build. The plan was then rewritten with decisions locked, the corresponding `docs/decisions.md` entry was added, and Phase 1b code execution began on this branch.

Phase 1b is the first time the dashboard touches the outside world. The scope discipline in this plan is deliberate — if any step grows beyond the shape described here, stop and reassess rather than pushing through.
