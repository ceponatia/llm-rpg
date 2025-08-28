# LLM RPG Workspace

Monorepo containing memory backend, admin dashboard, and story/frontend prototypes.

## Quick start

1. Install deps: `pnpm install`
1. Copy `.env.example` to `.env` and adjust ports/keys.
1. Run backend + frontends: `pnpm dev`

## Chat feature flags (Sprint 1)

Set these in `.env` to enable the foundational chat loop.

| Flag | Scope | Default | Effect |
|------|-------|---------|--------|
| ENABLE_CHAT_API | backend | false | Enables POST /api/chat/message route (501 when off). |
| CHAT_ECHO_MODE | backend | true | Returns `echo: <message>` without model/memory. |
| VITE_FRONTEND_CHAT_ENABLED | frontend | false | Shows ChatPanel and allows sending messages. |

Turn all three on (ENABLE_CHAT_API=true, VITE_FRONTEND_CHAT_ENABLED=true) to exercise the end‑to‑end loop locally (leave CHAT_ECHO_MODE=true for stub replies).

## Packages

* `@rpg/backend` – Fastify server (memory, chat, static embedding)
* `@rpg/frontend` – Story/game UI prototype
* `@rpg/admin-dashboard` – Admin / ops UI
* `@rpg/types` – Shared types & (future) schemas
* `@rpg/utils` – Cross-cutting utilities (logging)

## Testing

Run all critical package tests:

```bash
pnpm test
```

Typecheck whole workspace:

```bash
pnpm typecheck
```

## Development notes

Sprint 1 delivered the initial chat loop with in‑memory session turns (bounded 50), simple intent detection (excited / annoyed), and an affection meter (0–100). Persistence beyond process memory and advanced romance logic are deferred to a later sprint.

<!-- ci test trigger -->
