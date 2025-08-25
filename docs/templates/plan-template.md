# <Project / Feature Name> – Implementation Plan Template

## 1. Summary

Concise 2–3 sentence overview of the feature/initiative and the outcome it enables.

## 2. Goals

List the measurable goals / success criteria.

* Improve ...
* Reduce ...
* Enable ...

## 3. Non‑Goals

Explicitly state what is out of scope to prevent scope creep.

* Not doing ...

## 4. Context / Background

Why this is needed now. Link to prior docs / issues if relevant.

## 5. Stakeholders

| Role | Person / Team | Responsibility |
|------|---------------|----------------|
| Owner | (TBD) | Delivery |
| Reviewer | (TBD) | Technical review |
| QA | (TBD) | Test plan / validation |

## 6. Architecture / Design Overview

High-level description of the approach. Include diagrams (place images in `docs/diagrams/`).

## 7. Detailed Plan

### 7.1 Components / Modules Affected

* package/module1
* package/module2

### 7.2 Data Model / Contracts

Describe any new types / endpoints / events. Include request/response or schema snippets.

### 7.3 Algorithm / Flow

Pseudo-code or sequence steps if complex.

### 7.4 Configuration & Env Vars

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| EXAMPLE_FLAG | Enables X | false | No |

## 8. Migration / Rollout Strategy

Phased steps, feature flags, backout plan.

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Example risk | High | Add fallback ... |

## 10. Testing Strategy

* Unit: what functions
* Integration: which flows
* Performance: targets & method
* Security: validations / abuse cases

## 11. Observability

Metrics, logs, tracing spans to add.

## 12. Performance Considerations

Expected load, estimated complexity, caching strategy.

## 13. Open Questions

* Q1?
* Q2?

## 14. Alternatives Considered

Brief notes on discarded approaches and why.

## 15. Incremental Implementation Checklist

Use GitHub task list; update statuses in PRs.

* [ ] 1. Define contracts
* [ ] 2. Add feature flag / config
* [ ] 3. Implement core logic
* [ ] 4. Add tests (unit/integration)
* [ ] 5. Add metrics & logs
* [ ] 6. Update docs & template usage
* [ ] 7. Cleanup / remove flag (if applicable)

## 16. Acceptance Criteria

Bullet list of verifiable outcomes.

* API returns ...
* Throughput >= ...

## 17. Appendix

Links, extended schemas, benchmarks.
