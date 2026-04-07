import { mergeTests } from '@playwright/test';
import { test as apiRequestFixture } from '@seontechnologies/playwright-utils/api-request/fixtures';
import { test as recurseFixture } from '@seontechnologies/playwright-utils/recurse/fixtures';
import {
  createAuthFixtures,
  setAuthProvider,
  authStorageInit,
  configureAuthSession,
} from '@seontechnologies/playwright-utils/auth-session';
import { log } from '@seontechnologies/playwright-utils/log';
import mockAuthProvider from '../auth/mock-auth-provider';
import path from 'path';

/**
 * Initialize and configure auth session persistence.
 *
 * Note: the upstream type is `storageDir`, not `authStoragePath` —
 * the latter was the old name and was renamed in playwright-utils.
 */
authStorageInit();
configureAuthSession({
  storageDir: path.resolve(process.cwd(), '.auth'),
});

// Register the mock provider early
setAuthProvider(mockAuthProvider);

/**
 * Merge playwright-utils fixtures.
 */
const mergedUtils = mergeTests(apiRequestFixture, recurseFixture);

/**
 * Two-step extend to keep the auth fixture spread isolated from the
 * custom `log` fixture, and to scope the type assertion below.
 *
 * createAuthFixtures() returns an object whose `authOptions` and
 * `authSessionEnabled` use the tuple-array option syntax
 * `(T | { option: boolean })[]`. That syntax doesn't satisfy Playwright's
 * `Fixtures<>` constraint as TypeScript reads it, so the spread is
 * rejected even though the runtime behaviour is correct. This is an
 * upstream typing bug in @seontechnologies/playwright-utils — the cast
 * is the smallest change that preserves intent.
 *
 * No current spec actually consumes `authOptions` / `authToken` /
 * `authSessionEnabled` from this fixture set, so the cast hides no
 * behavioural risk. When real Supabase auth is wired, this whole stack
 * gets replaced with a typed Supabase auth provider.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withAuthFixtures = mergedUtils.extend(createAuthFixtures() as any);

/**
 * Add the custom `log` fixture exposing the playwright-utils logger so
 * spec files can call `log.step('...')` via destructured test args.
 */
export const test = withAuthFixtures.extend<{ log: typeof log }>({
  log: async ({}, use) => {
    await use(log);
  },
});

export { expect } from '@playwright/test';
