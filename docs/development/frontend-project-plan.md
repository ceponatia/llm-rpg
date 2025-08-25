# Frontend Romantic Roleplaying Chatbot – Project Plan

## Vision

Deliver a privacy‑respecting, locally powered romantic role‑play chatbot leveraging a Mistral Instruct model via Ollama with strong emphasis on consent, emotional safety, and configurable persona-driven narrative immersion.

## Guiding Principles

1. Safety & Boundaries First – Always maintain PG‑13, decline explicit sexual content.
2. Local-First – Run model locally; no cloud calls by default.
3. Modular Domain – Clear separation between UI, domain (persona, memory), and infra (LLM client, safety layer).
4. Progressive Enhancement – Core chat works without advanced persona editing; features add gracefully.
5. Observability for Dev – Structured logging in dev console (timers, token counts) behind a feature flag.

## Integration with `ceponatia/cas` Monorepo

Assumptions (repository structure not locally vendored yet):

* We will consume exported abstractions (e.g., character/state utilities) as a dependency or via selective code import (respecting original license) without modifying upstream.
* Create an adapter layer `src/services/casAdapter.ts` that maps our domain models (Persona, MemorySnapshot, ConversationTurn) to CAS equivalents.
* Any multi-agent orchestration or scene management will defer to CAS patterns once integrated; initial release mocks minimal behavior locally.
* If CAS provides memory summarization utilities, plug them behind a feature flag to avoid early complexity.

Action Items:

1. Evaluate CAS API surface (once accessible) and document required subset.
2. Implement adapter interfaces with clear TODO markers where deeper CAS features could slot in.
3. Add contract tests to ensure adapter invariants (id mapping, role translation) remain stable.

## High-Level Architecture

* React + Vite (TypeScript) SPA
* Zustand for state; slices: chat, settings, persona
* Service Layer: `llmClient` (fetch + streaming), `orchestrator` (turn mgmt), `safetyFilter`
* Domain Models: Persona, MemorySnapshot, ConversationTurn
* Validation: Zod
* UI: Tailwind + Radix UI + small utility components

## Key User Flows

1. Start Chat: User enters message -> safety filter -> orchestrator -> streaming response.
2. Edit Persona: Adjust name, traits, relationship archetype -> updates system prompt.
3. Adjust Settings: Temperature, top_p, max tokens, enable/disable safety debug.
4. Cancel Response: Abort streaming mid-turn.
5. Export/Import: Save conversation + persona to JSON file and restore later.

## Milestones & Deliverables

### M1: Scaffold & Foundation (Week 1)

* Vite + TS project, Tailwind configured
* ESLint + Prettier + strict TS
* Basic layout (header, chat area, input)
* Empty orchestrator & llm client stubs

### M2: LLM Integration & Streaming (Week 2)

* Implement `llmClient.streamChat()` with AbortController
* Token streaming parser for Ollama response (JSON lines or chunked text)
* Basic chat store + append turns
* Vitest: streaming parser + client error handling tests

### M3: Domain Models & Persona (Week 3)

* Zod schemas for Persona, ConversationTurn, Settings
* Persona editor panel (name, tone, archetype, boundaries)
* System prompt assembly function

### M4: Safety & Boundaries (Week 4)

* Safety filter (regex + heuristic categories)
* Boundary response templates
* Tests for filter classification

### M5: UX Polish & Persistence (Week 5)

* LocalStorage persistence for settings + persona
* Scroll management & streaming UI polish
* Loading & abort UX
* Accessibility pass (ARIA roles, focus outlines)

### M6: Export/Import & Docs (Week 6)

* JSON export/import
* README usage guide + safety statement
* Performance test (token throughput measurement script)

### M7: Optional Enhancements

* Multi-character scene orchestrator
* Memory summarization (periodic context condensation)
* Offline vector store for semantic memory (lite)

## Risks & Mitigations

* Model Output Drifting into Explicit Content: Safety filter + reinforcement via system prompt + user reminder.
* Streaming Performance Jank: Use requestAnimationFrame batching for UI updates.
* Unbounded Context Growth: Implement soft window (last N turns) + summarization hook placeholder.
* Persona Overfitting Prompt Length: Provide prompt length counter & truncate gracefully.

## Non-Goals (Initial Release)

* User authentication
* Server-side persistence
* Payment/subscription model
* Mobile native packages (web responsive only for now)

## Technical Specs (Select)

* Ollama Chat Endpoint: POST /api/chat { model, messages, options }
* Retry Policy: up to 2 retries on network errors (exponential backoff 250ms * 2^n + jitter)
* Safety Filter Return Shape: { blocked: boolean; reason?: string; sanitizedInput: string }
* Orchestrator Generator Yield: { partial?: string; final?: ConversationTurn; tokens?: number }

## Testing Strategy

* Unit: llmClient, safetyFilter, promptBuilder, retry
* Component: ChatWindow streaming, PersonaEditor validation errors
* Integration (optional): Simulated conversation with mocked Ollama responses

## Metrics (Dev Only)

* Tokens/sec streaming
* Average latency to first token
* Turn completion time

## Tooling & Scripts (Planned)

* dev: Vite server
* test: Vitest
* lint: ESLint + Prettier
* typecheck: tsc --noEmit
* build: vite build

## Open Questions

* Should memory summarization be synchronous or background (Web Worker)? (Defer)
* Add optional encryption for exported logs? (Defer)

## Acceptance Criteria for Initial Release

* User can conduct multi-turn chat with streamed assistant replies
* Persona customization influences system prompt content
* Safety filter blocks explicit sexual content reliably (test fixtures)
* Abort mid-response works without leftover hanging fetch
* All tests pass & no TypeScript errors

---

This plan guides implementation; update iteratively as architecture evolves.
