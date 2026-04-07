# CLAUDE.md — EngineAI Dashboard

## Project Overview

**Project:** EngineAI Dashboard
**Repo:** `engineai-nz/engineai-dashboard`
**Owner:** Engine AI (Internal)
**Founders:** Ben du Chateau, Joe Ward (Wardo)
**Purpose:** Autonomous operational nervous system for Engine AI. Executive Cockpit + Digital Assembly Line of AI agents. Automates the 6-stage delivery pipeline (Discovery to MRR). Blueprint for "Business in a Box" SME template.

---

## Role in This Project

**Active contributor.** Ben is now working directly in the codebase alongside Joe.

- Ben works on a feature branch, Joe reviews/merges (or vice versa)
- Adversarial review work continues as needed (see `adverserial review ben/` and `docs/`)
- Architecture decisions should be discussed between both founders before implementation

---

## Key People

| Person | Role |
|---|---|
| Ben du Chateau | Co-founder, active contributor, adversarial reviewer |
| Joe Ward (Wardo) | Co-founder, PRD author, primary builder |

---

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS, Framer Motion
- **AI/Orchestration:** Vercel AI SDK v6, Google Gemini (`@ai-sdk/google`)
- **Durable Logic:** Vercel Workflows (`@upstash/workflow`) for long-running pipelines
- **Database/Auth:** Supabase (PostgreSQL + RLS)
- **Validation:** Zod schemas throughout (HandoffEnvelopeSchema, etc.)
- **Engineering:** `ts-morph` for AST-based code refactoring
- **Testing:** Playwright (E2E)
- **Design System:** Tech Noir (`#0A0A0A` / `#C4A35A`)

---

## Development

```bash
npm install
npm run dev        # Next.js dev server with Turbo
npm run lint       # ESLint 9
npm run test:e2e   # Playwright E2E tests
```

Requires Node >= 20.10.0. See `.env.local.example` for required environment variables.

---

## Constraints

1. **NZ English throughout.** Organisation, programme, colour, optimise, etc.
2. **Runtime split:** Reasoning/AST tasks use Node.js runtime. UI/Streaming uses Edge.
3. **Handoff integrity:** Every agent transition validated against `HandoffEnvelopeSchema` (Zod).
4. **Multi-tenant isolation:** All queries scoped by `tenant_id`.
5. **Sealed envelope pattern:** Agents never touch client secrets. Deterministic functions handle credentials.
6. **Coordinate with Joe.** No unilateral architecture changes. Discuss first.

---

## Key Architecture Patterns

- **Outbox pattern:** Deterministic `effect_id = hash(run + step + type + params)` prevents duplicate side effects on agent retry
- **Sealed envelope:** LLM agents trigger deployment but never see secrets. Node.js functions inject credentials; agents only get success/fail status.
- **BMAD pipeline:** Joe uses BMAD/Gemini for PRD and architecture generation. Always cross-reference prior review findings when reviewing new output.

---

## Project Structure

- `src/` — Next.js application source
- `src/features/cockpit/` — Executive Cockpit (HUD, ProgressiveRibbon, CommandStrip)
- `src/app/api/workflows/` — Specialist agent swarms
- `supabase/` — Database migrations and config
- `_bmad/` + `_bmad-output/` — BMAD agent framework and output
- `adverserial review ben/` — Ben's adversarial review documents
- `docs/` — Architecture, PRD, decisions, review history
- `tasks/` — Session state (todo.md, lessons.md)
- `design-artifacts/` — Design system assets

---

## Adversarial Review Framework

When reviewing a PRD or architecture doc, check for:
- **Completeness:** Pipeline stages defined? Agent responsibilities clear?
- **Contradictions:** Conflicting sections?
- **Edge cases:** Agent failure handling? Fallbacks?
- **Dependencies:** External service dependencies realistic?
- **Security:** Data boundaries, auth flows, agent permissions
- **Scalability:** Works for 1 client? 10? 50?
- **AI generation tells:** BMAD/Gemini output self-validates with green checkmarks. Never trust "Validation Results" sections.

---

## Session Protocol

1. Check `tasks/todo.md` for active work
2. Check `tasks/lessons.md` for prior findings and gotchas
3. Check `docs/decisions.md` for architecture decisions
