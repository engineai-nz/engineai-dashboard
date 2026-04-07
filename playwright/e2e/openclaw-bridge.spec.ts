import { test, expect } from '@playwright/test';

test.describe('OpenClaw Bridge API', () => {
  test('@P0 @API rejects unauthorised requests', async ({ request }) => {
    const res = await request.post('/api/agents/openclaw/bridge', {
      data: {},
      // Don't fail the request on non-2xx — we're asserting on the status.
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });

  test('@P0 @API validates the Handoff Envelope', async ({ request }) => {
    const res = await request.post('/api/agents/openclaw/bridge', {
      data: { invalid: 'data' },
      headers: {
        Authorization: 'Bearer test-key',
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(400);
  });
});
