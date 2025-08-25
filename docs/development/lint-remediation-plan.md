# Incremental ESLint Remediation Plan

Purpose: Drive the error count to zero efficiently while minimizing merge conflicts and avoiding large risky refactors. Current snapshot (after first auto-fix pass): 635+ errors, 16 warnings (numbers will drift — always re-run `pnpm exec eslint . --ext .ts,.tsx` to refresh before each batch).

Guiding principles:

1. Stabilize config & parsing (done) before touching code.
2. Reduce error volume with safest, high‑leverage, mechanical edits first (imports, signatures, array type style) to shrink noise.
3. Then address rule clusters that require semantics (null checks, unsafe any usage).
4. Defer broad API surface changes (adding accessibility modifiers / removing `async`) until just before final pass to reduce rebase churn.
5. Track progress per category with checkboxes; commit in small, reviewable batches (≈50–150 changes) ensuring tests stay green.

### Command References

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

### Category Ordering (Rationale & Actions)

| Order | Category / Rule Cluster | Rationale | Actions / Patterns |
|-------|-------------------------|-----------|--------------------|
| 0 | Parsing / tsconfig include (DONE) | Unblocks type-aware rules | tsconfig.base.json includes set |
| 1 | Duplicate imports (`no-duplicate-imports`) | Low risk, cleans noise early | Merge imports; convert pure type imports to `import type` (paired with step 2) |
| 2 | Consistent type imports (`@typescript-eslint/consistent-type-imports`) | Mechanical; reduces diffs later | Add `type` keyword where only types used |
| 3 | Array style (`@typescript-eslint/array-type`) | Fully mechanical; large count | Replace `T[]` with `Array<T>` (batch auto-fix or codemod) |
| 4 | Trivial / inferrable types (`no-inferrable-types`) | Simplifies code, reduces lines touched for later edits | Remove explicit literals types |
| 5 | Unused vars & params (`no-unused-vars`) | Removes dead code before semantic passes | Delete or underscore prefix `_` for unused params |
| 6 | Remove unnecessary `async` / add missing return types (`require-await`, `explicit-function-return-type`) | Clarifies sync vs async; reduces false positives for later safety rules | Drop `async` where no await; add explicit return signatures |
| 7 | Accessibility modifiers (`explicit-member-accessibility`) | Large churn; do once after earlier pruning | Add `public`/`private`/`protected` intentionally; prefer minimal visibility |
| 8 | Strict boolean expressions / prefer-nullish-coalescing | Requires reasoning; tackle after codebase is lean | Replace `if (x)` with explicit checks, use `??`, guard empty string separately |
| 9 | Unsafe any / calls / member access (`no-unsafe-*`, `no-base-to-string`) | Highest semantic load; needs domain knowledge | Introduce proper types / narrowings / custom type guards |
| 10 | Extraneous classes (`no-extraneous-class`) | Potential refactor; delay until after method modifiers | Convert static-only utility classes to namespaces or plain functions |
| 11 | Remaining stylistic (curly, unbound-method, console) | Final polish | Insert braces, convert unbound refs to arrow or bind, gate logging behind logger abstraction |

### Batch Execution Checklist

Each batch: (a) run targeted eslint with --fix, (b) manually adjust leftovers, (c) run tests for affected packages, (d) commit.

#### Global Tracking

- [ ] Step 1 Duplicate imports cleaned
- [ ] Step 2 Type-only imports converted
- [ ] Step 3 Array style normalized
- [ ] Step 4 Inferrable types removed
- [ ] Step 5 Unused identifiers resolved
- [ ] Step 6 Async/Return types aligned
- [ ] Step 7 Accessibility modifiers added
- [ ] Step 8 Boolean/nullish strictness addressed
- [ ] Step 9 Unsafe any/calls eliminated or justified with safe wrappers
- [ ] Step 10 Static utility class refactors
- [ ] Step 11 Final stylistic polish & warnings -> zero

### Package Progress Matrix

| Package | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---------|---|---|---|---|---|---|---|---|---|----|----|
| utils | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| types | [x] | [x] | [x] | [x] | [x] | [ ] | [ ] | [ ] | [ ] | n/a | [ ] |
| utils | [x] | [x] | [x] | [x] | [x] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| affect | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| context-modifier | [x] | [x] | [x] | [x] | [x] | [~] | [ ] | [ ] | [ ] | [ ] | [ ] |
| mca | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| backend | [x] | [ ] | [ ] | [ ] | [ ] | [~] | [ ] | [~] | [ ] | [x] | [ ] |
| admin-dashboard | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a | [ ] |
| frontend | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a | [ ] |

Legend: Mark each step complete per package as batches land. "n/a" for steps not applicable (no static-only classes).

### Detailed Playbooks

#### Step 1 & 2: Imports

Scriptable approach (example codemod outline):

1. Run eslint fix.
2. For residual duplicates: consolidate manually.
3. Convert `import { TypeA, TypeB } from '...'` where only types to `import type { TypeA, TypeB } from '...'`.

#### Step 3: Array Style

Allow auto-fix (`--fix`). For manually resistant cases (e.g., nested arrays) ensure `Array<Array<number>>` formatting.

#### Step 4: Inferrable Types

Remove annotations like `const x: number = 3;` unless part of public exported API surface (leave exported function signatures & interfaces untouched for clarity).

#### Step 5: Unused Variables

Preferred order:

- Remove dead code.
- If required for interface/overload compatibility, rename param to `_param` to satisfy rule & document intentional disregard.

#### Step 6: Async / Return Types

- Remove `async` keyword when no `await` present.
- Add explicit `: ReturnType` for exported functions; internal small arrow callbacks inside array methods may rely on inference (rule allows typed expressions) — ensure config alignment.

#### Step 7: Accessibility Modifiers

Patterns:

- Constructors: always `public` unless enforcing controlled instantiation via `private` / `protected`.
- Fields assigned once: mark `private readonly` (or `protected readonly` where subclassing expected).
- Methods not intended for external consumption: `private` or `protected`.
Document any deliberate `public` util surfaces in JSDoc.

#### Step 8: Strict Boolean Expressions / Nullish

Checklist for each flagged conditional:

1. Determine value domain (string, number, object, possibly null/undefined).
2. Replace `if (maybeString)` with explicit `if (maybeString !== undefined && maybeString !== null && maybeString !== '')` or, simpler, apply invariant earlier and narrow.
3. Use sentinel variable: `const hasFoo = foo !== undefined && foo !== null; if (hasFoo) { ... }`.
4. Replace `a || default` with `a ?? default` unless empty string / 0 should trigger default; then write explicit check.

#### Step 9: Unsafe Any / Member Access

Strategies:

- Propagate proper generic types where `any` bleeds from external libs.
- Introduce minimal domain interfaces or `unknown` + type guards instead of asserting.
- Wrap third-party untyped calls in a dedicated adapter module exposing typed surface.
- For legacy unavoidable cases, isolate `// eslint-disable-next-line @typescript-eslint/no-unsafe-*` above a narrow line with justification comment (last resort; aim for <5 exceptions total).

#### Step 10: Static Utility Classes

Example transformation (before):

```ts
export class Logger { static debug(...args: unknown[]) { /* ... */ } }
```

After:

```ts
export const logger = { debug: (...args: ReadonlyArray<unknown>): void => { /* ... */ } } as const;
```

Advantages: eliminates need for accessibility modifiers & `no-extraneous-class` issues.

#### Step 11: Final Stylistic Polish

- Add braces to single-line `if` bodies.
- Replace non-null assertions by safe guards: `const el = doc.getElementById('x'); if (!el) return; // ...`
- Replace direct `console.*` with central logger or remove (except early bootstrap errors).

### Risk Mitigation

- Run unit/integration tests after each batch (`pnpm -r test` if available per package) to catch behavioral regressions.
- Avoid mixing semantic changes (e.g., refactoring memory algorithms) with mechanical lint fixes in the same commit.
- When adding null checks, ensure code paths preserve previous truthiness semantics (write quick inline comments if logic changed).

### Suggested Batch Schedule

| Batch | Scope | Expected Reduction |
|-------|-------|--------------------|
| 1 | utils + types (steps 1–5) | ~10% |
| 2 | backend (imports, array style, remove inferrable) | ~8% |
| 3 | context-modifier (same as batch 2) | ~12% |
| 4 | mca (imports + array style only) | ~15% |
| 5 | Add access modifiers across all processed packages | ~25% (many errors) |
| 6 | Strict boolean & nullish pass (backend + mca hotspots) | ~20% |
| 7 | Unsafe any & remaining require-await / no-unsafe-* | ~8% |
| 8 | Refactor static utility classes + console cleanup | Final 2% |

### Tracking Log
Add dated entries below as progress occurs.

| Date | Batch | Actions | Post-Run Error Count |
|------|-------|---------|-----------------------|
| (init) | 0 | Baseline after config & first auto-fix | 635 errors / 16 warnings |
| 2025-08-25 | 1 | Types & utils pass (steps 1–5: imports, array style, inferrable types, unused vars) – no changes needed beyond verification | 635 errors / 16 warnings |
| 2025-08-25 | 2 (partial) | Backend: static admin + env config nullish fixes; removed unnecessary async & strict-boolean fixes across routes (characters, config, events, memory, public, websocket, chat partial); narrowed websocket/memory/chat unsafe areas | (in-progress) |
| 2025-08-25 | 3 (start) | Context-modifier: duplicate import consolidation, type-only imports, removed unused imports, array style & inferrable type cleanups, initial strict-boolean & nullish adjustments in core builder + detector; added access modifiers earlier than plan due to rule enforcement | (in-progress) |

---

Update this file with each batch commit. Keep commits narrow; if a batch balloons >500 LOC changed, split by rule cluster.
