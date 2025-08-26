# Implement `/api/chat/message` Backend Route

Objective: Provide a minimal operational chat endpoint so the existing `sendChat` client (currently feature-flagged) can be enabled when desired.

## Scope

* Add Fastify route: `POST /api/chat/message`.
* Request body: `{ message: string; sessionId?: string }`.
* Response body: `{ sessionId: string; reply: string; traces?: any[] }`.
* Use placeholder deterministic reply for now (e.g., echo / simple transform) to avoid blocking on LLM integration.

## Design Choices

* Stateless echo with session persistence courtesy of generated UUID if sessionId not provided.
* Keep logic in dedicated module `routes/chat.ts` for easy later extension.
* Add lightweight validation with Zod (import from `@rpg/types` if a Chat schema emerges later, else inline).
* Include basic tracing stub array (empty) to shape future debugging data.

## Step-by-step

1. Create route file `packages/backend/src/routes/chat.ts`.
1. Define Zod schema:

  ```ts
  const ChatRequestSchema = z.object({
    message: z.string().min(1),
    sessionId: z.string().uuid().optional()
  });
  ```

  (If uuid dependency missing, relax to `.min(10)` or add `crypto.randomUUID()` generation when absent.)
1. Register route in main registration point (likely `src/index.ts` or a `routes/index.ts`).

1. Handler logic:

* Parse body.
* `const sid = body.sessionId ?? crypto.randomUUID();`
* Construct reply: e.g., `reply = "(echo) " + body.message.slice(0, 500);`
* Return `{ sessionId: sid, reply, traces: [] }`.

1. Add feature flag check (optional): If env `ENABLE_CHAT_API=false`, return 501; keeps parity with frontend gating.

1. Update health endpoint? (Not required — optional to add `chat:true` if route enabled.)

1. Add unit test:

* File: `packages/backend/tests/chat-route.spec.ts`.
* Use Fastify inject to POST sample payload and assert 200 + shape.

1. Run backend tests: `pnpm --filter @rpg/backend test`.

1. Enable frontend flag locally (`VITE_FRONTEND_CHAT_ENABLED=true`) and manually test via UI or curl.

1. Commit: `feat(chat): add /api/chat/message route with stub reply`.

## Example Implementation Snippet

```ts
// routes/chat.ts
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const ChatRequestSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().uuid().optional()
});

export async function chatRoutes(app: FastifyInstance) {
  app.post('/api/chat/message', async (req, reply) => {
    if (process.env.ENABLE_CHAT_API === 'false') {
      return reply.code(501).send({ error: 'Chat disabled' });
    }
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.message });
    }
    const { message, sessionId } = parsed.data;
    const sid = sessionId ?? (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    const echo = `(echo) ${message}`;
    return { sessionId: sid, reply: echo, traces: [] };
  });
}
```

## Test Skeleton

```ts
import { describe, it, expect } from 'vitest';
import buildApp from '../src'; // or the exported builder

describe('chat route', () => {
  it('echoes message and generates session id', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat/message',
      payload: { message: 'Hello' }
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.reply).toContain('Hello');
    expect(body.sessionId).toBeTruthy();
  });
});
```

## Validation Checklist

* [ ] Route file added & registered.
* [ ] Tests passing.
* [ ] Feature flag (optional) respected.
* [ ] Frontend `sendChat` works when both backend route & flag enabled.

## Future Enhancements

* Integrate memory extraction & persistence of conversation turns.
* Add streaming (SSE / WS) for multi-token replies.
* Attach trace objects (token estimates, embedding ids, retrieval hits).
* Rate limiting / auth once real identity system added.

## Rollback Plan

Remove route file + test and revert registration changes; frontend remains safely gated.

---
Ready to implement; independent of schema consolidation sequence.
