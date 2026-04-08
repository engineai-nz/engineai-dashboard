# EngineAI Dashboard — Decisions

## 2026-04-04: Support mode only
This project is adversarial review support for Joe's build, not our build. No production code, no unilateral architecture decisions. Critique with references, don't rewrite.

## 2026-04-04: Dual-agent review as standard process
PRD reviews run Claude + Codex independently, then synthesise. Codex caught things Claude missed (missing research artifact, NFR10/Phase 2 conflict, idempotency gaps). Process codified as /adversarial-review skill.

## 2026-04-04: Review Ops Platform parked
Full Supabase-backed review platform with finding lifecycle, Linear sync, and client tenancy is specced but parked. Build after skill proves itself through 5+ real review runs.

## 2026-04-04: Code Combat process established
Multi-round adversarial negotiation between Claude+Codex and Joe's Gemini 3.1 Pro. 5 rounds took architecture from generated fluff to locked execution model. Process codified as /code-combat skill. Key agreements reached:
- 5 ADRs (Vercel AI SDK, Workflows, Node.js over Edge, Saga pattern, Sealed envelopes)
- task_ledger + provisioning_ledger schemas with outbox pattern
- HandoffEnvelope Zod schema (4000 char summary cap, deterministic effect IDs)
- 3-phase FR boundary (Phase 1: Cockpit + CEO + Specialist only)
- Sealed envelope pattern for secret injection (agents never see credentials)

## 2026-04-04: Gemini is fine for generation, not self-review
Gemini 3.1 Pro generates good scaffolding but cannot challenge its own output. Use it for drafting (PRDs, epics, architecture first pass), then run adversarial review + code combat to stress-test. The BMAD pipeline is a generation tool, not a validation tool.

## 2026-04-07: Active contributor mode (supersedes 2026-04-04 support-only)
Ben is now building directly on engineai-dashboard alongside Joe, not just reviewing. Both can commit, the relationship is co-founder partnership. Coordination via PRs is the norm. The CLAUDE.md was rewritten this session to reflect this. The prior "no production code, no unilateral decisions" constraint no longer applies.

## 2026-04-07: No-op Supabase client over placeholder URL fallback
The previous fallback in `src/lib/supabase.ts` and `src/lib/supabase-server.ts` returned a real Supabase client pointed at `https://placeholder.supabase.co` when env vars were missing. Any consumer that called `.from('table').select()` triggered a real network fetch and `ERR_NAME_NOT_RESOLVED`. Replaced with a chainable+awaitable no-op (`src/lib/supabase-noop.ts`) that resolves all queries to `{ data: [], error: null }` without making network calls. Logs a single info banner per process so devs know they're in stub mode. In production, the env vars MUST be set — this stub is dev-only.

## 2026-04-07: useCommandStrip is a typed scaffold, not a real integration
Joe's `src/hooks/useCommandStrip.ts` was written against an older Vercel AI SDK (v5-ish) `useChat` API that returned `input`, `setInput`, `append`, `isLoading`. v6 redesigned the hook entirely (`useChat({ messages, sendMessage, status })`). Rather than rewrite the chat integration in this branch, the hook's chat-related fields are now backed by local React state with a clear NOTE block at the top explaining it's temporary. The real v6 integration is on the todo queue. The `toolInvocations` field is typed loosely (`any[]`) because the scaffold never produces tool calls.

## 2026-04-07: CockpitShell as shared chrome component
Extracted the top nav (EngineAI OS branding, system status pill, manual override, Initialise button) into `src/components/CockpitShell.tsx`. Both `app/page.tsx` (home) and `app/division/[slug]/page.tsx` now wrap HUD in CockpitShell. State (system override) lives in CockpitShell and is exposed via React Context (`useCockpitShell`) so HUD can read pause state. Render-prop pattern was tried first but failed at the server -> client component boundary ("Functions are not valid as a child of Client Components"); React Context is the RSC-compatible alternative.

## 2026-04-07: Pin react/react-dom exact (no caret) to match Joe's style
`@ai-sdk/react@3.x` peer-dep explicitly skips `react@19.2.0` (constraint is `^18 || ~19.0.1 || ~19.1.2 || ^19.2.1`). Bumped react and react-dom from `19.2.0` to `19.2.1`. Used exact pins (no `^` caret) to match Joe's existing style for framework cores in package.json.

## 2026-04-08: Phase 1a P0 fixes
Overnight adversarial review flagged four P0s on Phase 1a. Three were real and are fixed on `fix/phase1a-p0s` (commit `33a5578`):
1. Reasoning-token leak — centralised stripping via `stripReasoningTokens()` in `src/lib/agents/model.ts`. Both `discovery-agent.ts` and `prd-agent.ts` now strip `<think>`, `<thinking>`, and `<reasoning>` tags (with or without attributes) before parsing or returning. Unit test in `tests/unit/strip-reasoning-tokens.test.ts`.
2. Agent timeouts — `generateText` calls in discovery and PRD agents now pass `abortSignal: AbortSignal.timeout(90_000)` plus `maxOutputTokens` (2000 discovery, 4000 PRD).
3. Orphan project rows — `submit-brief/route.ts` now transitions `projects.status` through `pending → running → (complete | failed)` via a new `updateProjectStatus()` helper in `src/lib/db/projects.ts`. Rollback on error is best-effort (logged on failure) so a DB hiccup on rollback doesn't mask the original pipeline error.

The fourth "P0" (missing RLS policies) was **demoted to P2**. The 0001 migration explicitly documents that Phase 1a's RLS strategy is "enabled + no policies for anon + no anon grants = deny-all", with the app-layer tenant filter on the service-role client as the real boundary. Adding policies now would require a session GUC mechanism that does not yet exist and would break the working system. Deferred to Phase 1.5 alongside real auth, where the policies can be written against the session-bound tenant variable.

## 2026-04-08: Phase 1b MCP architecture — decisions locked
Eight decisions for Phase 1b (MCP Runtime Spike with Linear Posting). Locked during the overnight session on 2026-04-08 after Ben reviewed the proposed defaults. Full context in `docs/phase1b-plan.md`.

1. **MCP server runtime: Linear-hosted remote.** Linear publishes an official MCP server at `https://mcp.linear.app/mcp`. We are the *client*, not running a server. Streamable HTTP transport, authenticated via `Authorization: Bearer`. The earlier "in-process vs separate Vercel vs external host" options are all moot because there is no hosting decision to make — Linear hosts it. Discovered during the Phase 1b Step 1 spike; the original plan was updated and re-committed accordingly.
2. **Credential storage: Vercel env var.** `LINEAR_API_KEY` as a plain env var, passed as `Authorization: Bearer ${LINEAR_API_KEY}` on the streamable HTTP transport. Phase 1a is single-tenant (`DEV_TENANT_ID`) so per-tenant credential tables are premature. A `linear_credentials` table with RLS lands alongside real auth in Phase 1.5.
3. **Wrapper → MCP auth: Bearer token.** Passed via `requestInit.headers` on the `StreamableHTTPClientTransport` constructor. Single source of truth for the key is `src/lib/agents/tools/postLinearComment.ts` + `src/lib/mcp/linear-client.ts` — no other module reads `process.env.LINEAR_API_KEY`.
4. **MCP client implementation: `@modelcontextprotocol/sdk`.** Official TypeScript MCP SDK (v1.29.x on npm at time of writing). Imports: `Client` from `@modelcontextprotocol/sdk/client/index.js` and `StreamableHTTPClientTransport` from `@modelcontextprotocol/sdk/client/streamableHttp.js`. Exact-pinned in `package.json`. No Linear-specific package to install — we speak MCP, the server happens to be Linear's.
5. **Linear tool scope: `create_comment` only.** No `create_issue`, no search, no update, no labels. One tool, one path.
6. **How user specifies target issue: optional text field on `BriefForm`.** New column `projects.linear_issue_id` (nullable text). Client-side validation `/^[A-Z]+-\d+$/`. No auto-detect from brief text — false-positive hazard.
7. **Failure policy: run still marks complete; Linear post failures are run_steps.** The Linear post is a side effect, not part of the run. Logged as a `run_step` with `step_name='linear_post'`, `status='failed'`, non-empty `error`. No automatic retry. Audit view surfaces the failure.
8. **Response time budget: 3s soft target, no hard SLA.** Synchronous wrapper only in 1b. If synchronous posting becomes a UX problem, the fix is async posting in Phase 1c durability work — NOT a bolt-on retry or background job in 1b.

Scope anti-patterns carried forward: no multi-MCP routing layer (one MCP means no routing), no tool whitelisting config (one tool, enforced in code), no hand-rolled MCP client (official SDK only), no `fetch` to Linear's API from agent code (only the sealed wrapper), no secret exposure to agents (CI grep for `process.env.LINEAR_*` outside the wrapper).
