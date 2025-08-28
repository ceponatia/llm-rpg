# Logging Policy

This document defines how logging must be performed across the RPG consolidated codebase.

## Goals

* Consistent, structured logs.
* Minimize noise while preserving diagnostic value.
* Enable future redirection to external collectors (e.g. OpenTelemetry, Loki) without sweeping refactors.

## Log API

Use the `Logger` from `@rpg/utils` (when implemented) or the backend's logger instance:

```ts
import { Logger } from '@rpg/utils';
Logger.debug('Loading persona', { id });
Logger.info('Ingested turn', { turnId, sessionId });
Logger.warn('Vector dimension mismatch', { expected, actual });
Logger.error('Neo4j write failed', { error: err });
```

## Levels

| Level  | Usage                                                                                 |
|--------|----------------------------------------------------------------------------------------|
| debug  | Detailed, high‑cardinality diagnostic info (disabled in prod by default).             |
| info   | High‑level lifecycle events (startup, retrieval summary, ingestion results).          |
| warn   | Recoverable anomalies or degraded behavior (retryable errors, fallback paths).        |
| error  | Failures losing data, breaking a request, or violating invariants.                    |

## Structured Fields

Always pass a single object as the first metadata argument (after the message) when there are key details. Avoid spreading primitives.

Recommended keys:

* `sessionId`
* `characterId`
* `turnId`
* `durationMs`
* `error` (raw error object)
* `count` (quantities, list sizes)

## Prohibited

* Raw user PII (only anonymized / hashed if ever added).
* Entire prompt payloads at `info` or lower (use `debug` if essential during dev).
* Logging secrets or environment variable values.

## Patterns

* Wrap external service calls: log start (debug) + completion (info) with duration.
* For batch operations, log aggregate counts instead of each item at `info` level.
* Pair every `warn` with an action hint (planned fallback, next step, or suppress justification).

## Migration Guidance

1. Replace `console.log`/`warn`/`error` with corresponding `Logger` calls.
2. Prefer `Logger.debug` for verbose memory layer dumps.
3. If an error is thrown upward, log once—don’t log again at the catch site unless adding context.

## Future Extensions

* Pluggable sink adapter interface.
* Correlation / trace IDs (future task) injected into a base context.
* JSON serialization for structured ingestion.

## Validation

* Grep `console.log` (and other console methods) should return only explicitly allowed startup messages after migration task completed.

End of policy.
