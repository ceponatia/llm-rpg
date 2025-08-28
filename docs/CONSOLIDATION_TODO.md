RPG Consolidation Plan (Memory + Story)
=======================================

Goal: Create a new consolidated project `/rpg` that:

* Uses the existing `memory` repository codebase as the root backend + admin dashboard foundation.
* Integrates the `story` app as the primary end-user frontend under a new `packages/frontend` (renaming current admin dashboard to `packages/admin-dashboard`).
* Keeps original `/memory` and `/story` repos untouched (copy only) for easy rollback.
* Supports both: static-admin serving + separate dev servers for rapid iteration.

---

High-Level Target Structure
---------------------------

```text
rpg/
  package.json                # Derived from memory root (adjusted scripts)
  pnpm-workspace.yaml         # Includes packages/* (admin-dashboard, frontend, backend, etc.)
  tsconfig.base.json          # Adjusted path aliases (@rpg/*?) or reuse @cas/*
  .env.example                # Merged envs (memory + new frontend vars)
  packages/
    backend/                  # Copied from memory/packages/backend
    mca/                      # Copied
    types/                    # Copied
    utils/                    # Copied
    affect/                   # Copied (if present in memory)
    context-modifier/         # Copied
    admin-dashboard/          # Former memory/packages/frontend
    frontend/                 # New: copied from story (was standalone repo)
  docs/
    integration-story-memory.md  # Copied from /docs root for reference
    consolidation-notes.md
```

---

Atomic Migration TODO (Copy-Based)
----------------------------------

Each step should be reversible by deleting `/rpg` directory.

1. Prep Workspace

   * [x] Create `/rpg` folder (DONE)
   * [x] Copy root-level config files from `/memory` (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.env.example`, `docker-compose.yml`, etc.) into `/rpg`.
   * [ ] Remove dev-specific artifacts not needed initially (node_modules, dist, coverage) if accidentally copied.
1. Copy Memory Packages

   * [x] Recreate `rpg/packages` and copy each directory from `memory/packages/*`.
   * [x] Rename `memory/packages/frontend` to `rpg/packages/admin-dashboard` (if not already renamed in source). Ensure `package.json` inside has name `@cas/admin-dashboard`.
1. Copy Story Frontend

   * [x] Create `rpg/packages/frontend`.
   * [x] Copy all source from `/story` root into that package:
      * React sources → `rpg/packages/frontend/src`
      * `package.json` fields merged into monorepo (dependencies lifted where needed)
      * Tailwind / Vite / tsconfig files adjusted for package-local build.
   * [x] Set `name` in `rpg/packages/frontend/package.json` to `@rpg/frontend` (or continue with `@cas/story-frontend` for consistency) and mark `private: true`.

> Note: For steps 1–3 all source trees from memory packages and story `src` were fully copied (excluding `node_modules` and build artifacts) to establish a complete working baseline before refactors.

Adjust Workspace Manifests
--------------------------

* [x] Update `/rpg/pnpm-workspace.yaml` to include `packages/*`.
* [x] In `/rpg/package.json` scripts, add:
  * `dev:frontend`: `pnpm --filter @rpg/frontend dev`
  * `dev:admin`: `pnpm --filter @rpg/admin-dashboard dev`
  * `dev`: `concurrently "pnpm dev:backend" "pnpm dev:frontend" "pnpm dev:admin"`
  * `build:all`: `pnpm -r build`
* [x] Ensure `typecheck` script references new frontend path.

Path Aliases & TypeScript
-------------------------

* [x] Decide whether to keep `@cas/*` or introduce `@rpg/*` alias for new frontend. (Chose `@rpg/*`.)
* [x] Update `tsconfig.base.json` with a path entry for frontend:
  * "@rpg/frontend": `./packages/frontend/src`
  * "@rpg/frontend/*": `./packages/frontend/src/*`

* [x] If code in Story imported relative paths only, minimal changes required (no mass replacement needed yet).

Environment Variables
---------------------

* [x] Merge Story's `.env.development` values into `/rpg/.env.example` (`VITE_MEMORY_API`, `VITE_ADMIN_DASHBOARD_ORIGIN`).
* [x] Add `SERVE_ADMIN_STATIC`, `SERVE_FRONTEND_STATIC`, `STORY_ORIGIN`, `ADMIN_ORIGIN`, `ADMIN_API_KEY` from memory + new flag.

* [ ] Document any additional feature flags once embed scripts added.

Static Admin Consolidation (Optional Production Mode)
----------------------------------------------------

* [ ] Keep existing `SERVE_ADMIN_STATIC` toggle.
* [ ] For consolidated build: run `pnpm build:admin:embed` then (future) a similar script for `frontend` if you also want to serve it statically.

Add Frontend Build Embed Script (Optional)
-----------------------------------------

* [ ] Add script: `build:frontend:embed` copying `packages/frontend/dist` to `packages/backend/public/app`.
* [ ] Enhance backend static serving logic to also serve `/app/` if env `SERVE_FRONTEND_STATIC=true`.

Dependency Harmonization
------------------------

* [ ] Merge `dependencies` & `devDependencies` from Story into root or keep per-package with workspace hoisting.
* [ ] Remove duplicate versions; align React & TypeScript versions.
* [ ] Run `pnpm install` in `/rpg` and fix any peer warnings.

### Cross-Origin & CORS

* [ ] Keep broadened CORS logic; adjust allowed origins to include new frontend dev port if changed.

### WebSocket & API Client Updates

* [ ] Validate `VITE_MEMORY_API` resolves correctly in new workspace structure.
* [ ] Confirm WebSocket path `/ws/updates` reachable from new frontend dev environment.

### Narrative Events

* [ ] Ensure `postNarrativeEvent` still posts to `/api/events/narrative` (adjust base if hosting under shared domain when static serving).

### Testing & Verification

* [ ] Run `pnpm dev` (backend + admin + frontend) concurrently.
* [ ] Open Story frontend, verify chat, memory summary, and events panel update.
* [ ] Toggle admin view and confirm iframe (or static) admin dashboard loads.
* [ ] Post narrative events (e.g., create entity) and see them appear over WebSocket.

### Production Build Scenario

* [ ] Run `pnpm build:all`.
* [ ] Run `pnpm build:admin:embed` (and optional `build:frontend:embed`).
* [ ] Start backend only (`pnpm dev:backend` or node dist entry) with `SERVE_ADMIN_STATIC=true` (and optionally `SERVE_FRONTEND_STATIC=true`) to confirm both UIs served.

### Documentation

* [ ] Create `docs/consolidation-notes.md` summarizing deviations from original repos.
* [ ] Update root README to reflect new structure and startup commands.

### Cleanup & Rollback Plan

* [ ] If issues arise, delete `/rpg` folder – originals `/memory` and `/story` remain untouched.
* [ ] Iterate on scripts before deciding to deprecate originals.

---

Future Enhancements (Post-Consolidation)
----------------------------------------

* Add unified auth service before exposing publicly.
* Introduce module federation between admin & frontend if duplication becomes heavy.
* Add integration tests hitting both narrative events and memory retrieval in one flow.
* Add build pipeline (GitHub Actions) generating artifacts: backend image, static `admin/`, static `app/`.

---

Quick Commands (After Setup)
----------------------------

```bash
# Install
cd rpg
pnpm install

# Dev (3 services)
pnpm dev

# Consolidated build & embed admin
pnpm build:all && pnpm build:admin:embed

# (Optional) also embed frontend later
pnpm build:frontend:embed
```

---

Open Questions (Decisions & Elaborations)
-----------------------------------------

### 1. Namespace Rename (`@cas/*` -> `@rpg/*`)

**Decision: YES** – proceed with renaming to clearly differentiate the consolidated workspace from the original source repos.

Action outline (to add as tasks in later step):

* [x] Update `package.json` names for internal packages: `@cas/backend` → `@rpg/backend`, etc.
* [x] Adjust `tsconfig.base.json` path mappings to `@rpg/*`.
* [x] Global search & replace imports (`import ... from '@cas/...')` → `@rpg/...`.
* [x] Update any dynamic import / runtime references (e.g., MCA import in backend).
* [x] Regenerate type build / re-run `tsc -b` to surface missed references. (Remaining minor adjustments in events/websocket route to be handled separately)
* [x] Update docs (`integration-story-memory.md`, README) to reflect new namespace.
* [x] (Decision: Skip) Temporary alias compatibility – dual `@cas/*` + `@rpg/*` paths not added (all code migrated; no external dependents).
<!-- Removed optional dual-path snippet to avoid confusion -->

   ```jsonc
   "paths": {
   "@rpg/backend/*": ["./packages/backend/src/*"],
   "@cas/backend/*": ["./packages/backend/src/*"]
   }
   ```

### Namespace Rename Conclusion

Validation Summary:

* Searched code under `rpg/` for `@cas/` usages: only historical mentions in this TODO file remain (documentation context), no active imports or package names.
* All `package.json` names use `@rpg/*`.
* `tsconfig.base.json` paths exclusively reference `@rpg/*`.
* Backend and packages build/typecheck clean after migration (WebSocket & events adjustments resolved prior issues).
* No runtime dynamic import references to `@cas/*` remain.
* Dual-alias fallback intentionally skipped to reduce maintenance surface.

Outcome: Namespace migration COMPLETE. Future work should reference only `@rpg/*`. Any new docs should avoid `@cas/*` except when describing historical context.

Risks / mitigations:

* Tooling cache confusion → clear `.tsbuildinfo` and editor TS server.
* Published artifacts (if any in future) need version bump; currently all private so low risk.

### 2. Serving Main Frontend: Static vs Separate

Two deployment patterns for the user-facing app:

| Mode | Description | Pros | Cons | When to Prefer |
|------|-------------|------|------|----------------|
| Static Embedded | Build frontend (Vite) → copy dist into backend (e.g., `packages/backend/public/app`) & serve via Fastify (`/app/*`). Optional `SERVE_FRONTEND_STATIC=true`. | Single deploy artifact; Simpler infra; Local relative API calls; Easier version pinning (UI + API atomic); Can leverage HTTP/2 push / unified caching strategy | Larger backend image; Slower redeploy for UI-only changes; Harder to CDN-optimize aggressively (needs path tuning); Tighter coupling (rolling back UI requires full redeploy) | Small teams; Early staging environments; Simpler ops |
| Separate Origin (Dev / CDN) | Frontend hosted independently (Vercel/Netlify/S3+CDN); Talks to backend over CORS/WebSocket. | Independent scaling & rollback; Edge CDN caching & compression tuned; Faster UI deploy cycle; Can introduce SSR/ISR independently | Requires robust CORS & auth; Version skew risk (UI expecting API features not yet deployed); More complex local env (multiple processes) | Production scale; Heavy iteration on UI; Multi-region distribution |

Hybrid Approach (Recommended Path):

1. Keep separate dev servers (`pnpm dev:frontend`, `dev:backend`).
1. Provide optional static embed (admin already has) for compact demo deployments.
1. Add build script: `build:frontend:embed` → copies `packages/frontend/dist` to `packages/backend/public/app`.
1. Conditionally register Fastify static plugin when `SERVE_FRONTEND_STATIC=true`.

Additional considerations:

* CDN Optimization: If embedding, still allow reverse proxy (e.g., Nginx) to set long-cache headers for `/app/assets/*`.
* Source Maps: In static mode consider stripping or gating via `INCLUDE_SOURCE_MAPS=false`.
* WebSocket URL: In separate mode ensure `VITE_MEMORY_API` + WS fallback handles `wss://` in production.

#### Segregation & Independent Iteration Rationale

Because we expect rapid iteration on the user-facing frontend, supporting BOTH deployment modes yields practical advantages:

| Concern | Static Embedded Only | Separate Origin Available | Benefit of Dual Mode |
|---------|----------------------|---------------------------|----------------------|
| Frontend Release Velocity | Tied to backend release; slow | Independent, minutes | Use separate origin in prod for fast UI pushes |
| Backend Stability Risk | UI rebuild requires backend image rebuild | Orthogonal deployments | Buffer backend from frequent UI redeploys |
| Rollback Strategy | Must redeploy combined artifact | Simple CDN/app rollback | Faster incident recovery for UI-only issues |
| Canary / A/B | Hard (needs backend routing logic) | CDN / edge routing easy | Enables experimentation without backend noise |
| Cache Invalidation | Coupled with backend release cycle | CDN versioned assets | Reduce accidental cache bust of backend APIs |
| Security Surface | Single origin simplifies CORS | Requires managed CORS policy | Keep embed for constrained demos; manage CORS for prod scale |
| Local Dev Simplicity | Easiest (one process after embed) | Multi-process dev | Offer both: newcomer friendly embed vs full multi-process |

Recommended operational stance:

1. Development: Run separate processes (hot reload speed) – `pnpm dev:backend` + `pnpm dev:frontend`.
1. Demo / Sandboxed Environments: Use static embed for one-command startup (`SERVE_FRONTEND_STATIC=true`).
1. Staging / Production: Deploy backend (container/image) + frontend (CDN host). Keep admin dashboard optionally embedded or also externalized later.
1. Disaster Recovery: Keep ability to flip a feature flag to serve last-known-good embedded build if CDN path misconfigured.

Implementation task list (add later if desired):

* [ ] Add `SERVE_FRONTEND_STATIC` env + static serve block mirroring admin logic.
* [ ] Add script `build:frontend:embed` (copy dist → `packages/backend/public/app`).
* [ ] Add docs section: "Dual Deployment Modes" with run matrix.
* [ ] (Optional) Add health check endpoint returning current frontend build hash (embedded vs external) for observability.
* [ ] Expose build hash via `window.__RPG_BUILD__` for diagnostics.

Risk mitigation patterns:

* Cache-bust assets via content hashes (Vite already does) to avoid stale clients.
* Maintain a small semantic version file (`/app/version.json`) for monitoring mismatches UI ↔ API.
* Add pre-deploy contract tests (frontend expects certain API endpoints) executed in CI before promoting UI to production.

Summary: Dual-mode provides agility (separate origin) without sacrificing simplicity (embedded) where needed; choose per environment via simple build flag.

### 3. API Gateway / GraphQL Layer

Purpose: Provide a unified, versioned contract between frontends (user + admin) and backend capabilities, enabling evolution of internal services (memory layers, MCA, future auth) without tight coupling.

Options:

1. Pass-through Reverse Proxy (lightweight gateway):
   * Tools: Nginx, Traefik, or Fastify plugin setup.
   * Pros: Minimal overhead, preserves REST; easy route consolidation / rate limiting.
   * Cons: No schema introspection; still multiple round trips from frontend.
1. GraphQL API (single endpoint):
   * Tools: Yoga, Mercurius (Fastify), Apollo Server.
   * Pros: Strong typing; frontend selects fields (reduces over-fetch); natural fit for graph memory queries (Neo4j); easier aggregation (chat + memory summary in one request).
   * Cons: Added complexity; caching requires nuance; subscriptions layer for WebSocket events duplication (though can unify with GraphQL subscriptions).
1. BFF (Backend-For-Frontend) REST Layer:
   * A dedicated service (or module) that exposes coarse-grained endpoints (`GET /app/dashboard/summary`) aggregating internal calls.
   * Pros: Simpler than GraphQL; tailor responses per UI view; can cache per-user.
   * Cons: Potential endpoint explosion; less flexible than GraphQL.

Recommended Iterative Path:

1. Introduce BFF-style aggregation endpoints inside current Fastify backend (namespace: `/api/app/*`).
1. Evaluate hotspots where frontend chains multiple calls – consolidate.
1. If querying patterns diversify (e.g., dynamic memory visualizations, selective fields), layer GraphQL (Mercurius integrates easily with Fastify) while keeping existing REST for stability.
1. Expose WebSocket events either:
   * As native channel (`/ws/updates`) + GraphQL for queries, or
   * Migrate to GraphQL subscriptions once schema stable.

GraphQL Schema Sketch (illustrative):

```graphql
type MemorySummary { sessions: Int! characters: Int! facts: Int! lastEventAt: String }
type ChatTurn { id: ID! role: String! content: String! createdAt: String! }
type Query {
   memorySummary: MemorySummary!
   chatSession(id: ID!): [ChatTurn!]!
}
type Mutation {
   sendChat(message: String!, sessionId: ID): ChatTurn!
   postNarrativeEvent(type: String!, payload: JSON!, sessionId: ID): Boolean!
}
scalar JSON
```

Performance & Caching Notes:

* Gateway can centralize rate limiting & auth (token introspection, API keys).
* GraphQL request cost analysis (depth/complexity) can prevent abusive queries.
* Batching: GraphQL `@defer` / persisted queries or REST aggregated endpoints.

Security Implications:

* Gateway simplifies CORS (single origin exposure) and header normalization.
* Schema-driven validation reduces ad-hoc backend validators.

Decision Status:

* Short-term: Implement minimal BFF aggregated REST endpoints.
* Mid-term (trigger): When >3 UI views require multi-call orchestration OR memory graph queries need field-level shaping → introduce GraphQL.
