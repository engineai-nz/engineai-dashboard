-- Phase 1b: add Linear issue ID to projects.
--
-- Nullable text column so briefs submitted without a Linear issue
-- continue to work (they are the default — Phase 1a had no such field).
-- Format is validated at the API boundary in
-- src/app/api/cockpit/submit-brief/route.ts against /^[A-Z]+-\d+$/.
--
-- RLS: projects already has RLS enabled from migration 0001 and this
-- column inherits that policy. No extra work needed.
--
-- Applied via Supabase MCP / local CLI on 2026-04-08.

alter table projects
  add column linear_issue_id text;
