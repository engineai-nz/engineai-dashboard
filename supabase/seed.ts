/**
 * Phase 1a seed script.
 *
 * Inserts two synthetic projects under DEV_TENANT_ID so the cockpit
 * audit view isn't empty on first load. Idempotent: safe to re-run.
 *
 * Run with: npx tsx supabase/seed.ts
 */

import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

loadDotenv({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error(
    '[seed] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local',
  );
}

const DEV_TENANT_ID = 'dev-tenant-001';

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const SEEDS = [
  {
    tenant_id: DEV_TENANT_ID,
    name: 'BIAB landing page rebuild',
    brief: 'Rebuild the Business in a Box landing page with the new brand kit. Need a clear pricing table and one prominent CTA.',
    division_slug: 'biab',
  },
  {
    tenant_id: DEV_TENANT_ID,
    name: 'Skunkworks AI maestro demo',
    brief: 'Build a 60-second demo of the AI maestro orchestration loop that we can drop into client decks.',
    division_slug: 'skunkworks',
  },
];

async function main() {
  for (const seed of SEEDS) {
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('tenant_id', seed.tenant_id)
      .eq('name', seed.name)
      .maybeSingle();

    if (existing) {
      console.log(`[seed] skip — already exists: ${seed.name}`);
      continue;
    }

    const { error } = await supabase.from('projects').insert(seed);
    if (error) {
      console.error(`[seed] insert failed: ${seed.name} — ${error.message}`);
      process.exit(1);
    }
    console.log(`[seed] inserted: ${seed.name}`);
  }
  console.log('[seed] done');
}

main();
