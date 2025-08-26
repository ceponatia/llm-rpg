# Sprint 2 – Codebase Consolidation, Shared Types & Persistence Prep

Status: Planned
Duration: ~1 week (timebox adjustable)
Primary Goal: Improve maintainability and consistency by extracting shared types, splitting monolithic files, removing duplication, and laying groundwork for persistent chat/memory & relationship evolution in later sprints.

## Outcome Definition

By end of Sprint 2:

1. Chat request/response + turn schemas live in `@rpg/types` (single source of truth) and are consumed by backend & frontend (no ad‑hoc local duplicates).
2. Monolithic `chat.ts` route split into route + service + repository modules with clear responsibilities.
3. Frontend `ChatPanel` decomposed into smaller, testable subcomponents with a shared UI primitives layer.
4. Inline intent detection in frontend replaced by shared `@rpg/context-modifier` usage (with lean import boundary to avoid bundle bloat).
5. Large backend `DatabaseManager` responsibilities separated (connection vs operations) enabling easier unit testing.
6. Dead / extraneous or generated files (unneeded `dist/` checked-in artifacts, redundant `.d.ts` duplicates) are audited and either removed or documented.
7. Environment flag handling centralized (validated at startup with Zod) and documented once.
8. Test coverage extended to new service / repository layers (chat service, session store, persistence repo).

Secondary (stretch) outcomes:

* Introduce minimal persistence abstraction for sessions (Neo4j write-path stub + read API) to prepare for full relationship persistence in Sprint 3.
* Add relationship edge placeholder schema (affection property) in Neo4j for forward compatibility (behind a flag).

## Key Architectural Changes

| Area | Current Pain | Change | Benefit |
|------|--------------|--------|---------|
| Chat route (`chat.ts`) | 280+ LOC mixing validation, memory retrieval, persistence, websocket, compatibility shaping | Split into `chatRoute.ts`, `chatService.ts`, `chatRepository.ts`, `sessionStore.ts` | Separation of concerns & easier unit tests |
| Session storage | In‑memory Map inline in route | Extract lightweight `SessionStore` interface + inMemory + future persistent adapters | Swap persistence without route edits |
| Types | Chat types ad-hoc + local interfaces | Add `chatTurnSchema`, `chatRequestSchema`, `chatResponseSchema` to `@rpg/types` | Single source, validation reuse |
| Intent detection | Duplicated minimal logic in frontend | Use shared `@rpg/context-modifier` light import or extracted `MiniIntentDetector` exported there | Remove duplication |
| Database manager | One large file (300+ LOC) | Split per concern (neo4j.ts, vector.ts, redis.ts, index orchestrator) | Targeted testing & change isolation |
| Frontend ChatPanel | Single component doing layout + logic | Subcomponents: `MessageList`, `AffectionMeter`, `ChatInput`, container | Better readability & reuse |
| Env flags | Scattered string checks | Central `config/flags.ts` with Zod parse & typed access | Safer flag usage |
| Generated `dist/` artifacts | Some committed (types, context-modifier) | Audit & decide: remove from VCS or document release pipeline | Reduce noise |

## Refactor / Implementation Tasks

### Shared Types & Schemas

* [x] Add `chatTurnSchema` (`id`, `role`, `content`, `timestamp`, optional `tokens`, `characterId`, `sessionId`).
* [x] Add `chatRequestSchema` & `chatResponseSchema` (align existing backend fields; include compatibility fields but mark legacy).
* [x] Export TypeScript types + Zod schemas from `@rpg/types` index.
* [ ] Generate & publish updated type build (adjust build if necessary to avoid committing large d.ts duplicates). – Skipped publish (internal monorepo only now; will publish when external consumers exist).
* [x] Backend: replace local Zod/chat interfaces with imports from `@rpg/types`.
* [x] Frontend: update store + client normalization to use shared types.
* [x] Deprecation note in backend route about removed local schema.

### Backend – Chat Route Decomposition

* [ ] Create `services/chatService.ts` (or `modules/chat/` folder) for: assemble reply, manage echo vs model path, build response DTO.
* [ ] Create `repositories/chatRepository.ts` for Neo4j turn/session persistence (wrap queries, expose `saveTurns(...)`).
* [ ] Create `stores/sessionStore.ts` with interface + in-memory impl (bounded) and placeholder persistent impl stub.
* [ ] Slim `routes/chatRoute.ts` to validation + orchestration only.
* [ ] Add unit tests for service (echo mode, normal mode w/ mocked dependencies) and repository (using neo4j test double).
* [ ] WebSocket broadcast logic extracted to helper (e.g. `broadcastChatResponse.ts`).

### Backend – Database Manager Split

* [ ] Split `database/manager.ts` into `database/neo4j.ts`, `database/vector.ts`, `database/redis.ts`, plus aggregator.
* [ ] Provide minimal interfaces for each (e.g., `Neo4jConnection`, `VectorIndex`).
* [ ] Adjust imports across codebase.
* [ ] Add tests for new modules (mock driver / simple contract tests).

### Frontend – Component & State Refactors

* [ ] Create `components/chat/MessageList.tsx`.
* [ ] Create `components/chat/AffectionMeter.tsx`.
* [ ] Create `components/chat/ChatInput.tsx`.
* [ ] Update `ChatPanel` to compose new pieces + remove inline scroll logic (delegate to MessageList hook).
* [ ] Introduce shared UI primitives folder (e.g., `ui/Button`, `ui/Panel`, `ui/Progress` if duplication exists) and migrate.
* [ ] Replace inline `detectIntent` with import from `@rpg/context-modifier` (optimize bundle via subpath export or tree-shake comment).
* [ ] Add tests per new subcomponent & an integration snapshot for ChatPanel.

### Duplication / Dead Code Cleanup

* [ ] Inventory committed `dist/` directories; decide removal vs keep (document in README if kept).
* [ ] Remove unused generated `.d.ts` duplicates if superseded by build output.
* [ ] Search for unused exports & prune (CI script using `ts-prune` or similar—optional).
* [ ] Consolidate logger usage; ensure no stray `console.*` calls outside logger.

### Environment & Configuration

* [ ] Add `config/flags.ts` (backend + frontend) using Zod to parse once.
* [ ] Add README section “Configuration & Flags” pointing to central doc.
* [ ] Add validation error fail-fast at backend startup.
* [ ] Add test ensuring unknown flags don’t break startup (mock env).

### Persistence Preparation (Stretch)

* [ ] Define `Session` & `Turn` Neo4j schema doc (docs/architecture/sessions.md).
* [ ] Implement repository read method `getRecentTurns(sessionId, limit)`.
* [ ] Add route `GET /api/chat/session/:id` returning consolidated session state (behind `ENABLE_CHAT_API`).
* [ ] Add optional flag `PERSIST_CHAT_TURNS` gating persistence section in service.

### Tooling & Quality

* [ ] Add root ESLint config with per-package overrides; ensure consistent TS rules.
* [ ] Add markdown lint (remark / markdownlint) script + CI hook.
* [ ] Add duplicate code detection (optional script) & surface top duplicates in PR template.
* [ ] Enforce typecheck + test + lint in pre-push (husky) or CI workflow.

### Testing Enhancements

* [ ] Service layer unit tests (mock repository + session store).
* [ ] Repository tests (Neo4j driver mock or test container).
* [ ] Session store tests (bounding & persistence flag toggle).
* [ ] Frontend component tests for new subcomponents.
* [ ] Contract test: backend response validated against shared `chatResponseSchema` at test time.
* [ ] Add type-level tests (e.g., `expectType` or `tsd`) to ensure exported types align with schemas.

## Acceptance Checklist

* [ ] All chat-related types consumed through `@rpg/types` (no local duplicates left).
* [ ] `chat.ts` reduced to <120 LOC or replaced by smaller route file + service modules.
* [ ] Frontend ChatPanel size reduced by >40% LOC with subcomponents individually tested.
* [ ] No committed unused `dist/` directories OR justification documented.
* [ ] Central flag module present; ad-hoc `process.env.FLAG` occurrences removed (except in flag module).
* [ ] Test coverage for new services/repositories ≥80% (excluding integration-heavy external calls).
* [ ] Lint + typecheck + tests green in CI.
* [ ] Docs updated: README + new `sessions.md` (if stretch accepted).

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Aggressive refactor introduces regressions | Broken chat loop | Maintain incremental commits w/ tests, keep route contract tests running each step |
| Shared types introduce circular deps | Build failures | Keep `@rpg/types` free of runtime imports from other packages |
| Bundle size increase from context-modifier | Slower frontend loads | Expose a lean subpath export (only intent detector) |
| Removing dist artifacts breaks consumers | Downstream type resolution issues | Confirm no external consumption before pruning, tag release |

## Rollback Plan

If issues arise during refactor: retain original `chat.ts` and `chatStore` in a `legacy/` folder temporarily while new modules stabilize; switch route registration back to legacy version via feature flag `USE_LEGACY_CHAT_ROUTE=true` (optional if needed).

## Sequencing (Suggested Order)

1. Introduce shared schemas in `@rpg/types` + contract tests.
2. Extract session store & split chat route (echo mode path first).
3. Migrate frontend ChatPanel subcomponents + intent detector replacement.
4. Database manager split.
5. Environment flag consolidation + docs.
6. Dead code / dist audit & cleanup.
7. Persistence stretch tasks.
8. Final polish & acceptance verification.

---
Prepared for implementation following completion of Sprint 1.
