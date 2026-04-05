-- Create Intelligence Records Table
CREATE TABLE public.intelligence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL, -- industry, technical, market, modular
  source TEXT NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 0.0,
  tags TEXT[] DEFAULT '{}'::text[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_intel_tenant_id ON public.intelligence_records(tenant_id);

-- Enable RLS
ALTER TABLE public.intelligence_records ENABLE ROW LEVEL SECURITY;

-- Create Tenant isolation policy
CREATE POLICY "Executives can manage their tenant's research" ON public.intelligence_records
  FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at_intel()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER intel_updated_at
  BEFORE UPDATE ON public.intelligence_records
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at_intel();
