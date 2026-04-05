-- Create Task Ledger Table
CREATE TABLE public.task_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  parent_task_id UUID REFERENCES public.task_ledger(id),
  sender_role TEXT NOT NULL,
  recipient_role TEXT NOT NULL,
  task_title TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_ledger ENABLE ROW LEVEL SECURITY;

-- Create Tenant isolation policy
CREATE POLICY "Executives can view their tenant's ledger" ON public.task_ledger
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "Agents can insert into their tenant's ledger" ON public.task_ledger
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "Agents can update within their tenant's ledger" ON public.task_ledger
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
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
