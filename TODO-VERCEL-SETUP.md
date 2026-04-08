# TODO — Vercel project setup (manual)

These steps must be done by Ben in the Vercel dashboard. They cannot be
automated from CLI without an org token.

- [ ] Link the GitHub repo `engineai-nz/engineai-dashboard` to a new Vercel project
- [ ] Set production env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Enable **Password Protection** on Preview deployments (Settings → Deployment Protection → Vercel Authentication or Password)
- [ ] Set `ALLOW_DEV_TENANT_IN_PROD=true` on **Preview** environment only (not Production). The call-time guard in `src/lib/tenant/dev.ts` blocks dev-tenant requests in `NODE_ENV=production` unless this is set. Phase 1a previews need it to function. Phase 1.5 deletes both the constant and the env var.
- [ ] Confirm one preview deploy succeeds end to end before merging the Step 1 PR

This file gets deleted when all boxes are ticked.
