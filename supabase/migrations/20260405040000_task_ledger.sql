-- Create Task Ledger Table (High-Integrity ADR-004 Version)
CREATE TABLE public.task_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id TEXT NOT NULL,
  step_key        TEXT NOT NULL,
  agent_role      TEXT NOT NULL CHECK (agent_role IN ('ceo', 'specialist', 'sre', 'manager', 'executive', 'architect', 'developer', 'qa', 'openclaw', 'system', 'user')),
  tenant_id       UUID NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','running','checkpoint','completed','failed','blocked','dead_letter')),
  checkpoint      JSONB NOT NULL DEFAULT '{}'::jsonb, -- Resumable LLM state
  tool_cache      JSONB NOT NULL DEFAULT '[]'::jsonb, -- Cached tool results
  effects_log     JSONB NOT NULL DEFAULT '[]'::jsonb, -- The Outbox (side effects)
  attempts        INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 3,
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  UNIQUE (workflow_run_id, step_key)
);

-- Enable RLS
ALTER TABLE public.task_ledger ENABLE ROW LEVEL SECURITY;

-- Create Tenant isolation policy
CREATE POLICY "Executives can view their tenant's ledger" ON public.task_ledger
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "Agents can insert into their tenant's ledger" ON public.task_ledger
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "Agents can update within their tenant's ledger" ON public.task_ledger
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  );

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER task_ledger_updated_at
  BEFORE UPDATE ON public.task_ledger
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();
