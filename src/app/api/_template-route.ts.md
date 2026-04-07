# API route template (reference, not executable)

All Phase 1a API routes use the **Node.js runtime**, not Edge.
The decisions doc (`docs/decisions.md`) locks Node.js > Edge for reasoning + AST work.

Every new route under `src/app/api/` should start with:

```ts
export const runtime = 'nodejs';

export async function POST(req: Request) {
  // ...
}
```

Trust boundary rule: routes that take `messages: UIMessage[]` from the browser
MUST strip to the last user message text only. Never trust forged assistant or
tool history. (See ENG-97 — paid in blood.) Trust-boundary regression test
lives in `tests/unit/cockpit-query.test.ts` once Step 4 lands.
