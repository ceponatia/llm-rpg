# Session & Turn Persistence Schema

Status: Draft (Sprint 2 stretch implemented: read & write stubs; full evolution planned Sprint 3)

## Overview

Sessions group ordered chat turns (user + assistant) and optionally associate with a Character for personalized context and relationship evolution.

## Neo4j Nodes

* Session: `{ id, created_at (ms), last_updated (ms) }`
* Turn: `{ id, role, content, timestamp (Neo4j datetime), tokens, session_id, character_id }`
* Character: existing domain node (referenced by id)

## Relationships

* `(Turn)-[:IN_SESSION]->(Session)` – membership & ordering by `Turn.timestamp`
* `(Character)-[:PARTICIPATED_IN]->(Turn)` – optional when a character is bound to the session (future: store role / perspective)

## Query Patterns

* Recent turns for a session: match turns by session ordered descending timestamp with limit.
* Character aggregated history: already exposed via `/api/chat/character-history/:characterId`.

## API Endpoints (Current)

* `POST /api/chat/message` – create two turns (user + assistant) and (optionally) persist if `PERSIST_CHAT_TURNS=true`.
* `GET /api/chat/history/:sessionId` – legacy in-memory + memory subsystem history (MCA path).
* `GET /api/chat/session/:id` – direct graph lookup of recent persisted turns (50 max) (new).

## Flags

* `ENABLE_CHAT_API` – master gate for chat endpoints.
* `PERSIST_CHAT_TURNS` – when true, non-echo chat flow stores turns in Neo4j; when false, session remains in-memory only.

## Future Extensions (Sprint 3+)

* Relationship edges with affection / trust weights updated per turn.
* Session summary nodes for faster retrieval (materialized).
* Archival / TTL strategy for long-lived sessions.
* Pagination & stream APIs (WebSocket) for history replay.

