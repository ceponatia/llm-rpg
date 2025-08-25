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
  } catch (e) { fastify.log.warn('Static admin failed: ' + (e as Error).message); }
}
```

---

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

## Docker / Deployment Example

1. Build multi-stage image:
   * Stage 1: Install deps & build admin + backend.
   * Stage 2: Copy only `packages/backend/dist` (which now includes `admin/`).
2. Set env: `SERVE_ADMIN_STATIC=true ADMIN_PUBLIC=false ADMIN_BASE_PATH=/admin/`.
3. Provide `ADMIN_API_KEY` secret.

Pseudo Dockerfile snippet (illustrative only):

```Dockerfile
# build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile \
 && EMBED_ADMIN=true ADMIN_BUILD_BASE=/admin/ pnpm build:admin \
 && pnpm build:backend \
 && node scripts/embed-copy-admin.cjs

# runtime
FROM node:22-alpine
WORKDIR /app
COPY packages/backend/dist ./packages/backend/dist
ENV NODE_ENV=production SERVE_ADMIN_STATIC=true ADMIN_PUBLIC=false ADMIN_BASE_PATH=/admin/
CMD ["node", "packages/backend/dist/index.js"]
```

---

## Security Considerations

* If admin requires authentication, gate HTML (index) while allowing hashed static assets for caching.
* Avoid embedding secrets in the frontend build (no direct inclusion of API keys). Use runtime configuration endpoints if needed.
* Ensure `X-Admin-Key` or token-based auth protects sensitive API endpoints beyond static asset gating.

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

1. [x] Align naming (`admin-dashboard`) – Updated backend static path to `../../admin-dashboard/dist`; retained documentation of legacy path for awareness.
2. [ ] Add env var handling (`ADMIN_STATIC_DIR`, `ADMIN_BASE_PATH`) – Introduce variables, document defaults, and update backend static serve block to resolve candidates in priority order.
3. [ ] Refactor backend static serve code – Replace current inline block with resilient function: path resolution, existence checks, logging structure, error fallback (no crash if assets missing).
4. [ ] Add Vite base toggle (`EMBED_ADMIN`) – Modify `packages/admin-dashboard/vite.config.ts` to switch `base` dynamically and disable sourcemaps unless opted in.
5. [ ] Introduce build scripts + copy script (Option B) – Root scripts: `build:admin`, `build:backend`, `build:embed`, plus `scripts/embed-copy-admin.cjs` copying dist into backend.
6. [ ] Add compression + cache headers – Register `@fastify/compress`; set long cache for hashed assets, `no-cache` for HTML, verify via response headers.
7. [ ] Add security gating logic for HTML – Enforce `X-Admin-Key` (or future auth) when `ADMIN_PUBLIC!='true'`; allow static asset passthrough; add tests for 401 behavior.
8. [ ] Write embed-copy script – Implement file copy (clean + recreate) with robust error handling & log output; support relative path overrides.
9. [ ] Document Docker example (doc section present) – Finalize Dockerfile snippet reflecting chosen Option B and updated scripts; ensure env vars enumerated in README/ops docs.
10. [ ] Add tests (optional but recommended) – Add integration test asserting static HTML + asset served; negative test when assets missing; header gating test.

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
```

---

## Open Questions

* Do we need runtime theming/injected config? If yes, add a `/admin/config.json` endpoint generated at startup.
* Should sourcemaps be shipped to production error monitoring? (Default no.)
* Will admin ever need a different base path per deployment (multi-tenant)? If yes, adjust build to use relative asset paths (`base: './'`) and rely on reverse proxy path prefix rewriting.

---

## Summary

Completing static embedding requires: correcting the target build directory, introducing build & copy scripts, making the base path + root directory configurable, adding caching/compression & optional security gating, and updating the admin build to honor an embed mode. This doc provides the blueprint and code sketches to implement it safely and reproducibly.
