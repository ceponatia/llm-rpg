# Consolidation Notes

Supplementary notes captured during migration of Memory + Story into the `rpg` workspace.

## Scope

- Copy-only migration (original repos untouched).
- Namespace change to `@rpg/*` performed comprehensively.
- Introduced environment flags for optional static embedding.

## Key Decisions

- Skip dual namespace aliasing to reduce complexity.
- Maintain separate dev processes for fastest iteration; embedding reserved for demos.
- Defer GraphQL gateway until REST aggregation use-cases expand.

## Follow-Up Items

- Implement `build:frontend:embed` script & static serve gating.
- Dependency version alignment pass (React, TS, tooling).
- Add contributor guide once structure stabilizes.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Version skew between frontend & backend | Embed mode as fallback; clear release notes |
| Stale env documentation | Central `.env.example` and integration doc |
| Drift in logging conventions | Adopt logging policy doc (to be ported/refreshed) |

## Status Summary

- Namespace migration: COMPLETE.
- Docs baseline: CREATED (`integration-story-memory.md`, this file).
- Static embedding for frontend: PENDING.

