# Story 2.1: The Task Ledger (Handoff Envelope Schema)

Status: in-progress

## Story

As a Managerial Agent,
I want a strictly typed "Handoff Envelope" schema and a persistent Task Ledger,
so that I can coordinate work between specialists with 100% auditability.

## Acceptance Criteria

1. **Zod Handoff Schema established** defining the structure for agent-to-agent communication (sender, recipient, task_id, payload, timestamp). [Source: architecture.md#Handoff Protocol]
2. **Supabase `task_ledger` table created** with RLS enforced for tenant isolation. [Source: architecture.md#Data Models]
3. **Traceability Chain implemented** where every task record includes a `parent_task_id` to allow recursive audit drill-downs. [Source: prd.md#FR10]
4. **NZ English labels utilized** for all user-facing audit logs (e.g., "Initialised", "Authorised").
5. **Schema validation middleware established** to verify all incoming handoffs before persistence.

## Tasks / Subtasks

- [x] **Task 1: Handoff Schema Definition (AC: 1)**
  - [x] Create `src/lib/schemas/handoff.ts` using Zod.
  - [x] Establish `AgentRole` and `TaskStatus` enums for strict typing.
- [x] **Task 2: Task Ledger Database Schema (AC: 2, 3)**
  - [x] Create SQL migration for `public.tasks` table with recursive `parent_task_id`.
  - [x] Implement multi-tenant RLS policies using `user_metadata.tenant_id`.
  - [x] Add automated `updated_at` trigger.
- [x] **Task 3: Persistence Logic (AC: 5)**
  - [x] Implement `src/lib/tasks.ts` with Zod-validated CRUD operations.
  - [x] Add `getTaskAuditTrail` for recursive trace reconstruction.
- [x] **Task 4: Initial Integration (AC: 4)**
  - [x] Update `HUD.tsx` with a dynamic "Task Ledger Audit" stream.
  - [x] Implement high-fidelity audit log items with status pulses.
  - [x] Verify NZ English usage (e.g., "Initialise", "Validating").

## Dev Notes

- **Zod + SQL:** The schema ensures that any agent-to-agent payload is validated both at the application level and the database level (via JSONB constraints in future migrations, current basic RLS established).
- **Traceability:** The `parent_task_id` allows for the "Root-cause audit" required by FR10.
- **Build Fix:** Converted `Sidebar.tsx` to a Client Component to handle interactive command inputs.

### Project Structure Notes

- **Schemas:** Centralized in `src/lib/schemas/`.
- **Ledger API:** CRUD operations centralized in `src/lib/tasks.ts`.

### References

- [Source: architecture.md] - Handoff Protocol & Data Models.
- [Source: prd.md] - FR10: Managerial Oversight.
- [Source: implementation-artifacts/epic-1-retro.md] - Action Item: Data-Access Layer.

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Flash

### Debug Log References

- Build successful: 4/4 pages verified.
- Sidebar interactivity fix applied with `'use client'`.

### Completion Notes List

- Handoff Envelope schema established with Zod.
- Supabase tasks table and RLS baseline created.
- Recursive audit trail fetching implemented.
- HUD "Task Ledger Audit" stream UI implemented.

### Review Findings

- [x] [Review][Critical] Spec Compliance: Renamed `tasks` table to `task_ledger` to match the spec (AC 2).
- [x] [Review][Patch] Type Safety: Updated `tenant_id` to use `.uuid()` validation in Zod schema.
- [x] [Review][Patch] RLS Performance: Optimized RLS policies to use direct UUID comparison instead of string casting.
- [x] [Review][Patch] Shared Logic: Abstracted project filtering into the `useFilteredProjects` hook.
- [x] [Review][Patch] Accessibility: Added `aria-label` attributes to navigation links in the sidebar.
- [ ] [Review][Patch] Schema Mismatch: AgentRoleSchema includes 'system' and 'user' not in DB constraint. [src/lib/schemas/handoff.ts:4]
- [ ] [Review][Patch] Schema Mismatch: TaskStatusSchema includes 'active' and 'blocked' not in DB constraint. [src/lib/schemas/handoff.ts:21]
- [ ] [Review][Patch] Missing mapping: `createLedgerTask` omits `tool_cache` and `last_error`. [src/lib/tasks.ts:10]
- [ ] [Review][Patch] Missing logic: Deterministic `effect_id` generation utility is absent. [src/lib/schemas/handoff.ts:46]
- [ ] [Review][Patch] Missing logic: Side-effect idempotency check in `effects_log` is absent. [src/lib/tasks.ts:42]
- [ ] [Review][Patch] Missing logic: Resumption/replay logic for `tool_cache` and `checkpoint`. [src/lib/tasks.ts]
- [ ] [Review][Patch] Error Handling: `createLedgerTask` does not handle uniqueness violations (workflow_run_id + step_key). [src/lib/tasks.ts:26]
- [ ] [Review][Patch] Missing field: `completed_at` should be updated on completion. [src/lib/tasks.ts]

Status: review
