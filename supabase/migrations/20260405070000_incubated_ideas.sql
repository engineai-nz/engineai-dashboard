-- Create Incubated Ideas Table
CREATE TABLE public.incubated_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  concept_title TEXT NOT NULL,
  concept_description TEXT NOT NULL,
  assessment JSONB NOT NULL DEFAULT '{}'::jsonb, -- Viability, Complexity, Required Modules
  status TEXT NOT NULL DEFAULT 'incubated', -- incubated, archived, active
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_ideas_tenant_id ON public.incubated_ideas(tenant_id);

-- Enable RLS
ALTER TABLE public.incubated_ideas ENABLE ROW LEVEL SECURITY;

-- Create Tenant isolation policy
CREATE POLICY "Executives can manage their tenant's incubated ideas" ON public.incubated_ideas
  FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at_ideas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ideas_updated_at
  BEFORE UPDATE ON public.incubated_ideas
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at_ideas();
