-- Create Project Secrets Table
CREATE TABLE public.project_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  secret_value TEXT NOT NULL, -- Simulated encryption (Base64 Scrambled in Phase 1)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for RLS Performance
CREATE INDEX idx_project_secrets_tenant_id ON public.project_secrets(tenant_id);

-- Enable RLS
ALTER TABLE public.project_secrets ENABLE ROW LEVEL SECURITY;

-- Create Tenant isolation policy
CREATE POLICY "Executives can manage their tenant's secrets" ON public.project_secrets
  FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at_secrets()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER project_secrets_updated_at
  BEFORE UPDATE ON public.project_secrets
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at_secrets();
