# Configuration and flags

This document describes how runtime configuration and feature flags are handled across the consolidated repository.

## Backend configuration

Core required settings (ports, database credentials, model defaults, prompt tuning parameters) are resolved in `packages/backend/src/config.ts`. Two `.env` files are loaded (base `.env` then optional `.env.local` override) at module import time.

## Backend flags

Boolean / tuning feature flags are parsed centrally in `packages/backend/src/config/flags.ts` using Zod. All values are optional; unknown environment variables are ignored. Normalized exported object:

* `CHAT_ECHO_MODE` – Forces chat service to bypass MCA + LLM and echo user input (for latency / integration testing).
* `ENABLE_CHAT_API` – Gate for enabling chat routes (future use; currently assumed true default).
* `SERVE_ADMIN_STATIC` – If true, `staticAdmin` will attempt to serve built admin dashboard assets.
* `ADMIN_PUBLIC` – If true, admin HTML routes do not require an `x-admin-key` header (assets always public for caching).
* `NEO4J_OPTIONAL` – If true, startup will not fail when Neo4j is unavailable (operations that require it will degrade accordingly).
* `NEO4J_MAX_RETRIES` – Retry attempts for initial Neo4j connection (default 5).
* `NEO4J_RETRY_DELAY_MS` – Delay between Neo4j connection retries (default 1000).

Secrets (e.g. `ADMIN_API_KEY`) and non-boolean path-like values (e.g. `ADMIN_STATIC_DIR`, `ADMIN_BASE_PATH`) remain direct `process.env` reads to avoid accidentally logging sensitive values through normalization.

## Frontend flags

Frontend feature flags live in `packages/frontend/src/utils/flags.ts`. A small helper reads from both `import.meta.env` (Vite-provided) and `process.env` (for tests). Current active flag:

* `FRONTEND_CHAT_ENABLED` – Show/hide chat panel components.

Add new frontend flags by defining a `VITE_` prefixed variable and adding an entry to the exported `FLAGS` object using the `bool` helper.

## Usage guidelines

1. Import from `config/flags.ts` for backend boolean/tuning decisions instead of reading `process.env` directly.
1. Keep secrets and file system paths outside the centralized flags object to prevent accidental serialization.
1. For strongly typed required settings (ports, model names), continue to extend `config.ts` rather than the flags module.
1. Tests that need to modify flags can mutate `process.env` before first import of `config/flags.ts`, or (if already imported) can stub consumers directly.

## Adding a new flag (backend)

1. Add schema property in `flags.ts` (transform to appropriate type; provide sensible default in exported `FLAGS`).
1. Replace any `process.env.MY_FLAG` usage with `FLAGS.MY_FLAG`.
1. Document the flag here with purpose and default.
1. (Optional) Add a health / diagnostics endpoint field if external observability is desired.

## Future enhancements

* Emit a startup log summarizing active non-default flag values.
* Provide a `/flags` admin route guarded by `x-admin-key` to inspect runtime flag state.
* Add validation for mutually exclusive combinations (e.g. echo mode vs. persistence) when such constraints arise.
