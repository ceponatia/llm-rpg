# Affect Package Next Steps (Imported)

This document outlines the staged plan to evolve and integrate the `@rpg/affect` emotion system while keeping it fully decoupled (plug & play) from the rest of the monorepo.

---
## 1. Decouple From External Types (IN PROGRESS)

- Replace imports of `VADState` from `@rpg/types` with a local interface.
- Add adapter helpers (`fromExternalVAD`, `toExternalVAD`) for optional interop.
- Remove `tsconfig` project reference to `../types`.
- Ensure no transitive runtime dependency is introduced.

## 2. Public API Hardening

- `index.ts` only re-exports pure functions & types.
- Add `serializeEmotionState(state)` / `restoreEmotionState(json)` for persistence.
- Provide `createEmotionConfig(partial)` with deep merge + validation.

## 3. Runtime Validation (Lightweight)

- Add manual assertions (no external schema libs) to guard config & signal ranges.
- Produce notes like `input_clamped` when normalization occurs.

## 4. Math / Dynamics Enhancements

- Separate raw delta composition vs. adjustment stages (negativity bias, saturation, friction, trait caps, gates).
- Add unit tests for:
	- Trust gate scaling monotonicity.
		- Friction monotonic increase with distance.
		- Trait cap corridor not exceeded.
		- Saturation plateau (delta magnitude decreases past threshold).
		- Corridor enforcement if added.

## 5. Discrete Affect Extensions

- Allow registration of additional discrete affect channels (`registerAffectChannel(name, influenceSpec)`).
- Make influence mapping data-driven (config arrays instead of hard-coded keys).

## 6. Mode System Evolution

- Extract mode logic into pluggable registry: `registerModeTransition(fn)`.
- Expose `computeNextMode(state, cfg)` (pure) letting host decide to apply.
- Add additional modes (e.g. `Calm`, `Tense`, `Euphoric`) with thresholds defined in config.

## 7. Signal Extraction Layer

- Keep `extraction.ts` heuristic-only; optionally introduce optional advanced NLP adapter (behind feature flag) later.
- Expose `analyzeTextHeuristics(text)` returning raw counts for debugging.

## 8. Performance & Stability

- Micro-benchmark harness (optional) to ensure `updateEmotion` < target latency.
- Add optional `config.enforceCorridor` (elastic or clip) with test coverage.

## 9. Hooks / Extension Points

- Pre / post delta hooks: `beforeDeltaApply(state, draft)` & `afterDeltaApply(state, applied)` (return possibly modified copies).
- Event emission (pure data objects) host may route elsewhere.

## 10. Documentation

- Package `README.md` with: overview, data model, update pipeline, extension APIs, examples.
- CHANGELOG.md with semantic version increments.

## 11. Integration Adapter (Main Repo)

- Optional helper: `augmentPromptWithEmotion(parts, emotionState)` returning enriched prompt sections.
- Keep adapter in *affect* package but do not import main packages.

## 12. Safety & Future Work

- Confidence weighting (future) if model output includes certainty.
- Potential Bayesian upgrade (Option 4) if noise handling required.

---
### Immediate Actions (Suggested Order)

1. (✔) Add local `VADState` & remove external import.
2. Add adapters file & export conversion helpers.
3. Remove project reference from `tsconfig`.
4. Add serialization helpers & config factory.
5. Add validation & additional unit tests.

Feel free to request implementation of any specific step next.
