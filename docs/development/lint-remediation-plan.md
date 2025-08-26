# Incremental ESLint Remediation Plan

Purpose: Drive the error count to zero efficiently while minimizing merge conflicts and avoiding large risky refactors. Current snapshot (2025-08-26 latest run): 0 errors, 0 warnings (numbers will drift — always re-run `pnpm exec eslint . --ext .ts,.tsx` to refresh before each batch).

Guiding principles:

1. Stabilize config & parsing (done) before touching code.
2. Reduce error volume with safest, high‑leverage, mechanical edits first (imports, signatures, array type style) to shrink noise.
3. Then address rule clusters that require semantics (null checks, unsafe any usage).
4. Defer broad API surface changes (adding accessibility modifiers / removing `async`) until just before final pass to reduce rebase churn.
5. Track progress per category with checkboxes; commit in small, reviewable batches (≈50–150 changes) ensuring tests stay green.

## Command references

Run full check (fail on warnings too once near zero):

```bash
pnpm exec eslint . --ext .ts,.tsx --max-warnings=0
```

Target a single package during iteration:

```bash
pnpm exec eslint packages/backend --ext .ts,.tsx
```

Auto-fix safe issues first, then inspect residual:

```bash
pnpm exec eslint packages/mca --ext .ts,.tsx --fix
```

## Category ordering (rationale & actions)

| Order | Category / Rule Cluster                                                                                        | Rationale                                                               | Actions / Patterns                                                                           |
| ----- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 0     | Parsing / tsconfig include (DONE)                                                                              | Unblocks type-aware rules                                               | tsconfig.base.json includes set                                                              |
| 1     | Duplicate imports (`no-duplicate-imports`)                                                                   | Low risk, cleans noise early                                            | Merge imports; convert pure type imports to `import type` (paired with step 2)             |
| 2     | Consistent type imports (`@typescript-eslint/consistent-type-imports`)                                       | Mechanical; reduces diffs later                                         | Add `type` keyword where only types used                                                   |
| 3     | Array style (`@typescript-eslint/array-type`)                                                                | Fully mechanical; large count                                           | Replace `T[]` with `Array<T>` (batch auto-fix or codemod)                                |
| 4     | Trivial / inferrable types (`no-inferrable-types`)                                                           | Simplifies code, reduces lines touched for later edits                  | Remove explicit literals types                                                               |
| 5     | Unused vars & params (`no-unused-vars`)                                                                      | Removes dead code before semantic passes                                | Delete or underscore prefix `_` for unused params                                          |
| 6     | Remove unnecessary `async` / add missing return types (`require-await`, `explicit-function-return-type`) | Clarifies sync vs async; reduces false positives for later safety rules | Drop `async` where no await; add explicit return signatures                                |
| 7     | Accessibility modifiers (`explicit-member-accessibility`)                                                    | Large churn; do once after earlier pruning                              | Add `public`/`private`/`protected` intentionally; prefer minimal visibility            |
| 8     | Strict boolean expressions / prefer-nullish-coalescing                                                         | Requires reasoning; tackle after codebase is lean                       | Replace `if (x)` with explicit checks, use `??`, guard empty string separately           |
| 9     | Unsafe any / calls / member access (`no-unsafe-*`, `no-base-to-string`)                                    | Highest semantic load; needs domain knowledge                           | Introduce proper types / narrowings / custom type guards                                     |
| 10    | Extraneous classes (`no-extraneous-class`)                                                                   | Potential refactor; delay until after method modifiers                  | Convert static-only utility classes to namespaces or plain functions                         |
| 11    | Remaining stylistic (curly, unbound-method, console)                                                           | Final polish                                                            | Insert braces, convert unbound refs to arrow or bind, gate logging behind logger abstraction |

## Batch execution checklist

Each batch: (a) run targeted eslint with --fix, (b) manually adjust leftovers, (c) run tests for affected packages, (d) commit.

### Global tracking

- [X] Step 1 Duplicate imports cleaned
- [X] Step 2 Type-only imports converted
- [X] Step 3 Array style normalized
- [X] Step 4 Inferrable types removed
- [X] Step 5 Unused identifiers resolved
- [X] Step 6 Async/Return types aligned
- [X] Step 7 Accessibility modifiers added
- [X] Step 8 Boolean/nullish strictness complete (strict-boolean, prefer-nullish, and no-unnecessary-condition all cleared)
- [X] Step 9 Unsafe any/calls eliminated or justified with safe wrappers
- [ ] Step 10 Static utility class refactors
- [ ] Step 11 Final stylistic polish & warnings -> zero

## Package progress matrix

| Package          | 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   | 9   | 10  | 11  |
| ---------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| utils            | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a | [ ] | [ ] | [ ] | [ ] |
| types            | [x] | [x] | [x] | [x] | [x] | [ ] | n/a | [ ] | [ ] | n/a | [ ] |
| utils (pkg)      | [x] | [x] | [x] | [x] | [x] | [ ] | n/a | [ ] | [ ] | [ ] | [ ] |
| affect           | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a | [ ] | [ ] | [ ] | [ ] |
| context-modifier | [x] | [x] | [x] | [x] | [x] | [~] | [x] | [ ] | [ ] | [ ] | [ ] |
| mca              | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [x] | [ ] | [ ] | [ ] | [ ] |
| backend          | [x] | [ ] | [ ] | [ ] | [ ] | [~] | [x] | [~] | [ ] | [x] | [ ] |
| admin-dashboard  | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a | [ ] | [ ] | n/a | [ ] |
| frontend         | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a | [ ] | [ ] | n/a | [ ] |

Legend: Mark each step complete per package as batches land. "n/a" for steps not applicable (no static-only classes).

## Detailed playbooks

### Step 1 & 2: Imports

Scriptable approach (example codemod outline):

1. Run eslint fix.
2. For residual duplicates: consolidate manually.
3. Convert `import { TypeA, TypeB } from '...'` where only types to `import type { TypeA, TypeB } from '...'`.

### Step 3: Array style

Allow auto-fix (`--fix`). For manually resistant cases (e.g., nested arrays) ensure `Array<Array<number>>` formatting.

### Step 4: Inferrable types

Remove annotations like `const x: number = 3;` unless part of public exported API surface (leave exported function signatures & interfaces untouched for clarity).

### Step 5: Unused variables

Preferred order:

- Remove dead code.
- If required for interface/overload compatibility, rename param to `_param` to satisfy rule & document intentional disregard.

### Step 6: Async / return types

- Remove `async` keyword when no `await` present.
- Add explicit `: ReturnType` for exported functions; internal small arrow callbacks inside array methods may rely on inference (rule allows typed expressions) — ensure config alignment.

### Step 7: Accessibility modifiers

Patterns:

- Constructors: always `public` unless enforcing controlled instantiation via `private` / `protected`.
- Fields assigned once: mark `private readonly` (or `protected readonly` where subclassing expected).
- Methods not intended for external consumption: `private` or `protected`.
  Document any deliberate `public` util surfaces in JSDoc.

### Step 8: Strict boolean expressions / nullish

Checklist for each flagged conditional:

1. Determine value domain (string, number, object, possibly null/undefined).
2. Replace `if (maybeString)` with explicit `if (maybeString !== undefined && maybeString !== null && maybeString !== '')` or, simpler, apply invariant earlier and narrow.
3. Use sentinel variable: `const hasFoo = foo !== undefined && foo !== null; if (hasFoo) { ... }`.
4. Replace `a || default` with `a ?? default` unless empty string / 0 should trigger default; then write explicit check.

### Step 9: Unsafe any / member access

Strategies:

- Propagate proper generic types where `any` bleeds from external libs.
- Introduce minimal domain interfaces or `unknown` + type guards instead of asserting.
- Wrap third-party untyped calls in a dedicated adapter module exposing typed surface.
- For legacy unavoidable cases, isolate `// eslint-disable-next-line @typescript-eslint/no-unsafe-*` above a narrow line with justification comment (last resort; aim for <5 exceptions total).

### Step 10: Static utility classes

Example transformation (before):

```ts
export class Logger { static debug(...args: unknown[]) { /* ... */ } }
```

After:

```ts
export const logger = { debug: (...args: ReadonlyArray<unknown>): void => { /* ... */ } } as const;
```

Advantages: eliminates need for accessibility modifiers & `no-extraneous-class` issues.

### Step 11: Final stylistic polish

- Add braces to single-line `if` bodies.
- Replace non-null assertions by safe guards: `const el = doc.getElementById('x'); if (!el) return; // ...`
- Replace direct `console.*` with central logger or remove (except early bootstrap errors).
- Centralize logging: introduce `logger.ts` (levels: debug/info/warn/error). Only this file may call `console.*`; all other code imports logger. Gate `debug` (and optionally `info`) output behind dev flag (`import.meta.env.DEV || process.env.NODE_ENV !== 'production'`). Add ESLint override to disable `no-console` only for `**/logger.ts` so remaining `console.*` usages become violations automatically resolved in this step.
- Logger shape (example): `export const logger = { debug: (...a: unknown[]) => { if (DEV) console.debug('[debug]', ...a); }, info: (...a) => console.info('[info]', ...a), warn: (...a) => console.warn('[warn]', ...a), error: (...a) => console.error('[error]', ...a) };` Allow future swap to structured logger (pino/winston) with zero call site churn.
- Migration checklist for this step: (1) Add logger module, (2) ESLint override, (3) Replace scattered `console.*` calls, (4) Optionally add a `LOG_LEVEL` env gate, (5) Verify bundle tree-shakes dev-only branches in production build, (6) Remove lingering disable comments for `no-console`.

## Risk mitigation

- Run unit/integration tests after each batch (`pnpm -r test` if available per package) to catch behavioral regressions.
- Avoid mixing semantic changes (e.g., refactoring memory algorithms) with mechanical lint fixes in the same commit.
- When adding null checks, ensure code paths preserve previous truthiness semantics (write quick inline comments if logic changed).

## Suggested batch schedule

| Batch | Scope                                                  | Expected Reduction |
| ----- | ------------------------------------------------------ | ------------------ |
| 1     | utils + types (steps 1–5)                             | ~10%               |
| 2     | backend (imports, array style, remove inferrable)      | ~8%                |
| 3     | context-modifier (same as batch 2)                     | ~12%               |
| 4     | mca (imports + array style only)                       | ~15%               |
| 5     | Add access modifiers across all processed packages     | ~25% (many errors) |
| 6     | Strict boolean & nullish pass (backend + mca hotspots) | ~20%               |
| 7     | Unsafe any & remaining require-await / no-unsafe-*     | ~8%                |
| 8     | Refactor static utility classes + console cleanup      | Final 2%           |

## Tracking log

Add dated entries below as progress occurs.

| Date       | Batch       | Actions                                                                                                                                                                                                                                                                        | Post-Run Error Count     |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| (init)     | 0           | Baseline after config & first auto-fix                                                                                                                                                                                                                                         | 635 errors / 16 warnings |
| 2025-08-25 | 1           | Types & utils pass (steps 1–5: imports, array style, inferrable types, unused vars) – no changes needed beyond verification                                                                                                                                                  | 635 errors / 16 warnings |
| 2025-08-25 | 2 (partial) | Backend: static admin + env config nullish fixes; removed unnecessary async & strict-boolean fixes across routes (characters, config, events, memory, public, websocket, chat partial); narrowed websocket/memory/chat unsafe areas                                            | (in-progress)            |
| 2025-08-25 | 3 (start)   | Context-modifier: duplicate import consolidation, type-only imports, removed unused imports, array style & inferrable type cleanups, initial strict-boolean & nullish adjustments in core builder + detector; added access modifiers earlier than plan due to rule enforcement | (in-progress)            |
| 2025-08-26 | Snapshot    | Whole monorepo lint after config ignores & partial admin/affect/mca work. 123 errors / 3 warnings. Prepared categorized breakdown below.                                                                                                                                       | 123 errors / 3 warnings  |
| 2025-08-26 | 7           | Added explicit accessibility modifiers where required (most already present); updated plan matrix to mark Step 7 completed for classes-containing packages.                                                                                                                    | (pending re-run)         |
| 2025-08-26 | 8 (final)   | Completed Step 8: strict-boolean, prefer-nullish, and residual no-unnecessary-condition cases eliminated; introduced centralized logger groundwork (console gating).                                                                                               | (post-run)               |
| 2025-08-26 | Snapshot    | Post-Step 8 near-complete verification lint run (scope: whole repo). Totals: 34 errors, 3 warnings.                                                                                                                                                                            | 34 errors / 3 warnings   |
| 2025-08-26 | 9 (final)   | Completed Step 9: unsafe-any family & explicit-any fully eliminated; removed legacy strict-boolean disables; service prompt construction documented.                                                                                                                         | 0 errors / 0 warnings    |

## Current error category breakdown (2025-08-26) (detailed)

| Count | Rule / Issue                                                                                                                                           | Plan Step  | Notes / Cohesive Fix Strategy                                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | `@typescript-eslint/strict-boolean-expressions`                                                                                                      | 8          | Cleared in latest run (explicit null/empty handling added across dashboard & backend tests).                                                                            |
| 0     | `@typescript-eslint/prefer-nullish-coalescing`                                                                                                       | 8          | Cleared (all remaining logical fallbacks evaluated; none required rule suppression).                                                                                    |
| 0     | `@typescript-eslint/no-unnecessary-condition`                                                                                                        | 8          | Cleared (redundant guards in dashboard components & logger env detection simplified).                                                                                   |
| 0     | Unsafe any family (`no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-argument`, `no-unsafe-call`, `no-unsafe-return`) | 9          | Cleared (typed adapters & guards added; no suppressions remain).                                                                                                         |
| 0     | `@typescript-eslint/no-explicit-any`                                                                                                                 | 9          | Cleared (all remaining uses converted to specific types).                                                                                                               |
| 5     | `@typescript-eslint/no-unsafe-call` / object destructuring subset (counted above)                                                                    | 9          | Part of unsafe any cluster; resolve via typing and guard functions.                                                                                                     |
| 5     | `@typescript-eslint/require-await`                                                                                                                   | 6          | Remove `async` where no awaits (e.g., vector memory retrieval) or add awaited operations.                                                                             |
| 5     | `@typescript-eslint/explicit-function-return-type`                                                                                                   | 6          | Add explicit return types to exported helpers/components; batch with require-await.                                                                                     |
| 4     | `@typescript-eslint/restrict-template-expressions`                                                                                                   | 9          | Template literals in UnderTheHoodPanel using possibly non-string values; coerce via String() or typed narrowing.                                                        |
| 2     | Parsing (vite.config.ts files)                                                                                                                         | 0 / Config | Add to ESLint ignore or create minimal tsconfig include for those build files.                                                                                          |
| 2     | `@typescript-eslint/ban-ts-comment`                                                                                                                  | 11         | Replace with `@ts-expect-error` after legit typing attempt or remove via proper types.                                                                                |
| 2     | `no-console` (warnings)                                                                                                                              | 11         | Replace with logger abstraction or silence with justification.                                                                                                          |
| 1     | `react-hooks/exhaustive-deps` (warning)                                                                                                              | 11         | Add `fetchCharacters` to dependency array or refactor to stable callback; evaluate after unsafe-any cleanup.                                                          |
| 1     | `@typescript-eslint/no-unsafe-argument` (vector memory specific)                                                                                     | 9          | Provide explicit numeric type for argument at `l3-vector-memory.ts:179`.                                                                                              |

### High-leverage next batches (proposed)

1. Micro-batch A (easy wins ~8 errors): Fix duplicate imports, remove stray asyncs, add return types, eliminate await-thenable, ignore/tsconfig for vite configs.
2. Batch B (~63 issues): Strict boolean + nullish pass across admin-dashboard; remove non-null assertions.
3. Batch C (~29 issues): Typed fetch/WS response interfaces; vector memory reduce typing; backend test unsafe any cleanup.
4. Batch D (residual polish): restrict-template-expressions, console, hooks deps, ban-ts-comment replacements.

### Targeted file cluster summary

| Area                                                                             | Primary Rules Present                                      | Rationale                                                                     |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| admin-dashboard components (CharacterSelector, EmotionalStateVisualizer, Panels) | strict-boolean, prefer-nullish, unsafe any/member/argument | Central data fetching & state shape assumptions; unify API typing here first. |
| admin-dashboard runtime/config                                                   | strict-boolean, return-type, unsafe assignment             | Early environment variable handling; easy to harden with explicit guards.     |
| backend tests                                                                    | strict-boolean, ban-ts-comment, await-thenable             | Low risk; quick cleanup to reduce global error count.                         |
| mca l3-vector-memory                                                             | require-await, unsafe-argument                             | Isolated fix; can be part of Micro-batch A.                                   |
| frontend memoryClient                                                            | strict-boolean, prefer-nullish, unsafe-return              | Introduce typed return interface & guard config access.                       |

### Immediate action checklist (if proceeding now)

- [ ] Ignore or properly include `packages/*/vite.config.ts` to clear parsing errors.
- [ ] Remove duplicate imports (`chart.js`, `react`).
- [ ] Convert `retrieve` in `l3-vector-memory` to sync (drop async) and type reduce callback.
- [ ] Add return types to three frontend page components & `runtime.ts` helper.
- [ ] Replace unnecessary `await` & fix single floating promise.
- [ ] Begin boolean/nullish pass in `CharacterSelector` & `App.tsx` to establish patterns.

Document each micro-batch in the log as landed.

---

Update this file with each batch commit. Keep commits narrow; if a batch balloons >500 LOC changed, split by rule cluster.
