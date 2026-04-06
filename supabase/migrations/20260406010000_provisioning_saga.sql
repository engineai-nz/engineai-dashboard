-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    division TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    stage TEXT NOT NULL DEFAULT 'analysis',
    locked_stages TEXT[] DEFAULT '{}',
    kpis JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

-- Create provisioning ledger (The Saga)
CREATE TABLE IF NOT EXISTS public.provisioning_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id),
    github_repo_url TEXT,
    supabase_project_id TEXT,
    vercel_project_id TEXT,
    state TEXT CHECK (state IN ('idle', 'creating_repo', 'provisioning_db', 'injecting_secrets', 'running_ast', 'active', 'failed', 'rolling_back')),
    github_status TEXT DEFAULT 'pending',
    supabase_status TEXT DEFAULT 'pending',
    vercel_status TEXT DEFAULT 'pending',
    ast_status TEXT DEFAULT 'pending',
    github_cleanup_ref TEXT,
    supabase_cleanup_ref TEXT,
    vercel_cleanup_ref TEXT,
    github_idempotency_key TEXT UNIQUE,
    supabase_idempotency_key TEXT UNIQUE,
    vercel_idempotency_key TEXT UNIQUE,
    retry_count INTEGER DEFAULT 0,
    error_log JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provisioning_ledger ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation
CREATE POLICY "Users can only access their own tenant's projects"
    ON public.projects FOR ALL
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can only access their own tenant's provisioning ledger"
    ON public.provisioning_ledger FOR ALL
    USING (project_id IN (SELECT id FROM public.projects WHERE tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));
