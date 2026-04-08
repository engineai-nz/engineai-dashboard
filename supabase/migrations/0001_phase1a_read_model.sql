-- Phase 1a read model.
--
-- Four tables: projects, runs, run_steps, artifacts.
-- All scoped by tenant_id (text). Phase 1a uses the hardcoded
-- DEV_TENANT_ID constant from src/lib/tenant/dev.ts. Phase 1.5
-- replaces this with session-bound scoping when magic-link auth lands.
--
-- RLS strategy for Phase 1a:
--   - Tables have RLS enabled but NO policies for the anon role.
--     Result: anon role can read/write nothing.
--   - Service role bypasses RLS by design (Postgres convention).
--     The tool wrappers in src/lib/agents/tools/ are the only callers
--     of the service-role client, and they always filter by tenant_id
--     in app code.
--   - The Vitest test in tests/unit/rls.test.ts asserts that the anon
--     client returns zero rows after the service client inserts data.
--
-- Applied via Supabase MCP on 2026-04-07.

create extension if not exists "uuid-ossp";

create type run_status as enum ('pending', 'running', 'complete', 'failed');
create type project_status as enum ('pending', 'running', 'complete', 'failed');

create table projects (
  id uuid primary key default uuid_generate_v4(),
  tenant_id text not null,
  name text not null,
  brief text not null,
  division_slug text not null,
  status project_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_tenant_idx on projects(tenant_id);

create table runs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  tenant_id text not null,
  status run_status not null default 'pending',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error text
);
create index runs_tenant_idx on runs(tenant_id);
create index runs_project_idx on runs(project_id);

create table run_steps (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references runs(id) on delete cascade,
  tenant_id text not null,
  step_name text not null,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb,
  status run_status not null default 'pending',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  tokens_in int,
  tokens_out int
);
create index run_steps_tenant_idx on run_steps(tenant_id);
create index run_steps_run_idx on run_steps(run_id);

create table artifacts (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references runs(id) on delete cascade,
  tenant_id text not null,
  kind text not null,
  content_markdown text not null,
  created_at timestamptz not null default now()
);
create index artifacts_tenant_idx on artifacts(tenant_id);
create index artifacts_run_idx on artifacts(run_id);

alter table projects enable row level security;
alter table runs enable row level security;
alter table run_steps enable row level security;
alter table artifacts enable row level security;
