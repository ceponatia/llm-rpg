# (Closed) Consolidate domain schemas into `@rpg/types`

Closed on 2025-08-26. Frontend now imports shared panel/domain schemas from `@rpg/types`; duplication eliminated, tests & build green. This archive embeds the full original plan below plus a closure summary.

---

## Closure Summary (2025-08-26)

Achievements:

* Unified character / setting / location / object asset / conversation turn schemas under `packages/types/src/panels.ts`.
* Added helper schemas (id, timestamp, tag) with consistent naming (`idSchema`, `unixTimestampSchema`, `tagSchema`).
* Updated frontend repositories and validation helpers to consume shared schemas.
* Removed legacy duplicated schema definitions (frontend transitional re-export only used briefly; now removed as planned).
* Confirmed bundle size stable (~187 kB main JS at time of consolidation) — no adverse increase.
* All tests passed post-migration.

Deferred / future considerations:

* Potential splitting of panel schemas vs broader gameplay/narrative schemas if scope widens.
* Add Chat / Memory retrieval schemas once backend chat route lands.
* Generate Zod -> OpenAPI or JSON Schema for external integration (not yet needed).
* Introduce lint rule or codemod to prevent re‑introducing local ad-hoc schemas in frontend packages.

Validation recap: All checklist items satisfied; no open risks remained after migration.

Rollback: Revert the consolidation commit; restore previous `frontend/src/domain/schemas.ts` from history (low risk).

---

<!-- BEGIN ORIGINAL PLAN CONTENT -->

## Consolidate domain schemas into `@rpg/types` (original plan)

Objective: Eliminate duplicated Zod schemas by moving frontend domain models (`packages/frontend/src/domain/schemas.ts`) into the shared `@rpg/types` package (or merging with existing definitions if already present) and updating consumers.

## Current State

* Frontend duplicates character/location/object/setting schemas.
* Shared package `@rpg/types` exists; need to inspect existing definitions (character, chat, etc.).
* Risk of drift between frontend and backend validations.

## Goals

* Single source of truth in `packages/types/src`.
* Provide both TypeScript types and Zod runtime validators.
* Preserve tree-shaking (use named exports, no side-effect init code).

## Inventory & Diff

From frontend:

* `CharacterSchema`, `SettingSchema`, `LocationSchema`, `ObjectAssetSchema`, `ConversationTurnSchema` + helper `IdSchema`, `TimestampSchema`, `TagSchema`.

Need to compare with existing in `@rpg/types` (run later):

```bash
grep -R "CharacterSchema" packages/types/src || true
```

## Migration Strategy

1. Audit existing schemas in `@rpg/types` and list overlaps / differences.
2. For each overlapping schema:
   * If identical: copy + add comment `// unified from frontend` (or confirm already present).
   * If divergent: create a superset schema or resolve property mismatches (document decisions in this file, then trim after completion).
3. Add any missing helper schemas (Id, Timestamp, Tag) to a `schemas/common.ts` in types package.
4. Export via an `index.ts` or maintainers file; ensure no circular export explosion.
5. Add re-export compatibility layer (optional) in frontend: create `src/domain/index.ts` with `export * from '@rpg/types';` (temporary) while updating imports.
6. Replace frontend imports:
   * Find: `import { CharacterSchema` etc. from `../domain/schemas`.
   * Replace with `import { CharacterSchema } from '@rpg/types';`.
7. Remove local `frontend/src/domain/schemas.ts` once no references remain.
8. Run typecheck & tests.
9. Update docs referencing duplication (closed frontend plan) to note consolidation complete.
10. Commit: `refactor(types): consolidate domain schemas into @rpg/types`.

## Detailed Steps / Commands

```bash
# 1. Inspect existing shared types
grep -R "Schema" packages/types/src | head -50

# 2. Create common helpers (if absent)
echo "export const IdSchema = z.string().min(1);" > packages/types/src/schemas/common.ts

# 3. Move or merge each schema
# (Implement with actual file edits)

# 4. Update frontend imports
grep -R "../domain/schemas" packages/frontend/src

# 5. Remove obsolete file
git rm packages/frontend/src/domain/schemas.ts

# 6. Validate
pnpm --filter @rpg/frontend exec tsc --noEmit
pnpm --filter @rpg/frontend test
```

## Edge Cases

* Divergent enum values (e.g., rarity sets) — resolve by union or by selecting canonical list; version bump if breaking.
* Backend-only properties: Ensure optional in shared schema so frontend remains compatible.
* Tree-shaking: Avoid wildcard deep re-exports that could pull in server-only code.

## Versioning / Impact

* Internal monorepo — no semantic version bump needed unless publishing externally. If publishing, bump minor.

## Validation Checklist

* [x] All frontend imports point to `@rpg/types`.
* [x] No duplicate schema logic left in frontend (transitional file removed).
* [x] Tests pass.
* [x] Build size not materially increased (frontend prod build succeeded ~187 kB bundle JS).
* [x] Docs updated (this checklist finalized; optional closure note can be added later if needed).

## Rollback Plan

Revert commit; restore `frontend/src/domain/schemas.ts` from git history.

---
Ready after rename task or can run in parallel (low coupling).

<!-- END ORIGINAL PLAN CONTENT -->
