# TODO — Vercel project setup (manual)

These steps must be done by Ben in the Vercel dashboard. They cannot be
automated from CLI without an org token.

- [ ] Link the GitHub repo `engineai-nz/engineai-dashboard` to a new Vercel project
- [ ] Set production env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Enable **Password Protection** on Preview deployments (Settings → Deployment Protection → Vercel Authentication or Password)
- [ ] **Do NOT set** `ALLOW_DEV_TENANT_IN_PROD` until Phase 1.5 is shipped — without it, a prod build will throw at import time, which is the correct behaviour for Phase 1a.
- [ ] Confirm one preview deploy succeeds end to end before merging the Step 1 PR

This file gets deleted when all boxes are ticked.
