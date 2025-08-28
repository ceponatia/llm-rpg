# CI Pipeline

> Living document describing our Continuous Integration setup: goals, workflows, required checks, and how to evolve it safely.

## Objectives

- Fast feedback (lint, type, minimal build) under a few minutes.
- High signal, low noise (ignore generated artifacts; focus on real source).
- Enforce quality gates (lint, coverage, Codacy static analysis) before merging to `main`.
- Keep configuration DRY across monorepo packages.
- Support incremental tightening (e.g., rule → warn → error progression).

## Current Workflows (GitHub Actions)

| Workflow | Typical Jobs / Steps | Required Check? | Notes |
|----------|----------------------|-----------------|-------|
| Quality | Setup env (composite), ESLint (no fix) with cache, Prettier format check | (Plan: Yes) | Single combined job replacing separate Lint + Format. Local pre-commit still auto-fixes. |
| Coverage & Codacy Upload | Setup env, run tests, aggregate coverage, upload to Codacy | Yes | Provides coverage diff & fuels Codacy quality metrics. Add artifact upload on failures (planned). |
| Codacy Static Code Analysis | External (Codacy platform) | Yes | Reflects ESLint + other engines; respects `.codacy.yaml`. |
| Security Scan (Weekly) | Trivy filesystem scan (HIGH/CRITICAL) | No | Informational; scheduled, not gating merges currently. |

(If you add new required checks, update this table.)

## Key Configuration Files

| File | Purpose |
|------|---------|
| `.codacy.yaml` | Central ignore patterns (coverage, dist, build, .vite, generated types). Also tool-specific excludes for `eslint-9` & duplication. |
| `eslint.config.mjs` | ESLint 9 flat config for the monorepo (replaces legacy `.eslintrc.*`). |
| `pnpm-workspace.yaml` | Declares workspace packages for shared install & caching. |
| `tsconfig.base.json` | Base TS compiler options feeding package tsconfigs. |

## Branch Protections

- `main` requires passing: Lint, Coverage & Codacy Upload, Codacy Static Code Analysis.
- (Optional) Signed commits & review approvals can be toggled; if enabled, document here.
- Direct pushes to `main` are blocked; use feature branches + PRs.

### Fast Path for Simple Config Changes

1. Create branch `chore/<topic>`.
2. Make config edit (e.g., adjust ignore glob).  
3. Run local validation (see Local Run Book below).
4. Open PR; ensure checks green; squash merge.

## Linting (ESLint 9 Flat)

- Single root flat config; no `.eslintignore` (globs centralized in config + `.codacy.yaml`).
- Uses `@typescript-eslint` recommended + strict layers, React hooks where relevant, Prettier compatibility.
- Generated / distribution assets are excluded to prevent false positives.
- If you introduce a new generated directory (e.g., `codegen/`), add an ignore entry in BOTH `eslint.config.mjs` (if needed) and `.codacy.yaml`.
- CI runs `pnpm lint:check --cache` (no auto-fix). Local pre-commit hook runs `pnpm lint` (with --fix) + `pnpm format` before commit.

### Adding / Adjusting Rules

1. Start permissive: add rule in `warn` mode.
2. Fix violations incrementally.
3. Promote to `error` once clean.
4. Note the change in this document (Rule Changes log section below).

## Coverage & Reporting

- LCOV combined under `coverage/combined.lcov` (aggregated script `scripts/aggregate-coverage.cjs`).
- Upload step feeds Codacy for diff & overall coverage metrics.
- To exclude files from coverage only, configure your test tooling (e.g. vitest / jest) and ensure excluded files don't appear in produced LCOV.

## Codacy Integration

- `.codacy.yaml` overrides UI ignore list (UI ignored files are ignored once config file exists).
- Engine names: ESLint 9 = `eslint-9` (Codacy still supports `eslint-8` for legacy).
- After adding new ignore patterns, expect one analysis cycle before baseline noise drops.
- Keep ignore patterns narrowly scoped—avoid blanket `**/*.js` style globs that hide real issues.

### When to Edit `.codacy.yaml`

| Scenario | Action |
|----------|--------|
| New build output directory appears in PR issues | Add precise glob (e.g., `packages/foo/out/**`). |
| New generated type artifacts | Add a specific pattern (`**/*.gen.ts`). |
| False positive duplication in coverage HTML | Already excluded; verify path and refine if needed. |

## Adding a New CI Job

1. Decide if it blocks merges (start as non-required unless critical).
2. Create workflow YAML under `.github/workflows/` with descriptive name.
3. Reuse existing install/cache steps (pnpm store, node version matrix if desired).
4. Keep runtime minimal; separate slow integration tests into a nightly or optional workflow.
5. Update this document’s table & Required Checks section.

## Local Run Book

| Task | Command (from repo root) |
|------|--------------------------|
| Typecheck | `pnpm exec tsc -p tsconfig.base.json --noEmit` |
| Lint (auto-fix) | `pnpm lint` |
| Lint (check only) | `pnpm lint:check` |
| Format (auto-write) | `pnpm format` |
| Format (check) | `pnpm format:check` |
| Exports pruning check | `pnpm run lint:exports` |
| Coverage (example) | `pnpm run test -- --coverage` then aggregate script if defined |
| Codacy config validate | `codacy-analysis-cli validate-configuration --directory $(pwd)` (optional) |

> Adjust commands if scripts evolve; keep this table synced.

## Common Failures & Remedies

| Symptom | Cause | Fix |
|---------|-------|-----|
| Thousands of `no-undef` in coverage HTML | Coverage report JS not ignored | Ensure `coverage/**` in `.codacy.yaml` & ESLint ignores; re-run. |
| Lint job slow | Cold pnpm cache or scanning build outputs | Confirm ignores; leverage `--cache` if not already. |
| Coverage job fails | Test failures or missing reporter | Re-run locally with `--coverage`; ensure reporter config. |
| PR merge blocked (review requirement) | Branch protection setting | Adjust in repo settings or obtain approval. |
| Codacy still using ESLint 8 | Delay or config mismatch | Confirm `eslint-9` enabled in Codacy UI; trigger re-analysis. |

## Rule Changes Log (append entries)

| Date | Change | Rationale |
|------|--------|-----------|
| 2025-08-27 | Introduced `.codacy.yaml` global ignores | Reduce generated artifact noise & prep ESLint 9 signal. |

## Maintenance Guidelines

- Review this doc quarterly or after any significant CI change.
- Keep sections concise; link to external detailed design docs if complexity grows.
- Prefer additive edits over large rewrites; clarity > completeness.

## Future Enhancements (Backlog)

- Parallel test matrix (Node LTS versions) if runtime grows.
- Caching of built TypeScript artifacts to speed lint/type steps.
- Add security scanning (e.g., `trivy` step) as required gate after eval period.
- Nightly deep integration tests separate from PR pipeline.

---
Last updated: 2025-08-27
