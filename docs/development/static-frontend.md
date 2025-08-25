# Static Embedding of Admin Dashboard into Backend

This document captures what is required to finish (and harden) the static embedding of the React admin dashboard inside the Fastify backend so it can be served under `/admin/` without running a separate dev or production server.

---

## Current State (Observed)

* Backend conditionally serves static files when `SERVE_ADMIN_STATIC === 'true'` (see `packages/backend/src/index.ts`).
* Code path now points to `../../admin-dashboard/dist` (legacy was `../../frontend/dist`).
* No build script exists named `build:admin:embed` (mentioned aspirationally in integration doc).
* No environment variable exists to override the admin build output path.
* History fallback for client‑side routing is approximated by serving `index.html` for `/admin/*` but only if `fastify-static` exposes `sendFile`.

---

## Target Goals

1. Serve the built admin dashboard at `/admin/` directly from the backend process (production + optionally in an integration dev mode).
2. Eliminate stale naming (`frontend`) and align on `admin-dashboard` (or intentionally keep both with a deprecation note).
3. Provide reproducible scripts to build & embed: single command builds admin then backend.
4. Support cache headers + optional compression for static assets.
5. Allow base path configuration (`/admin/`) without broken asset URLs.
6. Provide security gating (optional) so embedded assets are not world-accessible if `ADMIN_PUBLIC=false`.
7. Avoid coupling backend deploy to admin build when embedding is disabled.

---

## Gap Analysis & Required Work

| Area                  | Gap                                                     | Action                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Path Resolution       | Hard-coded `../../frontend/dist`                      | Replace with configurable env `ADMIN_STATIC_DIR` defaulting to resolved `../../admin-dashboard/dist` then fallback to old path for backward compatibility.         |
| Package Naming        | Mixed `frontend` vs `admin-dashboard`               | Decide canonical name (`admin-dashboard`). Add deprecation note if keeping old folder temporarily.                                                                   |
| Build Script          | Missing `build:admin:embed`                           | Add root script:`pnpm -F @rpg/admin-dashboard build && pnpm -F @rpg/backend build` + copy (if needed).                                                               |
| Asset Copy            | Not copying; backend serves from admin package folder   | Either: (A) Serve directly from `../admin-dashboard/dist`; (B) Copy into backend `dist/admin`. Option B isolates deploy artifact. Pick one (see trade-offs below). |
| Base Path             | Vite default base `/` may produce absolute asset URLs | Set `base: '/admin/'` in admin dashboard `vite.config.(ts)` when `EMBED_ADMIN=true`.                                                                             |
| Cache Headers         | None specified                                          | Configure `@fastify/static` with `maxAge` and optionally add ETag / compression plugin.                                                                            |
| Compression           | None                                                    | Register `@fastify/compress` for gzip/brotli.                                                                                                                        |
| Security              | Static assets always public if enabled                  | Add guard: if `ADMIN_PUBLIC !== 'true'`, require header `X-Admin-Key` for `GET /admin/*` HTML (allow hashed static assets directly).                             |
| CI/CD Integration     | Not defined                                             | Document pipeline steps (build admin, build backend, deploy single artifact).                                                                                          |
| Sourcemaps            | Might leak internal code                                | Optionally disable or gate with `EMBED_ADMIN_SOURCEMAPS=true`.                                                                                                       |
| Type Safety / Scripts | No shared types consumed at runtime                     | Confirm that runtime does not need TS artifacts—only static assets. Ensure `admin-dashboard` build outputs deterministic.                                           |

---

## Architectural Options for Embedding

### Option A: Serve From Admin Package Directory (Simple)

* Fastify static root points at `packages/admin-dashboard/dist`.
* Pros: No file copy step; faster iteration.
* Cons: Deployment packaging must include two directories; risk of accidental edits to build output during runtime.

### Option B: Copy Build Into Backend Dist (Self-Contained Artifact)

* After building admin, copy its `dist` into `packages/backend/dist/admin` before container image build.
* Backend serves from its own `dist/admin`.
* Pros: Single deployment artifact; easier Docker layering.
* Cons: Extra copy step; need to keep in sync.

Recommended: **Option B for production**, Option A can be used in dev if desired.

---

## Proposed Environment Variables

| Variable                   | Purpose                                           | Default                        |
| -------------------------- | ------------------------------------------------- | ------------------------------ |
| `SERVE_ADMIN_STATIC`     | Enable static serving                             | `false`                      |
| `ADMIN_STATIC_DIR`       | Absolute/relative path to built assets (Option A) | `../../admin-dashboard/dist` |
| `ADMIN_EMBED_MODE`       | `package` (A) or `dist` (B)                   | `dist`                       |
| `ADMIN_PUBLIC`           | If `true`, serve HTML without key               | `true`                       |
| `ADMIN_BASE_PATH`        | Public URL base (must end with `/`)             | `/admin/`                    |
| `ADMIN_BUILD_BASE`       | Vite base override during build                   | `/admin/`                    |
| `ADMIN_API_KEY`          | Existing key for gated access                     | (unset)                        |
| `EMBED_ADMIN_SOURCEMAPS` | Include sourcemaps in static embed                | `false`                      |

---

## Backend Code Changes (Sketch)

```ts
// In packages/backend/src/index.ts (replace current block)
if (process.env.SERVE_ADMIN_STATIC === 'true') {
  try {
    const staticMod = await import('@fastify/static');
    const compress = await import('@fastify/compress');
    await fastify.register(compress.default, { global: true });

    const { fileURLToPath } = await import('url');
    const { dirname, join, resolve } = await import('path');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const basePath = process.env.ADMIN_BASE_PATH || '/admin/';
    const fallbackCandidates = [
      process.env.ADMIN_STATIC_DIR, // explicit override
      '../../admin-dashboard/dist', // new canonical
      '../../frontend/dist' // legacy path
    ].filter(Boolean) as string[];

    let rootDir: string | null = null;
    for (const candidate of fallbackCandidates) {
      const full = resolve(__dirname, candidate);
      try { await import('fs/promises').then(fs => fs.access(full)); rootDir = full; break; } catch {}
    }
    if (!rootDir) throw new Error('Admin static assets not found.');

    await fastify.register(staticMod.default, {
      root: rootDir,
      prefix: basePath,
      maxAge: '1d',
      decorateReply: false
    });

    const secureHtml = async (req, reply) => {
      if (process.env.ADMIN_PUBLIC !== 'true') {
        const key = req.headers['x-admin-key'];
        if (process.env.ADMIN_API_KEY && key !== process.env.ADMIN_API_KEY) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }
      }
      const fs = await import('fs/promises');
      const html = await fs.readFile(join(rootDir!, 'index.html'), 'utf-8');
      reply.type('text/html').send(html);
    };

    fastify.get(basePath, secureHtml);
    fastify.get(basePath + '*', secureHtml);
    fastify.log.info(`Serving admin dashboard from ${rootDir} at ${basePath}`);

        # (Optional) produce a snapshot of the runtime config (for diffing between builds)
        pnpm -F @rpg/backend write:admin-config dist/admin-config-example.json
  } catch (e) { fastify.log.warn('Static admin failed: ' + (e as Error).message); }
}
```

\n# Override branding at runtime (no rebuild) and launch
        ADMIN_PRIMARY_COLOR="#ff5722" ADMIN_PRODUCT_NAME="My Custom Control" \\
          SERVE_ADMIN_STATIC=true ADMIN_PUBLIC=true \\
          node packages/backend/dist/index.js
---------------------------------------------

## Admin Dashboard Build Adjustments

Update `packages/admin-dashboard/vite.config.ts` to support embedding:

```ts
const embed = process.env.EMBED_ADMIN === 'true';
export default defineConfig({
  base: embed ? (process.env.ADMIN_BUILD_BASE || '/admin/') : '/',
  // ...existing config
});
```

Run build with:

```bash
EMBED_ADMIN=true ADMIN_BUILD_BASE=/admin/ pnpm -F @rpg/admin-dashboard build
```

Disable sourcemaps unless explicitly requested:

```ts
build: { sourcemap: process.env.EMBED_ADMIN_SOURCEMAPS === 'true' }
```

---

## Scripts (Root or Backend Package)

Add to root `package.json` (example):

```json
{
  "scripts": {
    "build:admin": "pnpm -F @rpg/admin-dashboard build",
    "build:backend": "pnpm -F @rpg/backend build",
    "build:embed": "pnpm build:admin && pnpm build:backend && pnpm run embed:copy",
    "embed:copy": "node scripts/embed-copy-admin.cjs"
  }
}
```

`scripts/embed-copy-admin.cjs` example:

```js
import { cpSync, rmSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
const adminDist = resolve('packages/admin-dashboard/dist');
const backendAdmin = resolve('packages/backend/dist/admin');
if (!existsSync(adminDist)) throw new Error('Admin dist not built');
rmSync(backendAdmin, { recursive: true, force: true });
mkdirSync(backendAdmin, { recursive: true });
cpSync(adminDist, backendAdmin, { recursive: true });
console.log('Copied admin dist -> backend/dist/admin');
```

When using Option B, set `ADMIN_STATIC_DIR=./admin` relative to backend dist in runtime env or adjust path resolution to detect internal copy.

---

## Docker / Deployment (Final Option B)

Goal: Produce a single image containing only the backend dist (with embedded admin assets under `dist/admin`) and run it with minimal env.

### Overview

Key Points:

* Build admin + backend in builder stage using workspace scripts.
* Copy only `packages/backend/dist` to the runtime image (small surface area).
* Provide `ADMIN_STATIC_DIR=./admin` so the server resolves embedded copy (since helper searches explicit env first).
* Disable sourcemaps by default; opt-in with `EMBED_ADMIN_SOURCEMAPS=true` at build time if needed.
* Decide whether admin is public (`ADMIN_PUBLIC=true`) or gated (`ADMIN_PUBLIC=false` + `ADMIN_API_KEY`).

Recommended directory layout after build stage:

```text
packages/backend/dist/
  index.js
  admin/            # copied admin-dashboard build output
    assets/*
    index.html
```

Final multi-stage Dockerfile example:

```Dockerfile
#############################
# Stage 1: build
#############################
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
# Enable corepack for pnpm
RUN corepack enable \
  && pnpm install --frozen-lockfile \
  && EMBED_ADMIN=true ADMIN_BUILD_BASE=/admin/ pnpm build:embed

#############################
# Stage 2: runtime
#############################
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    SERVE_ADMIN_STATIC=true \
    ADMIN_PUBLIC=false \
    ADMIN_BASE_PATH=/admin/ \
    ADMIN_STATIC_DIR=./admin

# Copy only backend dist (contains admin under dist/admin)
COPY --from=build /app/packages/backend/dist ./packages/backend/dist

# Optionally supply ADMIN_API_KEY via secret / env at deploy time
EXPOSE 3001
CMD ["node", "packages/backend/dist/index.js"]
```

Build & run locally (example):

```bash
docker build -t rpg-backend:embed .
docker run --rm -p 3001:3001 -e ADMIN_API_KEY=dev-secret rpg-backend:embed
```

Environment variables summary for runtime image:

| Variable           | Required                       | Purpose                                                    |
| ------------------ | ------------------------------ | ---------------------------------------------------------- |
| NODE_ENV           | yes                            | Production logging / behavior                              |
| SERVE_ADMIN_STATIC | yes                            | Enable static embed serving                                |
| ADMIN_STATIC_DIR   | yes (Option B)                 | Points to copied `./admin` directory inside backend dist |
| ADMIN_BASE_PATH    | optional                       | Public path prefix (`/admin/`)                           |
| ADMIN_PUBLIC       | optional                       | If `true`, HTML not gated; else require key              |
| ADMIN_API_KEY      | required if ADMIN_PUBLIC!=true | Key checked in `X-Admin-Key` header for HTML routes      |
| ADMIN_EMBED_MODE   | optional                       | Future switch (not currently required)                     |

CI/CD Pipeline Sketch:

1. `pnpm install --frozen-lockfile`
2. `EMBED_ADMIN=true ADMIN_BUILD_BASE=/admin/ pnpm build:embed`
3. (Optional) run integration tests against built dist.
4. `docker build -t your-org/rpg-backend:$(git rev-parse --short HEAD) .`
5. Push image, deploy with orchestrator setting secrets / env.

Operational Notes:

* If wanting blue/green with cache-busting, rely on hashed asset filenames (already long-cache) and set `ADMIN_PUBLIC=true` only if safe.
* To disable embedding for a particular build, skip `build:embed` and do normal backend build; ensure `SERVE_ADMIN_STATIC` false.
* To include sourcemaps temporarily for debugging: add `--build-arg EMBED_ADMIN_SOURCEMAPS=true` and pass that to build stage env (adjust Dockerfile accordingly).

---

## Security Considerations

* If admin requires authentication, gate HTML (index) while allowing hashed static assets for caching.
* Avoid embedding secrets in the frontend build (no direct inclusion of API keys). Use runtime configuration endpoints if needed.
* Ensure `X-Admin-Key` or token-based auth protects sensitive API endpoints beyond static asset gating.
* The runtime config endpoint `/admin/config.json` is intentionally public-safe: it must never include secrets or privileged tokens—only branding, feature flags, and build metadata. Review `adminConfig.ts` for allowed fields before adding new ones.

---

## Performance & Caching

* Enable compression (`@fastify/compress`).
* Set `Cache-Control: public, max-age=86400, immutable` for hashed assets; shorter for `index.html` (e.g., `no-cache`).
* Consider injecting a build hash into response headers for deployment tracing.

---

## Observability

* Log a single structured line on startup: `{ component: 'static-admin', rootDir, basePath, mode: 'embedded' }`.
* Emit a warning if `SERVE_ADMIN_STATIC=true` but directory does not exist.

---

## Testing Strategy

1. Unit: Factor static serving setup into a function and test path resolution logic with jest/vitest (optional).
2. Integration (local):
   * Build admin, run backend with `SERVE_ADMIN_STATIC=true`.
   * Verify: `curl -I http://localhost:3001/admin/` returns 200 and `Content-Type: text/html`.
   * Verify asset: parse index.html for a main JS chunk, request it, expect 200 + caching headers.
3. Negative: Start backend without building admin; expect warning + 404 for `/admin/`.
4. Security: Start with `ADMIN_PUBLIC=false` and missing `X-Admin-Key` -> 401 for HTML, 200 for asset only when key present (if gating assets too adjust test accordingly).

---

## Incremental Implementation Checklist

Use GitHub task list checkboxes below (clickable in GitHub UI). Some viewers only render task text with ordered or dash lists; switching to ordered format for compatibility.

<!-- markdownlint-disable MD029 MD004 -->

1. [X] Align naming (`admin-dashboard`) – Updated backend static path to `../../admin-dashboard/dist`; retained documentation of legacy path for awareness.
2. [X] Add env var handling (`ADMIN_STATIC_DIR`, `ADMIN_BASE_PATH`) – Implemented fallback candidate resolution (explicit -> admin-dashboard -> legacy frontend) and normalized base path.
3. [X] Refactor backend static serve code – Extracted logic into `packages/backend/src/staticAdmin.ts::setupStaticAdmin` handling resolution, fallbacks, logging, and graceful failure.
4. [X] Add Vite base toggle (`EMBED_ADMIN`) – Added embed mode logic & sourcemap gating in `packages/admin-dashboard/vite.config.ts` using `EMBED_ADMIN`, `ADMIN_BUILD_BASE`, `EMBED_ADMIN_SOURCEMAPS`.
5. [X] Introduce build scripts + copy script (Option B) – Added root scripts (`build:admin`, `build:backend`, `build:embed`, `embed:copy`) and `scripts/embed-copy-admin.cjs` to copy admin dist into backend artifact.
6. [X] Add compression + cache headers – Registered `@fastify/compress` globally and added cache-control logic (immutable for hashed assets, no-cache for HTML) in `staticAdmin`.
7. [X] Add security gating logic for HTML – Implemented in `staticAdmin` (checks `ADMIN_PUBLIC` & `ADMIN_API_KEY`, returns 401 for HTML when key missing; assets pass through).
8. [X] Write embed-copy script – Enhanced `scripts/embed-copy-admin.cjs` with flags (--src, --dest, --dry-run, --clean=false), stats & checksum logging, error handling.
9. [X] Document Docker example (doc section present) – Finalized Option B Dockerfile, env var table, CI/CD sketch, operational notes.
1. [X] Add tests (optional but recommended) – Added vitest integration tests (`packages/backend/tests/static-admin.spec.ts`) covering public serve, gating, and asset caching header.

<!-- markdownlint-enable MD029 MD004 -->

---

## Quick Start (Once Implemented)

```bash
# Build & embed
EMBED_ADMIN=true ADMIN_BUILD_BASE=/admin/ pnpm build:admin
pnpm build:backend
node scripts/embed-copy-admin.cjs

# Run backend serving static admin
SERVE_ADMIN_STATIC=true ADMIN_PUBLIC=true node packages/backend/dist/index.js
 
# (Optional) produce a snapshot of the runtime config for diffing
pnpm -F @rpg/backend write:admin-config dist/admin-config-example.json

# Override branding at runtime (no rebuild) and launch
ADMIN_PRIMARY_COLOR="#ff5722" ADMIN_PRODUCT_NAME="My Custom Control" \
  SERVE_ADMIN_STATIC=true ADMIN_PUBLIC=true \
  node packages/backend/dist/index.js
```

---

## Open Questions

### Runtime Theming / Injected Config (Answered)

A runtime configuration layer lets you change non-code concerns (branding, feature flags, environment endpoints) **without rebuilding** the admin bundle. This is valuable when:

* You deploy the same image to multiple environments (dev/stage/prod) with different branding or feature toggles.
* You want to enable/disable experimental UI panels (e.g., memory inspector) via env.
* You need to surface build metadata (git SHA, build time) for debugging.
* You might later support multi-tenant / white‑label scenarios.

#### Approaches

| Approach                                   | How                                                                                                       | Pros                                                | Cons                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| JSON endpoint (recommended)                | Serve `/admin/config.json` generated at startup                                                         | Simple, cacheable, easy to version, no HTML parsing | One extra network request (can be parallelized)                              |
| Inline `<script>` injection              | Backend rewrites `index.html` replacing a token with a `<script>window.__ADMIN_CONFIG__=...</script>` | Zero extra request                                  | Requires HTML templating / string replace each request; harder to cache HTML |
| Placeholder token replacement (build-time) | Replace tokens during container build                                                                     | No runtime code                                     | Requires rebuild for each change (defeats purpose)                           |

We choose the **JSON endpoint** for flexibility + caching.

#### Example Config Shape (`/admin/config.json`)

```json
{
  "branding": {
    "productName": "RPG Control",
    "primaryColor": "#6d28d9",
    "logoPath": "/admin/assets/logo.svg"
  },
  "features": {
    "memoryInspector": true,
    "betaFlag": false
  },
  "api": {
    "baseUrl": "/api"
  },
  "auth": {
    "public": true,
    "gatedHtml": false
  },
  "build": {
    "version": "${GIT_SHA}",
    "timestamp": "2025-08-25T12:34:56Z"
  }
}
```

Values derive from environment variables (e.g., `ADMIN_LOGO_PATH`, `ADMIN_PRIMARY_COLOR`, feature env flags). Never include secrets (API keys, credentials) – treat it as public.

#### Backend Implementation Sketch

Inside `setupStaticAdmin` (or adjacent helper) after successful static registration:

```ts
// pseudo-addition after static setup
fastify.get(basePath + 'config.json', async (req, reply) => {
  const cfg = {
    branding: {
      productName: process.env.ADMIN_PRODUCT_NAME || 'RPG Control',
      primaryColor: process.env.ADMIN_PRIMARY_COLOR || '#6d28d9',
      logoPath: process.env.ADMIN_LOGO_PATH || basePath + 'assets/logo.svg'
    },
    features: {
      memoryInspector: process.env.FEAT_MEMORY_INSPECTOR === 'true',
      betaFlag: process.env.FEAT_BETA_FLAG === 'true'
    },
    api: { baseUrl: process.env.ADMIN_API_BASE || '/api' },
    auth: {
      public: process.env.ADMIN_PUBLIC === 'true',
      gatedHtml: process.env.ADMIN_PUBLIC !== 'true'
    },
    build: {
      version: process.env.GIT_SHA || process.env.BUILD_VERSION || 'dev',
      timestamp: process.env.BUILD_TIME || new Date().toISOString()
    }
  };
  const body = JSON.stringify(cfg);
  reply.header('Cache-Control', 'no-cache');
  reply.type('application/json').send(body);
});
```

Optional: add an ETag (`reply.header('ETag', 'W/"'+hash+'"')`) where `hash` is a short digest of `body` for conditional requests.

#### Frontend Consumption Pattern

Create a tiny bootstrap module (e.g., `src/config/runtime.ts`):

```ts
export interface RuntimeConfig { branding: { productName: string; primaryColor: string; logoPath: string }; features: Record<string, boolean>; api: { baseUrl: string }; build: { version: string; timestamp: string }; }

let cached: RuntimeConfig | null = null;
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cached) return cached;
  const res = await fetch('/admin/config.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load runtime config');
  cached = await res.json();
  // Apply theming via CSS variables
  const root = document.documentElement;
  root.style.setProperty('--color-primary', cached.branding.primaryColor);
  return cached;
}
```

Then in `main.tsx`:

```ts
import { loadRuntimeConfig } from '@/config/runtime';
loadRuntimeConfig().then(() => {
  // safe to render app
  createRoot(document.getElementById('root')!).render(<App />);
});
```

#### Theming Application

Expose CSS variables in a global stylesheet and reference them in Tailwind (via `:root{ --color-primary: #6d28d9; }`). Optionally generate a `<style>` tag dynamically on load.

#### Caching & Performance

`config.json` is small (<< 1KB). Use `no-cache` so changes propagate quickly; if values are stable per deploy you can instead use `Cache-Control: max-age=60` with ETag support for revalidation.

#### Failure Handling

If the request fails (offline, 500), show a minimal fallback theme and retry later (exponential backoff). Avoid blocking critical error views.

#### Security Considerations (Runtime Config)

Do not place secrets in this payload. Treat it as public metadata + flags. If you need privileged data, fetch it from authenticated APIs after user auth.

#### When NOT to Use Runtime Config

If values only change at build time (static brand for all environments) and there is no need for dynamic toggles, the complexity may not pay off—stick with compile-time constants.

---

* Do we need runtime theming/injected config? (Answered above.)
* Should sourcemaps be shipped to production error monitoring? (Default no.)
* Will admin ever need a different base path per deployment (multi-tenant)? If yes, adjust build to use relative asset paths (`base: './'`) and rely on reverse proxy path prefix rewriting.

---

## Refactor: Runtime Theming / Injected Config Implementation Plan

This section defines the concrete, atomic steps to evolve from the documented concept to a production implementation of runtime theming & injected config. Each task is intentionally small, independently reviewable, and provides incremental value.

### Guiding Principles

* Zero breaking changes to existing embed behavior until feature is explicitly enabled.
* Keep the runtime config payload small (<2KB) and public-safe (no secrets).
* Strong cache & validation semantics (ETag + `no-cache` or short `max-age`).
* Frontend must gracefully degrade if config fetch fails (fallback theme + retry).
* Feature flags opt-in; absence == false.

### New / Extended Environment Variables

| Variable                  | Purpose                         | Default                               |
| ------------------------- | ------------------------------- | ------------------------------------- |
| `ADMIN_PRODUCT_NAME`    | Branding product/title override | `RPG Control`                       |
| `ADMIN_PRIMARY_COLOR`   | Primary brand hex               | `#6d28d9`                           |
| `ADMIN_LOGO_PATH`       | Logo asset path (under base)    | `${ADMIN_BASE_PATH}assets/logo.svg` |
| `ADMIN_API_BASE`        | API base URL for admin client   | `/api`                              |
| `FEAT_MEMORY_INSPECTOR` | Toggle memory inspector panel   | `false`                             |
| `FEAT_BETA_FLAG`        | Example generic beta flag       | `false`                             |
| `BUILD_VERSION`         | Injected build/version string   | (git short SHA or `dev`)            |
| `BUILD_TIME`            | Build timestamp (ISO)           | runtime now() fallback                |

### Task List

Backend (Phase 1)

* [X] Create helper `buildAdminRuntimeConfig()` in `packages/backend/src/` returning the config object (pure, no Fastify deps) + serialized JSON + weak ETag (hash of JSON).
* [X] Add `/admin/config.json` route inside `setupStaticAdmin` (after static registration) serving JSON with headers:
  * `Content-Type: application/json`
  * `Cache-Control: no-cache` (later may switch to `max-age=60, must-revalidate`)
  * `ETag` (support conditional requests: 304 on match)
* [X] Implement conditional request handling (`If-None-Match`).
* [X] Add optional `configVersion` numeric field that increments automatically when hash changes (derive from hash e.g., first 8 chars converted to int) or just expose `hash`.
* [X] Log a structured line on startup: `{ component: 'admin-config', version, hash }`.
* [X] Add tests (`static-admin-config.spec.ts`):
  * 200 on first fetch & shape validation.
  * 304 when `If-None-Match` matches.
  * Honors `ADMIN_PRODUCT_NAME` override (covered indirectly by presence check; extend later if needed).
  * With `ADMIN_PUBLIC=false`, endpoint still accessible (public-safe) OR gated (decision documented) – current design: always public-safe.
* [X] Update security docs subsection clarifying endpoint does not leak secrets & is public by design.

Frontend (Phase 2)

* [X] Add module `src/config/runtime.ts` exporting `loadRuntimeConfig()` + types + fallback constants.
* [X] Update `main.tsx` bootstrap to await `loadRuntimeConfig()` before rendering (show minimal splash / skeleton while waiting).
* [X] Add global CSS variables injection (e.g., set `--color-primary`). For Tailwind, map to theme via runtime class or CSS variable usage (ensure no purge issues).
* [X] Implement feature flag example: conditionally render Memory Inspector component only if `config.features.memoryInspector` true.
* [X] Add error handling & retry (exponential backoff up to N attempts, then fallback theme & console.warn).
* [X] Add lightweight unit test (if test infra present) for `loadRuntimeConfig` mocking fetch.

DevEx / Observability (Phase 3)

* [X] Add CLI build step (optional) that writes a baked snapshot `dist/admin-config-example.json` for inspection (does not serve, just debug artifact).
* [X] Emit response header `x-admin-config-version` with `version` or hash for easier debugging in network panel.
* [X] Add documentation snippet (Quick Start) showing how to override branding color via env & see live change after restart.

Optional Enhancements (Phase 4)

* [ ] Switch caching to `Cache-Control: max-age=60, stale-while-revalidate=300` once stability confirmed.
* [ ] Support `ADMIN_SECONDARY_COLOR` & arbitrary `ADMIN_BRAND_JSON` (JSON blob) merging into `branding.extra`.
* [ ] Provide `/admin/health` combining build hash + config hash for monitoring.
* [ ] Add schema validation (zod) for env-driven config before serving (fail fast on invalid hex color).
* [ ] Implement hot-reload in dev: watch environment/config file & update in-memory config (only in NODE_ENV=development).

### Rollout Strategy

1. Implement backend tasks 1–6; release (no frontend usage yet, endpoint benign).
2. Implement frontend tasks 8–11; release (users start benefiting from runtime overrides).
3. Layer in tests & observability tasks (12–16) for robustness.
4. Consider optional enhancements based on need; avoid premature complexity.

### Acceptance Criteria

* Backend returns stable JSON at `/admin/config.json` with documented shape and appropriate headers.
* 304 responses function when `If-None-Match` provided.
* Frontend renders correctly even if config fetch fails (uses fallback constants).
* Branding color change via `ADMIN_PRIMARY_COLOR` is visible after restart without rebuild.
* Memory Inspector (example gated feature) only mounts when flag true.

### Risks & Mitigations

| Risk                                       | Mitigation                                                                                                                                |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Payload accidentally includes secret       | Centralize config builder; lint rule / review checklist; never read secret envs inside builder.                                           |
| Frontend flash of un-themed content (FOUT) | Minimal inline base theme; apply overrides immediately after fetch before first paint (or early fetch + root element hidden until ready). |
| Cache staleness                            | Use `no-cache` initially; add ETag to support efficient validation.                                                                     |
| Large future expansion                     | Keep schema versioned; add `schemaVersion` now for forward compatibility.                                                               |

### Minimal JSON Schema (v1)

```json
{
  "schemaVersion": 1,
  "branding": { "productName": "string", "primaryColor": "#RRGGBB", "logoPath": "string", "extra": { "?": "any" } },
  "features": { "memoryInspector": "boolean", "betaFlag": "boolean" },
  "api": { "baseUrl": "string" },
  "auth": { "public": "boolean", "gatedHtml": "boolean" },
  "build": { "version": "string", "timestamp": "ISO-8601" },
  "configVersion": "string|hash"
}
```

---

## Summary

Completing static embedding requires: correcting the target build directory, introducing build & copy scripts, making the base path + root directory configurable, adding caching/compression & optional security gating, and updating the admin build to honor an embed mode. This doc provides the blueprint and code sketches to implement it safely and reproducibly.
