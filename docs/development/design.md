# Project design overview

Status: Living document (high‑level architecture + current implementation status)

## Purpose

Central reference for core architectural domains: authentication, user sessions, multi‑layer memory, chat persistence, feature flags, and data/storage services. Acts as an onboarding map + gap tracker.

## High‑level architecture

```text
Browser (Frontend SPA)
  → Backend API (Fastify) + WebSocket
      → Memory Controller Agent (MCA) layers
          L1: Working / recent turns (in‑memory bounded)
          L2: Graph / episodic (Neo4j)      *planned / partial*
          L3: Semantic / vector (FAISS)     *implemented*
      → Ollama (LLM inference)
      → Neo4j (graph persistence)
      → (Future) Redis / relational store for auth & session ownership
```

## Storage & data layers needed

### 1. Authentication & user accounts (NOT IMPLEMENTED)

* Required entities: `User { id, username/email, password_hash (or external IdP sub), roles[] }`
* Storage options: Postgres (preferred) or lightweight SQLite for dev; alternative: external IdP (Auth0/Cognito) + minimal local mapping table.
* Needed endpoints (future):
  * `POST /api/auth/register`
  * `POST /api/auth/login` (issue JWT / session cookie)
  * `POST /api/auth/logout`
  * `GET /api/auth/me`
* Tokens / sessions: HTTP-only cookie (JWT) or opaque session id stored in Redis.

### 2. User session & chat persistence (PARTIAL)

* Current: In‑memory session store (bounded 50 turns) per runtime; optional Neo4j turn/session write scaffolding (flag gated, default off).
* Needed to persist between logins:
  * Add `user_id` to `Session` node (and create User node or property once auth exists).
  * Endpoint to list user sessions: `GET /api/chat/sessions` (filter by user).
  * Rehydrate: On first message for existing session, load prior turns from Neo4j into in‑memory store.
  * Pagination & ordering (cursor by timestamp or turn id) for long histories.
  * Soft delete / archival policy.

### 3. Memory system (MULTI‑LAYER)

| Layer | Purpose | Current State | Backing Store |
|-------|---------|---------------|---------------|
| L1 Working | Immediate recent turns context | Implemented (in‑memory bounded store) | Memory (process) |
| L2 Episodic / graph | Structured events, relationships, character emotional state | Partial (Neo4j schema for Session/Turn; character linkage; facts planned) | Neo4j |
| L3 Semantic / vector | Long‑term semantic recall & similarity search | Implemented (VectorIndex mock / FAISS integration) | Local FAISS files |

Planned memory persistence pipeline:

1. After assistant turn, extract salient facts / emotional changes.
1. Persist facts as graph nodes + relationships (affection, significance, temporal ordering).
1. Upsert semantic embeddings of facts & summary chunks into vector index.
1. Periodic pruning / summarization to control graph and vector growth.

### 4. Vector index (IMPLEMENTED BASIC)

* Local FAISS index initialized (dimension from config).
* TODO: Persistence (dump/load) on process start & graceful shutdown.
* TODO: Rebuild guard (already partially enforced via dimension check).

### 5. Graph database (Neo4j) (PARTIAL)

* Existing persisted: Session + Turn (+ optional Character participation edges).
* Missing: Fact / Memory nodes, relationship weights (affection, trust), decay metadata.
* Required future indices / constraints: `Session.id`, `Turn.id`, `Character.id`, `Fact.id`.

### 6. Feature flags & config (IMPLEMENTED)

* Central `config/flags.ts` with defaults, logging, refresh, required assertion helper.
* Flags of note: `ENABLE_CHAT_API`, `CHAT_ECHO_MODE`, `SERVE_ADMIN_STATIC`, `ADMIN_PUBLIC`, `NEO4J_OPTIONAL`, `PERSIST_CHAT_TURNS`.

### 7. Admin / observability (PARTIAL)

* Embedded admin dashboard (served when `SERVE_ADMIN_STATIC=true`).
* Needs: session list view, memory inspection panels, flag diff display, health & metrics endpoint.

## Current implementation snapshot

| Area | Status | Notes / Gaps |
|------|--------|-------------|
| Auth | Missing | No user model, no auth middleware, no protected routes. |
| Chat route decomposition | Complete | Service, repository, session store extracted; echo + basic flow. |
| Turn persistence | Scaffolding | Writes gated by `PERSIST_CHAT_TURNS` (default false); read endpoint `/api/chat/session/:id`. |
| Session rehydration | Missing | No auto-load from Neo4j on resume. |
| List sessions | Missing | No endpoint to enumerate user sessions. |
| Memory L1 | Complete | Bounded in-memory store (50 turns). |
| Memory L2 | Partial | Only sessions + turns; no fact extraction nodes yet. |
| Memory L3 | Partial/Working | Vector index abstraction + mock; persistence of embeddings not finalized. |
| Emotional state tracking | Partial | Ingestion path returns emotional changes; persistence not implemented. |
| Fact extraction | Planned | Placeholder ingestion return; no graph nodes yet. |
| Flags infra | Complete | Logging of non-default, refresh for tests, required assertion helper. |
| Admin dashboard | Partial | Served statically; limited feature visibility. |
| Tests (chat & flags) | Updated | Refreshable flags solved isolation; repository read tested. |

## Key gaps to close for true persistent user sessions

1. Implement auth & user identity propagation (request decorator with `user.id`).
2. Add `user_id` (and optional `character_id`) to Session node; enforce ownership in queries.
3. Add `GET /api/chat/sessions` (filter by user, include last updated + turn count).
4. Rehydrate session in memory store on first POST after cold start.
5. Enable `PERSIST_CHAT_TURNS` by default once stable; add migration or backfill if needed.
6. Add pagination parameters to history/session endpoints.
7. Persist fact / relationship nodes; implement retrieval pipeline feeding prompt builder.

## Proposed incremental roadmap

1. Auth foundation (User model + login/register + JWT middleware).
2. Session ownership & listing endpoint.
3. Enable persistence flag in staging; implement rehydration.
4. Fact extraction + graph writes (affection / relationship edges with initial weights).
5. Vector index persistence & background maintenance (compaction / rebuild commands).
6. Admin enhancements: session browser, memory layer stats, flag dashboard.
7. Performance & cost pass: token accounting, selective memory retrieval, pruning.

## Open design questions

* Should session ids be user-scoped UUIDs or globally unique + ownership property? (Current: global id.)
* Will we support multi-character sessions or one character per session? (Current: optional character suffix pattern.)
* How to prune / summarize long-running sessions—time-based, turn count, or significance-driven summary nodes?
* Embedding model / vector dimension stability guarantee needed? Fallback migration strategy?

## References

* `docs/architecture/sessions.md` – Session & Turn schema.
* `docs/development/sprint2.md` – Sprint goals & outcomes.
* `packages/backend/src/modules/chat/` – Chat service & repository.
* `packages/backend/src/config/flags.ts` – Feature flags implementation.
* `packages/mca/` – Memory Controller Agent layers.

---
(Keep this document concise; link out to deeper specs rather than duplicating them.)
