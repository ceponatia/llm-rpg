# Story + Memory Integration (RPG Consolidated Workspace)

This document captures how the former standalone Story frontend and the Memory (CAS) backend+admin dashboard are unified inside the `rpg/` monorepo under the new `@rpg/*` namespace.

## Goals

- Provide a single development workspace for backend (Fastify), admin dashboard, and end-user story frontend.
- Support dual deployment modes: independent dev servers vs. optional static embedding.
- Cleanly migrate all internal packages from `@cas/*` to `@rpg/*` without leaving stale references.

## Package Mapping

| Legacy (memory repo) | New Location | New Package Name |
|----------------------|--------------|------------------|
| packages/backend      | rpg/packages/backend | `@rpg/backend` |
| packages/frontend (admin) | rpg/packages/admin-dashboard | `@rpg/admin-dashboard` |
| packages/mca          | rpg/packages/mca | `@rpg/mca` |
| packages/types        | rpg/packages/types | `@rpg/types` |
| packages/utils        | rpg/packages/utils | `@rpg/utils` |
| packages/affect       | rpg/packages/affect | `@rpg/affect` |
| packages/context-modifier | rpg/packages/context-modifier | `@rpg/context-modifier` |
| (story repo root)     | rpg/packages/frontend | `@rpg/frontend` |

## Namespace Migration Summary

- All `@cas/*` names replaced with `@rpg/*` in package.json files and imports.
- `tsconfig.base.json` updated with only `@rpg/*` path aliases.
- No dual alias kept (intentional simplification). Historical references exist only in documentation.

## Environment Variables

See `.env.example` for merged variables. Key flags:

- `SERVE_ADMIN_STATIC` – serve embedded admin dashboard build.
- `SERVE_FRONTEND_STATIC` – (planned) serve embedded story frontend build under `/app/*`.
- `VITE_MEMORY_API` – frontend base HTTP API origin.
- `VITE_ADMIN_DASHBOARD_ORIGIN` – admin iframe origin (when not embedded).

## Deployment Modes

| Mode | Description | Flags |
|------|-------------|-------|
| Dev (multi-process) | Run backend + admin + frontend separately with HMR | none (default) |
| Embedded Admin | Copy admin dist to backend public & serve `/admin/*` | `SERVE_ADMIN_STATIC=true` |
| Embedded Admin + Frontend (planned) | Also copy frontend dist to `/app/*` | `SERVE_ADMIN_STATIC=true` + `SERVE_FRONTEND_STATIC=true` |

Planned script to add: `build:frontend:embed`.

## WebSocket & Events

- Unified endpoint: `ws://<backend-origin>/ws/updates` consumed by the story frontend.
- Narrative events POST: `/api/events/narrative`.

## Next Steps

1. Implement frontend embed script + static serve toggle.
2. Harmonize dependency versions (React, TypeScript, tooling) across packages.
3. Update README with consolidated startup instructions.

## Validation Checklist (Completed)

- [x] No imports of `@cas/` under `rpg/` source directories.
- [x] All packages build with `pnpm build:all`.
- [x] Type check passes with `pnpm typecheck`.

## Historical Notes

The rename avoids confusion with the original memory prototype repository. No external published packages relied on the old namespace—allowing a clean break.
