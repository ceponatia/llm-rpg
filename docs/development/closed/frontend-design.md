# (Closed) Frontend refactor plan

Status: Closed on 2025-08-26 after successful migration and subsequent structural cleanup (sections -> panels, schema consolidation). This archived document now contains the final merged plan (original active version fully inlined below) plus a closure summary. Future incremental work (chat route, WS resilience, UI primitives) is tracked in their own design docs.

---

## Closure Summary (2025-08-26)

Completed outcomes:

* Legacy `story` UI merged into `@rpg/frontend`.
* Feature flag `FRONTEND_CHAT_ENABLED` added (default off) guarding unimplemented chat API.
* WebSocket basic integration working (no reconnect/backoff yet).
* Domain schemas consolidated into `@rpg/types` (panel schemas).
* `sections/` directory renamed & removed; components live under `components/panels/`.
* Minimal test suite (stores + conditional render + WS) green.
* Design doc lifecycle pattern established (active -> closed with summary).

Deferred / follow-up (tracked separately):

* Implement `/api/chat/message` backend route & enable chat flag.
* WS reconnect/backoff & event schema validation.
* Error boundary + toast/notification system.
* Vector search integration & related flags.
* Auth real implementation (replace mock session store).
* UI primitives / design tokens extraction.

Rollback note: No single rollback needed; individual changes can be reverted via git history per package.

---

<!-- BEGIN ORIGINAL PLAN CONTENT -->

## Frontend refactor plan (original)

Concise migration plan to replace the minimal `@rpg/frontend` with the richer legacy `story` UI while keeping the current backend unchanged. Future enhancements are captured separately from the core migration path.

## Sources to Harmonize

| Source                    | Role                      | Notes                                                                                                |
| ------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `rpg/packages/frontend` | Target package            | Minimal scaffold; replace implementation contents.                                                   |
| `story/src`             | Canonical current UX      | Auth flows, dashboard panels (Library, Admin), WebSocket store, UI stores.                           |
| `story-engine`          | Advanced design reference | Monorepo structuring, naming conventions, component architecture, vector search & message flow docs. |

## Goals (MVP scope)

* Replace placeholder UI with legacy `story` implementation.
* Use existing backend routes only (no backend changes for initial merge).
* Keep auth mocked (session store only) until a real auth service lands.
* Establish clean state/services structure ready for progressive hardening.

## Core migration flow (single track)

1. Copy legacy UI: move `dev-front/{components,domain,pages,sections,services,state,utils}` into `packages/frontend/src/`.
2. Remove obsolete placeholder files (old dashboard/pages/components that duplicate new ones).
3. Create `packages/frontend/src/state/index.ts` exporting all stores.
4. (Optional first pass) Rename `sections/` to `components/panels/` or defer rename to a follow-up to minimize initial churn.
5. Update imports if path depth changed; prefer relative paths within package.
6. Add `src/utils/flags.ts` with a simple `isEnabled(flag)` function (backed by `import.meta.env`).
7. Add feature flag constant `FRONTEND_CHAT_ENABLED` (default false) for the unused `sendChat` API.
8. Enhance `sendChat` error handling: if 404/501, throw `new Error('Chat API not enabled')`.
9. Add env keys to `.env.example`: `VITE_MEMORY_API`, `VITE_ADMIN_DASHBOARD_ORIGIN`, `VITE_FRONTEND_CHAT_ENABLED`.
10. Run typecheck & fix: `pnpm --filter @rpg/frontend typecheck` (or `tsc --noEmit`).
11. Run dev build to validate runtime: `pnpm --filter @rpg/frontend dev` and confirm WS connects & summary endpoint works.
12. Add minimal tests (Vitest) covering: session store auth toggle, ws store connect/disconnect stub (mock WebSocket), UI renders Landing vs Dashboard.
13. Delete `dev-front/` directory after successful validation.
14. Commit with message: `feat(frontend): migrate legacy story UI (phase 1)`.

Everything outside this list is treated as post-migration enhancement.

## Target folder structure

```text
packages/frontend/src/
	components/
		auth/
		primitives/        # (future) low-level reusable pieces
		panels/            # Dashboard-specific composite units
	pages/
	sections/            # (rename to panels/ or integrate into components/panels)
	state/
		index.ts
		sessionStore.ts
		wsStore.ts
		uiStore.ts
	services/
		api/
			memoryClient.ts
		ws/
			eventStream.ts
	utils/
	hooks/               # (future) cross-cutting hooks (useFeatureFlag, useEventStream)
	styles.css
	main.tsx
	env.d.ts
```

## Namespace & import guidelines

* Prefer local relative imports inside the package (avoid deep alias chains).
* Use `@rpg/types` or future shared packages instead of duplicating schemas (planned follow-up; initial migration can keep local `domain/schemas.ts`).
* Do not reintroduce legacy external repo path styles.

## Styling

* Keep current Tailwind config; no theming extraction in MVP.
* Utility-first; delay design token extraction until shared admin/frontend refactor.

## WebSocket notes

* Single connection managed by `useWSStore`.
* Reconnect/backoff + Zod event validation are deferred tasks.

## Error handling (defer)

* Standard request wrapper & error boundaries are post-migration tasks.

## Feature flags

Initial: `FRONTEND_CHAT_ENABLED` (false). Future: `FRONTEND_VECTOR_SEARCH`, `SHOW_DEBUG_PANELS`, `ENABLE_WS_RECONNECT_TRACE`.

## Accessibility (baseline)

* Auth modal already uses focus trapping via Radix Dialog.
* Add landmark roles & audit color contrast later.

## Performance (later)

* Defer lazy loading + memoization improvements until after stable merge.

## Out-of-scope (post-migration backlog)

* Service abstraction interfaces (`IMemoryApiClient`, `IEventStream`).
* Backoff reconnect + schema validation on WS.
* Layout primitives & design tokens.
* Error boundaries & toast/notification system.
* Vector search + advanced feature flags.
* Real auth integration.

## Definition of done (MVP)

* Legacy functionality (library panels, admin embed, WS event stream, auth mock) works against current backend.
* No broken imports or leftover placeholder components.
* `sendChat` gracefully errors (flag off) without breaking UI.
* Basic tests (stores + conditional Dashboard render) pass.
* `dev-front/` removed.
* This document reflects final MVP state.

## Open questions (tracked but not blocking)

* Auth backend timeline?
* Shared UI primitives packaging (`@rpg/ui`)?
* Domain schemas consolidation into `@rpg/types`?

## Quick start checklist (execute in order)

1. Copy code (step 1 of core flow).
2. Create barrel + flags util.
3. Adjust imports & env example.
4. Typecheck & run dev.
5. Add minimal tests.
6. Delete `dev-front/`.
7. Commit & push.

---

Prepared for initial refactor kickoff.

## Migration (dev-front -> @rpg/frontend)

This section captures the concrete delta between the temporary `dev-front/` copy of the legacy `story` UI and the current backend capabilities in this monorepo, plus the precise steps to converge without altering backend routes.

### 1. Current backend capability snapshot

Backend exposes (confirmed via grep):

* POST `/api/events/narrative` (routes/events.ts)
* GET `/api/memory/summary` (routes/public.ts)
* WebSocket `/ws/updates` supporting messages: `subscribe_to_memory_operations`, `subscribe_to_emotional_changes` (routes/websocket.ts)

Not exposed (missing endpoint):

* POST `/api/chat/message` (frontend `memoryClient.sendChat` expects this)

### 2. dev-front expectation matrix

| Front module                                 | Endpoint / Feature                            | Backend support?                        | Action                                                               |
| -------------------------------------------- | --------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| `services/memoryClient.sendChat`           | POST `/api/chat/message`                    | No                                      | Implement backend route OR stub on frontend (decision below).        |
| `services/memoryClient.getMemorySummary`   | GET `/api/memory/summary`                   | Yes                                     | No change.                                                           |
| `services/memoryClient.postNarrativeEvent` | POST `/api/events/narrative`                | Yes                                     | No change.                                                           |
| `state/wsStore`                            | WS `/ws/updates` + two subscribe messages   | Yes                                     | No change (optionally add reconnect/backoff).                        |
| `state/repositories`                       | Fire narrative event on upsert (non-blocking) | Yes                                     | OK (silent failure acceptable).                                      |
| `sessionStore`                             | Mock auth only (in‑memory)                   | N/A                                     | Accept for now; mark for future real auth integration.               |
| `AdminPanel` / `AdminFrame`              | Uses `VITE_ADMIN_DASHBOARD_ORIGIN` iframe   | Admin dashboard already runs separately | Ensure env var / default port matches actual admin dev port (5175+). |

### 3. Recommended approach (keep backend stable)

To avoid backend modifications initially, adapt the new frontend so missing chat functionality is either:

1. Feature-flagged off until backend route exists, or
2. Pointed at an existing semantic equivalent if one appears later.

Given current usage in `dev-front`, the chat endpoint isn't yet wired into visible UI components (no chat panel present). Therefore safest: retain `sendChat` but gate any future usage behind a `FRONTEND_CHAT_ENABLED` flag.

### 4. Minimal frontend adjustments (merged into core flow)

See "Core migration flow" steps 3–9.

### 5. Optional backend enhancement (if chat needed soon)

If enabling chat rapidly is desired, implement a slim route:

* POST `/api/chat/message` accepting `{ message, sessionId? }` returning `{ sessionId, reply, traces? }`.
* Interim implementation can echo or use existing memory logic / placeholder LLM stub.
* This is isolated and won't interfere with existing routes.

### 6. File & path migration steps (reference)

Consolidated into core steps 1–5 & 13.

### 7. Risk & mitigation

| Risk                                                      | Impact                | Mitigation                                                                                             |
| --------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| Missing chat route triggers runtime 404 if UI later added | User-facing error     | Feature flag + clearer error mapping.                                                                  |
| iframe admin origin mismatch                              | Broken embedded admin | Ensure env default matches actual admin dev port (check `packages/admin-dashboard` dev server port). |
| WebSocket silent failure (network)                        | No live events        | Add minimal retry/backoff later (Phase 3).                                                             |
| Zod version mismatch                                      | Validation errors     | Confirm single Zod version in workspace (pnpm hoist) before merge.                                     |

### 8. Validation checklist (post-merge)

* [X] Frontend builds without TS errors.
* [X] `/api/memory/summary` returns data and UI remains stable if unreachable.
* [X] WebSocket connects and receives subscribed events.
* [X] Admin iframe loads dashboard.
* [X] No imports from `dev-front` remain.

### 9. Follow-up tasks

* Service abstraction layer.
* Reconnect/backoff + schema validation.
* Layout primitives & design tokens.
* Auth integration.
* Vector search feature flag & implementation.

---

Migration analysis added (see above) – update as soon as actual move begins.

<!-- END ORIGINAL PLAN CONTENT -->
