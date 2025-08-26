# Sprint 1 – Foundational chat loop & relationship scaffold

Status: Planned (target scope for first playable romantic chat prototype without deep romance logic).
Duration: ~1 week (timebox adjustable).
Primary Goal: Ship an end‑to‑end local chat loop (player ↔ NPC) with basic persona grounding, intent tagging, provisional affection score, and a gated Chat UI panel—without destabilizing existing panels or backend routes.

## Outcome definition

A user can:

1. Select (or default to) one NPC persona.
1. Send chat messages via new ChatPanel.
1. Receive model (stub/echo or future LLM) replies from `/api/chat/message`.
1. See messages persist in session (refresh preserved if backend persistence toggled on).
1. Observe an affection meter changing modestly based on detected intent (annoyed/excited sample rules).

Non‑goals (explicitly deferred):

* Memory graph retrieval & fact extraction.
* Advanced romance stages / escalation pacing logic.
* Streaming token UI.
* Safety / consent boundaries enforcement (placeholder note only).
* Multi‑NPC switching mid‑session (single active NPC per session for now).

## High‑level architecture adjustments

* Fastify route `POST /api/chat/message` with minimal schema validation (Zod) + feature flag `ENABLE_CHAT_API`.
* Chat service module (backend) isolates prompt assembly (stub) and reply generation (echo or template).
* Frontend `ChatPanel` + `useChatStore` (new) managing turns, status, affection.
* Reuse `IntentDetector` (from `@rpg/context-modifier`) client‑side initially for responsiveness; optionally mirror server side later for authoritative scoring.
* Relationship state: simple numeric affection (0–100) with small deltas from intents.
* Shared types: add `ChatTurn` (if not reusing `panelConversationTurnSchema` – clarify difference).

## Data model (incremental)

| Concept | Temp Source | Persistence (Sprint 1) | Future (Later) |
|---------|-------------|------------------------|----------------|
| Turn | Backend echo or stub LLM | In memory (store) + optional array on server session map | Neo4j Turn node + edges |
| Session | Generated UUID per browser session | In memory (client) | Neo4j Session node |
| Affection | Client store number | In memory | Relationship edge property |
| Persona | Chosen character (or default) | Client store | Character node link |

## New environment / flags

| Name | Scope | Default | Purpose |
|------|-------|---------|---------|
| ENABLE_CHAT_API | backend | false | Gate chat route availability (returns 501 when off). |
| VITE_FRONTEND_CHAT_ENABLED | frontend | false | Reveals ChatPanel & enables client calls. |

## Backend tasks

* [ ] Add Zod schemas (`ChatRequestSchema`, `ChatResponseSchema`) local to `routes/chat.ts` (or new `schemas/chat.ts`).
* [x] Implement `/api/chat/message` route:
  * Validate body `{ message: string; sessionId?: string; personaId?: string }`.
  * Generate/assign sessionId (UUID) if missing.
  * Build reply (echo strategy: `(npc) ${message}` or a light templated transformation).
  * Return `{ sessionId, reply, personaId, turns?: Turn[] }` (turns optional for future batching).
  * Respect feature flag; respond 501 when disabled.
* [ ] Introduce minimal in‑memory `sessions` map keyed by sessionId storing turns (bounded length, e.g. last 50).
* [x] Add unit test `chat-route.spec.ts` verifying 200, uuid generation, 501 when disabled.
* [x] Wire chat route registration in backend bootstrap.

## Frontend tasks

* [x] Create `src/state/chatStore.ts`:
  * State: `turns: Array<{ role: 'user'|'assistant'; content: string; ts: number }>`; `sessionId?: string`; `affection: number`; `loading: boolean`; `error?: string`; `personaId?: string`.
  * Actions: `send(message)`, `setPersona(id)`, internal `_applyIntent(intent)`.
  * Affection delta mapping (tentative): excited +2, annoyed -2 (clamped 0–100).
* [x] Add `ChatPanel.tsx`:
  * Hidden unless `FLAGS.FRONTEND_CHAT_ENABLED`.
  * Layout: scrollable messages, affection meter (progress bar), textarea + send button, status line.
  * Auto scroll on new message.
* [ ] Integrate `ChatPanel` into Dashboard (dedicated section below LibraryPanel).
* [x] Intent detection: import `IntentDetector`, instantiate with sample rules (subset already in tests) inside `chatStore.send` after user send / after assistant reply (choose one consistent pass). 
* [x] Display last detected intent subtly (e.g., tooltip or small badge). 
* [x] Update feature flag docs / .env.example keys. 
* [ ] Add tests: 
  * Store test: sending user message appends user turn then assistant turn (mock fetch). 
  * Affection delta test. 
  * ChatPanel render test behind flag (flag on/off conditional). 

## Shared types / packages

* [ ] Consider adding `chatTurnSchema` in `@rpg/types` if conversation turns diverge from panel turn shape; else reuse `panelConversationTurnSchema`. For Sprint 1 reuse existing to avoid churn. 
* [ ] Export `ChatRequest` / `ChatResponse` TS types (even if defined in backend) through `@rpg/types` in future sprint—defer for now (keep local). 

## Prompt strategy (placeholder)

For Sprint 1 return `(echo) ${message}` to avoid blocking on model integration. Provide extension point: function `generateReply(sessionContext)` in a service module. 

## Safety considerations (not yet enforced)

Add comment blocks marking where future filters (NSFW, boundary enforcement) will plug in before reply generation. 

## Testing strategy

| Level | Test | Tool |
|-------|------|------|
| Unit (backend) | Chat route valid request returns 200 + body | Vitest (backend package) |
| Unit (frontend) | chatStore sends & receives | Vitest + fetch mock |
| Unit (frontend) | Affection changes with mocked intents | Vitest |
| Component | ChatPanel renders & hides via flag | Testing Library |

## Risks & mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Unimplemented backend route when flag accidentally on | UI error noise | UI checks flag + 501 -> clear user message with toast placeholder |
| Affection logic future redesign | Minor refactors | Keep delta mapping isolated in one function | 
| Overfetch / multiple rapid sends | Race conditions | Disable send while `loading`. |
| Large memory growth in session map | OOM risk | Cap stored turns per session (e.g. 50) & prune oldest. |

## Rollback plan

Route + store are additive. To rollback: remove ChatPanel import, delete `chatStore.ts`, unregister route, delete env flags. No existing functionality depends on them. 

## Task list (execution order)

* [x] Backend: implement chat route + tests. 
* [x] Frontend: chat store + flags update. 
* [x] Frontend: ChatPanel component + integrate in Dashboard. 
* [x] IntentDetector integration + affection deltas. 
* [ ] Frontend tests (store, panel). 
* [ ] Doc updates (.env.example, README snippet if present). 
* [ ] Manual QA (send several messages, toggle flags off). 
* [ ] Commit & tag `sprint1` (optional). 

## Acceptance checklist

* [x] `ENABLE_CHAT_API` off => route 501; UI hides ChatPanel if frontend flag off. 
* [ ] With both flags on, messages round‑trip and appear in ChatPanel. 
* [x] Affection changes on at least two distinct intents. 
* [ ] No TypeScript errors or failing existing tests. 
* [ ] Lint clean (Markdown + TS). 
* [ ] Docs updated with env flags. 

---
Prepared for implementation. Follow with Sprint 2 (memory + relationship persistence) after validation.
