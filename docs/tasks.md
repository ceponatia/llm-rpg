# Improvement Task Breakdown & Execution Plan

Derived from architecture & code health investigation (Aug 2025). This plan operationalizes recommendations: filling stub implementations, strengthening types & tests, consolidating shared contracts, adding observability, and preparing the emotion (affect) engine for integration.

Conventions:

- Status initial = PENDING
- Types: BE (backend), MCA (memory core), CM (context-modifier), AFF (affect engine), FE (frontend), INF (infrastructure/devops), QA (quality/testing), OBS (observability), DOC (documentation), ARCH (architecture/refactor), DATA (data/graph/vector layer), DX (developer experience)
- Every task ships with validation you can automate (unit/integration test, script output, or inspection command).
- Keep PRs scoped to ≤ ~400 LOC net change unless noted.

## Phase 0: Preconditions / Guard Rails

| ID | Task | Type | Dependencies | Deliverable | Validation |
|----|------|------|--------------|-------------|------------|
| CAS-000 | Add `.eslintignore` to exclude `dist` & generated zod JS | DX | — | `.eslintignore` file | `pnpm lint` no longer scans build output (runtime < prior) |
| CAS-001 | Root `typecheck` script (project refs order) | INF | CAS-000 | `"typecheck": "tsc -b packages/types packages/affect packages/mca packages/context-modifier packages/backend"` | `pnpm typecheck` exits 0 |
| CAS-002 | Add root `clean` script (remove dist, coverage) | DX | CAS-000 | `clean` script in root `package.json` | `pnpm clean` removes all `dist` dirs |
| CAS-003 | Introduce `logger` usage policy doc (replace raw console.log) | DOC | — | `docs/logging-policy.md` | Doc present; references structured API |

## Phase 1: Unblock Stubbed Core (Context Modifier & Managers)

| ID | Task | Type | Dependencies | Deliverable | Validation | Status |
|----|------|------|--------------|-------------|------------|--------|
| CAS-010 | Implement `PersonaManager` basic in-memory registry | CM | CAS-001 | Methods return persona objects; fallback default | Unit test `persona.spec.ts` passes | ✅ |
| CAS-011 | Implement `IntentDetector.detectIntent` (keyword + fallback) | CM | CAS-010 | Simple rule engine + config | Test: sample inputs map to intents | ✅ |
| CAS-012 | Implement `ModifierManager.registerModifier` + listing | CM | CAS-011 | Registry + validation stub | Test ensures registration & retrieval | PENDING |
| CAS-013 | Implement `ModifierManager.applyModifiers` (MVP: select first N) | CM | CAS-012 | Returns structure with intensities + emotional adjustment passthrough | Test asserts output shape & intensity bounds | PENDING |
| CAS-014 | Implement `ModifierStateManager.getState/updateState` (in-memory map) | CM | CAS-013 | State map keyed by session | Test persists across calls | PENDING |
| CAS-015 | Wire `PromptBuilder.buildPrompt` to real managers (remove placeholder notes) | CM | CAS-014 | Updated `buildPrompt.ts` | Integration test builds prompt end-to-end | PENDING |
| CAS-016 | Add error classes instead of `throw new Error('... not implemented')` | ARCH | CAS-015 | `errors.ts` + replaced throws | Grep shows no literal 'not implemented' | PENDING |

Phase 1 Exit Criteria: Prompt builder produces structured prompt with persona + (possibly empty) modifiers + emotional placeholder without runtime errors.

## Phase 2: Shared Contracts & Type Consolidation

| ID | Task | Type | Dependencies | Deliverable | Validation |
|----|------|------|--------------|-------------|------------|
| CAS-020 | Move `VADState` to `@cas/types` (single source) | ARCH | CAS-015 | Update types package export & affect imports | Build passes; no duplicate local interface |
| CAS-021 | Zod schema for `EmotionState` & `AffectSignal` | AFF | CAS-020 | `emotion.zod.ts` generated & exported | Runtime parse test roundtrip |
| CAS-022 | Add build dependency ordering for `@cas/affect` after `@cas/types` | INF | CAS-020 | Adjust root build script | `pnpm build` outputs dist in correct order |
| CAS-023 | Add semantic version constraints to cross-package deps | INF | CAS-022 | Updated `package.json` versions | `pnpm install` shows no peer warnings |

Phase 2 Exit: Single canonical emotional type; affect build consumes it; schema validation available.

## Phase 3: Testing & Quality Expansion

| ID | Task | Type | Dependencies | Deliverable | Validation |
|----|------|------|--------------|-------------|------------|
| CAS-030 | Unit tests for `ModifierManager` (selection, decay) | QA | CAS-013 | `modifierManager.spec.ts` | Coverage >80% for file |
| CAS-031 | Unit tests for `IntentDetector` (edge cases) | QA | CAS-011 | `intentDetector.spec.ts` | All sample intents covered |
| CAS-032 | Prompt assembly test (token truncation behavior) | QA | CAS-015 | `promptBuilder.spec.ts` | Asserts truncation & tokens heuristic |
| CAS-033 | Saturation/friction property tests (idempotence near baseline) | QA | CAS-021 | Property-based test file | Randomized runs pass |
| CAS-034 | Backend route smoke integration (characters + chat) | QA | CAS-015 | Vitest integration suite | 2xx responses; expected shape |
| CAS-035 | Neo4j mapping serialization test harness | DATA | CAS-034 | Test that creating nodes flattens properties | Roundtrip matches schema |

Phase 3 Exit: Core new logic has unit coverage; key integration path tested.

## Phase 4: Observability & Error Handling

| ID | Task | Type | Dependencies | Deliverable | Validation |
|----|------|------|--------------|-------------|------------|
| CAS-040 | Replace `console.log` with structured logger (backend + mca) | OBS | CAS-003 | Updated calls using `@cas/utils/logger` | Grep finds no plain console.log (except allowed startup) |
| CAS-041 | Add request correlation id middleware | BE | CAS-040 | Middleware module + test | Test asserts id echoed in logs |
| CAS-042 | Introduce metrics interface (counter, gauge, histogram) | OBS | CAS-040 | `metrics.ts` + no-op impl | Unit test increments counters |
| CAS-043 | Instrument prompt build timing & memory retrieval counts | OBS | CAS-042 | Metrics calls inside builder & MCA | Metrics test asserts counter increments |
| CAS-044 | Unified domain error classes & HTTP mapping | BE | CAS-016 | `errors/` folder + handler | Error test returns structured JSON |

Phase 4 Exit: Structured logs, metrics primitives, no raw console logs, consistent errors.

## Phase 5: Performance & Retrieval Enhancements

| ID | Task | Type | Dependencies | Deliverable | Validation |
|----|------|------|--------------|-------------|------------|
| CAS-050 | Tokenizer abstraction (pluggable; default heuristic) | MCA | CAS-032 | `tokenizer.ts` + interface | Unit test swaps dummy tokenizer |
| CAS-051 | Adaptive fusion weighting prototype (density-based) | MCA | CAS-050 | Strategy module | Test: weights adjust with variable input counts |
| CAS-052 | LRU caching for persona + modifiers lookups | CM | CAS-015 | Cache layer util | Benchmark test shows reduced repeated latency |
| CAS-053 | Retrieval timing instrumentation & threshold alerts | OBS | CAS-042 | Metrics timers + warning log | Test triggers alert on slow mock retrieval |
| CAS-054 | Vector memory rebuild guard on dimension mismatch | MCA | CAS-050 | Init check raising explicit error | Simulated mismatch test passes |

Phase 5 Exit: Basic adaptive performance features & safeguards active.

## Phase 6: Affect Engine Integration

| ID | Task | Type | Dependencies | Deliverable | Validation |
|----|------|------|--------------|-------------|------------|
| CAS-060 | Affect → prompt adapter (state summary string) | AFF | CAS-021, CAS-015 | Adapter fn + integration test | Prompt includes affect section when enabled |
| CAS-061 | Emotion state persistence (serialize per session) | AFF | CAS-060 | Serializer in backend layer | Restart test restores state |
| CAS-062 | Affect-driven modifier hinting (e.g. anxiety -> calming) | CM | CAS-060, CAS-013 | Mapping table + logic injection | Test: anxiety triggers calming modifier id |
| CAS-063 | Trust gate integration with relationship graph weight | MCA | CAS-062 | Updated trust computation | Graph mock test adjusts gate factor |
| CAS-064 | Mode transition events emitted (observer pattern) | AFF | CAS-061 | Event emitter + tests | Test captures emitted event on transition |

Phase 6 Exit: Affect influences prompt & modifiers; state persists; events observable.

## Phase 7: Data & Persistence Hardening

| ID | Task | Type | Dependencies | Deliverable | Validation |
|----|------|------|--------------|-------------|------------|
| CAS-070 | Neo4j constraints & index migration script | DATA | CAS-035 | Cypher migration file(s) | Running script idempotent & enforces uniqueness |
| CAS-071 | Turn/session retention policy (config + pruning job) | DATA | CAS-070 | Scheduled job + config | Test prunes > threshold turns |
| CAS-072 | Vector memory persistence stub (dump/load) | DATA | CAS-054 | Dump & load functions | Dump+load test retains count |
| CAS-073 | Relationship trust seeding into affect baseline | DATA | CAS-061 | Trust baseline adapter | Test baseline equals graph-derived trust mean |

Phase 7 Exit: Data layer has constraints, retention, partial persistence, trust seed path.

## Phase 8: Developer Experience & Docs

| ID | Task | Type | Dependencies | Deliverable | Validation |
|----|------|------|--------------|-------------|------------|
| CAS-080 | CONTRIBUTING.md (coding standards, build order) | DOC | CAS-001 | `CONTRIBUTING.md` | New dev checklist passes dry-run |
| CAS-081 | Architecture overview diagram & doc | DOC | CAS-015 | `docs/architecture.md` | Diagram renders; links valid |
| CAS-082 | Affect integration guide | DOC | CAS-060 | `docs/affect-integration.md` | Guide references exported APIs |
| CAS-083 | Prompt system design doc (layers, weights) | DOC | CAS-050 | `docs/prompt-system.md` | Doc diagrams + RAG weighting rationale |
| CAS-084 | Coverage threshold gating in CI (e.g. 70%) | QA | CAS-030 | CI config update | CI fails if coverage below threshold |

Phase 8 Exit: Clear contributor docs, architectural transparency, enforced coverage gate.

## Phase 9: Future / Stretch Enhancements

| ID | Task | Type | Dependencies | Deliverable | Validation |
|----|------|------|--------------|-------------|------------|
| CAS-090 | Advanced sentiment (LLM scoring fallback) | AFF | CAS-060 | Adapter w/ feature flag | Flagged test uses mock LLM path |
| CAS-091 | Temporal decay tuning experiment harness | MCA | CAS-050 | Script comparing decay curves | Output CSV & plotted chart exists |
| CAS-092 | Pluggable memory fusion strategy registry | MCA | CAS-051 | Strategy interface + registry | Test loads alt strategy dynamically |
| CAS-093 | Streaming prompt diff generation (opt) | CM | CAS-015 | Diff builder util | Test shows diff vs full prompt |
| CAS-094 | WebSocket event push for mode transitions | FE | CAS-064 | WS message contract + UI badge | UI test receives and displays mode change |

---

## Phase Exit Summary Targets

- Phase 1: No stub throws in normal prompt flow.
- Phase 2: Single canonical emotional types.
- Phase 3: ≥70% coverage for new modules, prompt and manager logic validated.
- Phase 4: Zero raw console.log (except startup); metrics present.
- Phase 5: Tokenization abstraction and adaptive fusion working.
- Phase 6: Affect influences prompt & modifiers with persistence.
- Phase 7: Data constraints & retention enforced.
- Phase 8: Contributor onboarding friction < 15 minutes (manual test).

## Validation Matrix (Cross-Cutting)

- Observability: CAS-040, 041, 042, 043, 053
- Performance: CAS-050, 051, 052, 053, 054
- Data Integrity: CAS-070, 071, 072, 073
- Testing Quality: CAS-030–035, 033, 084
- Integration (Affect): CAS-060–064

## Suggested Implementation Order

Follow ascending phase order; within a phase, tasks can run in parallel if dependencies allow (deploy dependency graph in CI for gating).

---

End of tasks plan v1.0 (investigation follow-up).
