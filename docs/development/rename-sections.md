# Rename `sections/` to `components/panels/` Plan

Objective: Normalize component taxonomy by moving dashboard-specific UI from `packages/frontend/src/sections/` to `packages/frontend/src/components/panels/` without breaking imports or tests. Keep git history as practical.

## Rationale

* Aligns with target structure outlined in closed migration doc.
* Clarifies difference between generic components (`components/`) and dashboard panel aggregates (`components/panels/`).
* Prepares for future extraction of primitives and layout.

## Scope

In-scope files (current):

* `sections/AdminFrame.tsx`
* `sections/AdminPanel.tsx`
* `sections/LibraryPanel.tsx`
* `sections/RepositorySection.tsx`

Out-of-scope:

* Any behavioral refactors (leave logic identical).
* Styling changes.
* Converting to code-splitting or lazy loading (future).

## Step-by-step

1. Create destination folder: `packages/frontend/src/components/panels/`.
2. Move each file from `sections/` into `components/panels/` keeping filenames.
3. Update internal relative imports:
   * In any file importing from `../sections/...` change to `../components/panels/...` (e.g., `Dashboard.tsx`).
4. Run TypeScript check: `pnpm --filter @rpg/frontend exec tsc --noEmit`.
5. Run tests: `pnpm --filter @rpg/frontend test`.
6. Grep for lingering `sections/` references: `grep -R "sections/" packages/frontend/src || true`.
7. Delete now-empty `sections/` directory if unused.
8. (Optional) Add an index barrel `components/panels/index.ts` exporting all panels for simpler imports later.
9. Commit with message: `refactor(frontend): rename sections to components/panels`.

## Edge cases & Notes

* Ensure no circular import introduced by new path depth.
* Preserve case sensitivity (Linux CI).
* If using any tooling that watches glob patterns, update them only if they mention `sections` (Tailwind content already uses `src/**/*.{ts,tsx}`).

## Validation Checklist

* [x] All imports updated.
* [x] Build success.
* [x] Tests green.
* [x] No `sections/` directory remains. (Physically removed 2025-08-26 via manual deletion after tool delete limitation.)
* [ ] Storybook / preview (if added later) unaffected.

## Rollback

If issues arise, reverse the move using git: `git restore -SW packages/frontend/src/sections` (before commit) or revert the commit hash.

---
Completed on 2025-08-26. Any future panel additions should go under `components/panels/`; reintroducing `sections/` is discouraged.
