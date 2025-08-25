# Integrating `story` (Frontend) with `memory` (Cognitive Backend & Admin)

This document describes how to restructure the repositories so that:

1. The `story` project becomes the **primary user-facing application** (story creation UX, narrative tools, etc.) while consuming cognitive/memory services from `memory`.
2. The existing `memory` React frontend (`memory/packages/frontend`) is **embedded as the Admin + Ops Dashboard** (observability, tuning, inspector) instead of being a separate end-user UI.
3. A clean contract is established between the Story UI and the Memory backend.

---

## High-Level Architecture (Target State)

```text
/projects
  ├─ memory/                  # Backend (Fastify API + MCA + data infra) + Admin Dashboard UI (moved/embedded)
  │   ├─ packages/backend      # Fastify API (stays)
  │   ├─ packages/mca          # Memory Controller Agent
  │   ├─ packages/frontend     # (Renamed → packages/admin-dashboard) React admin tool
  │   └─ ...
  ├─ story/                   # End‑user product UI (primary SPA)
  │   ├─ src/                  # Feature & domain oriented code
  │   └─ ...
  └─ docs/                    # (This file) Integration & architecture
```

Runtime topology:

```text
Browser (User) ──> Story SPA (Vite/React) ──> Memory Backend (Fastify API + WS)
                                          └─> Admin Dashboard (lazy/iframe/microfrontend) ──> same API / WS
```

---

## Step-by-Step Migration Plan

### 1. Rename Memory Frontend Package

Inside `memory/packages`:

* Rename folder `frontend` → `admin-dashboard` (purely organizational, optional in first iteration). OR keep folder but change visible app name.
* Update its `package.json` name from `@cas/frontend` to `@cas/admin-dashboard`.
* Update any workspace filters in scripts referencing `@cas/frontend` (e.g. `dev:frontend`, `typecheck`). Example:
  * In root `memory/package.json`:
    * Replace `dev:frontend`: `pnpm --filter @cas/frontend dev` → `pnpm --filter @cas/admin-dashboard dev`
    * Adjust `typecheck` list to include `packages/admin-dashboard`.

(If you want zero churn initially, skip rename and just treat it logically as the admin dashboard.)

### 2. Harden Backend for Cross-Origin Use

The backend currently enables CORS only for `http://localhost:5173` during development. When Story runs on a different dev port (e.g., 5174) or in production behind a domain, broaden CORS:

In `memory/packages/backend/src/index.ts`:

```ts
await fastify.register(cors, {
  origin: (origin, cb) => {
    const allowed = [
      'http://localhost:5173', // admin dashboard
      'http://localhost:5174', // story frontend (if different)
      process.env.STORY_ORIGIN, // production story domain
      process.env.ADMIN_ORIGIN  // production admin dashboard domain
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) cb(null, true); else cb(new Error('Origin not allowed'), false);
  },
  credentials: true
});
```

Add env vars in `memory/.env.example`:

```bash
STORY_ORIGIN=https://story.example.com
ADMIN_ORIGIN=https://admin.example.com
```

### 3. Define a Stable API Contract

Create a shared TypeScript types package (already `@cas/types`) and expose DTOs used by the Story app:

* Chat:
  * `POST /api/chat/message` → request: `{ sessionId?: string; message: string; meta?: Record<string,any> }` response: `{ sessionId: string; reply: string; traces?: MemoryTrace[] }`
* Memory inspection (if needed in Story limited view):
  * Consider a trimmed endpoint: `GET /api/memory/summary` that returns high-level stats only (counts, last interaction) so Story doesn’t overfetch deep internals.

Add new endpoint in backend (wrapper around existing services) to reduce coupling. Example route file: `routes/public.ts`.

### 4. Story Frontend Consumption Layer

In `story/src/services/` create a memory client module:

```ts
// memoryClient.ts
const API_BASE = import.meta.env.VITE_MEMORY_API || 'http://localhost:3001';

export async function sendChat(message: string, sessionId?: string) {
  const res = await fetch(`${API_BASE}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId })
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

export async function getMemorySummary() {
  const res = await fetch(`${API_BASE}/api/memory/summary`);
  if (!res.ok) throw new Error('Summary failed');
  return res.json();
}
```

Add `.env.development` in `story`:

```bash
VITE_MEMORY_API=http://localhost:3001
```

### 5. Embed Admin Dashboard in Story

Three integration patterns (choose one):

| Pattern | Pros | Cons |
|---------|------|------|
| Iframe (`<iframe src="/admin">`) | Fastest, isolation, no build coupling | Double bundle load, styling silo, auth duplication |
| Microfrontend (module federation / import remote) | Shared libs, unified routing | More setup (webpack module federation or Vite plugin) |
| Build-time merge (admin becomes a route in Story repo) | Single bundle, easiest auth | Requires moving code / losing separation |

Recommended incremental approach: start with iframe, evolve to module federation if needed.

#### Iframe Approach

1. Serve admin dashboard at its own dev server (port 5173).
2. In Story, create a route `/admin` that renders an iframe pointing to that origin.
3. Gate with feature flag / role check.

Example React route component:

```tsx
// AdminFrame.tsx
export function AdminFrame() {
  const src = import.meta.env.VITE_ADMIN_DASHBOARD_ORIGIN || 'http://localhost:5173';
  return (
    <div className="w-full h-full">
      <iframe src={src} className="w-full h-[calc(100vh-4rem)] border-0" title="Admin Dashboard" />
    </div>
  );
}
```

Add env variable in `story/.env.development.local`:

```bash
VITE_ADMIN_DASHBOARD_ORIGIN=http://localhost:5173
```

Later upgrade to shared build if tighter integration needed.

### 6. Authentication & Authorization (Future)

Short term: rely on simple in-memory elevation toggle for admin (already in Story). Long term:

* Central auth service (JWT / session) issuing tokens consumed by both Story and Admin Dashboard.
* Add `Authorization: Bearer <token>` in fetch calls; Fastify plugin validates.
* Role claims: `role=user|admin` gating admin routes and deep memory inspection endpoints.

### 7. WebSocket Integration

Memory backend emits WebSocket events. Story can optionally connect directly for live updates (chat streaming, memory events):

```ts
const WS_BASE = (API_BASE.replace(/^http/, 'ws'));
const ws = new WebSocket(`${WS_BASE}/ws`); // adjust to actual path
ws.onmessage = evt => { /* dispatch to store */ };
```

If security required, pass auth token via query or header (Fastify WS handler validates).

### 8. Telemetry & Observability

Define minimal events Story emits to backend for memory significance scoring (e.g., narrative edits, character creation). Create `POST /api/events/narrative` to record domain actions; backend decides if they enter memory layers.

### 9. Deployment Topology

Option A (simple):

* Deploy `memory` backend (Fastify) + admin dashboard static build served by a CDN or its own Vite preview / nginx.
* Deploy `story` separately pointing to backend via env vars.

Option B (consolidated):

* During CI build, build admin dashboard bundle and place in `memory/packages/backend/dist/admin`.
* Fastify serves static assets under `/admin/*`.
* Story remains separate service.

Option C (single monolith):

* Merge Story build output into backend static folder as well, using distinct base paths `/app/*` and `/admin/*`.
  
Implementation: Admin dashboard static consolidation added. Set `SERVE_ADMIN_STATIC=true` in `.env` and run `pnpm build:admin:embed` inside `memory` to serve `/admin/` from backend.

### 10. Incremental Checklist

| Step | Action | Status |
|------|--------|--------|
| 1 | Add this integration doc | ✅ |
| 2 | CORS broaden & env vars | ✅ |
| 3 | Add `/api/memory/summary` endpoint | ✅ |
| 4 | Create `story` memory client | ✅ |
| 5 | Add `/admin` iframe route in Story | ✅ |
| 6 | Rename package (optional) | ✅ |
| 7 | Auth hardening | ✅ |
| 8 | WebSocket consumption in Story | ✅ |
| 9 | Domain event endpoint | ✅ |
| 10 | Deployment consolidation | ✅ |

---

## Suggested Backend Additions (Code Sketches)

`memory/packages/backend/src/routes/public.ts`:

```ts
import { FastifyInstance } from 'fastify';

export async function publicRoutes(f: FastifyInstance) {
  f.get('/api/memory/summary', async () => {
    const stats = await f.db.getHighLevelStats(); // implement thin method
    return stats; // { sessions, characters, facts, lastEventAt, ... }
  });
}
```
Add to `setupRoutes`:

```ts
await publicRoutes(fastify);
```

And implement `getHighLevelStats` in `DatabaseManager` (aggregate from Neo4j / memory controller as needed).

---

## Security Considerations

* Limit admin-only routes with a guard (even if naive first): wrap route registration in a simple token check (`X-Admin-Key`).
* Never expose raw emotional / vector data to general Story endpoints—only summarized stats unless authorized.
* Apply rate limiting plugin if public exposure expected (`@fastify/rate-limit`).

---

## Performance Notes

* Keep admin dashboard lazy-loaded (iframe / dynamic import) so initial Story load stays small.
* If moving to module federation, share React and Zustand to avoid duplicate bundles.
* Use a summary endpoint to prevent large payload fetches on first render.

---

## Future Enhancements

* Replace iframe with module federation once both repos align on build tooling (Vite + `@originjs/vite-plugin-federation`).
* Add GraphQL façade for richer querying without overfetching internal REST endpoints.
* Add event sourcing pipeline (Kafka / Redis streams) for narrative events to memory ingestion.

---

## Minimal Dev Workflow After Integration

Terminal 1 (memory backend + admin dashboard):

```bash
cd memory
pnpm dev
```

Terminal 2 (story frontend):

```bash
cd story
npm run dev
```

Visit: `http://localhost:5174` (Story) → navigate to Admin to see embedded dashboard at `http://localhost:5173`.

---

## Summary

* Use `story` as the user-facing narrative app.
* Re-scope `memory`'s existing frontend into an Admin/Ops dashboard.
* Establish a thinner, stable API contract and optional real-time channel.
* Grow toward tighter integration over time with incremental, low-risk steps.

This plan favors minimal disruption first, then progressive enhancement.
