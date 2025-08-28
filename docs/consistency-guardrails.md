# Consistency Guardrails (Design Notes)

This document tracks additional, higher-risk or more complex ideas for maintaining character and narrative consistency. The production system currently implements only low-risk heuristics (turn-cadence + cooldown, user cue override). Everything below is future work.

## Goals

* Encourage stable persona and style over long sessions.
* Avoid heavy prompts or frequent, interruptive reminders.
* Be token-budget aware, minimizing overhead when memory is large.

## Potential Heuristics & Signals

* Topic drift signal
	* Track cosine similarity between the last K user messages and a rolling session theme centroid. If similarity drops below a threshold for N turns, schedule a consistency reminder.
	* Compute using already-retrieved vector embeddings (l3) to avoid extra calls.
* Memory overlap / relevance ratio
	* Ratio of referenced facts in the last response that match high-importance L2 facts. If too low across M turns, prompt a soft recall reminder.
* Emotional drift detector
	* Compare recent speaking style and sentiment with the character’s baseline VAD. If average absolute delta > threshold for T turns, inject a brief OOC style anchor.
* OOC classifier
	* Light-weight classifier for phrases like “btw as the AI,” “system prompt,” “as ChatGPT,” etc. If triggered, raise priority for the next consistency injection.
* Session phase boundaries
	* At scene changes or when a new character is introduced, provide a one-time, stronger persona recap.

## Policies

* Cooldown windows
	* Maintain both turn-based and time-based cooldowns to avoid back-to-back reminders.
* Size-awareness
	* Skip reminders when prompt token count exceeds a soft limit (e.g., 85% of model context window).
* Priority levels
	* Convert multiple signals into a score; inject only if score exceeds threshold and cooldown allows.

## UX & Telemetry

* Visibility
	* Surface when/why an injection occurred in the Under The Hood panel.
* Toggles
	* Expose env flags to disable or tune thresholds without redeploy.

## Implementation Sketch (future)

* Add a ConsistencySignalAggregator that consumes:
	* Recent turns (L1)
	* Selected L2 facts/characters and their importance
	* L3 retrieved fragments & similarities
* Compute a score and decision, returning an optional fragment and reason code for UI.

## Risks

- Over-constraining style can reduce creativity.
- False positives from classifiers may annoy users.
- Token budget pressure in long contexts.

## Summary

Keep the current heuristics lean and predictable. Iterate behind flags on richer detectors and score-based policies. Ensure all injections remain append-only and do not interfere with memory ingestion or streaming behavior.
