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
