# Neo4j Usage

This document explains what Neo4j does in this codebase, how we model data, and how to run or evolve the graph layer.

## 1. Purpose (Why Neo4j Here)

Neo4j stores *relational narrative state* that benefits from graph traversal:

* Characters, their traits, relationships, and evolving connections.
* Sessions (game/story segments) and Turns (chronological exchanges).
* Facts / Memories derived from player + NPC interactions.
* Topical links between memories (themes, locations, entities, quests).
* Provenance (which turn produced which fact; which characters were involved).

This enables:

* Efficient retrieval of the most contextually relevant memories for LLM prompts (relationship weighted, recency, topical similarity).
* Rich querying for analytics (e.g., “What unresolved quest threads involve Character A within 3 relationship hops?”).
* Future intent / narrative consistency checks (cycles, dangling arcs, contradiction detection).

FAISS (vector index) handles semantic similarity; Neo4j stores structured narrative linkage and provenance. The retrieval layer can combine both: (1) candidate facts via vector similarity, (2) expand via graph (neighbors / quest chains).

## 2. Scope (Current & Near-Term)

Current (implemented or partially):

* Nodes: Character, Session, Turn, Fact (Memory).
* Relationships: PARTICIPATED_IN (Character→Turn), IN_SESSION (Turn→Session), PRODUCED (Turn→Fact), RELATED_TO / REFERS_TO (Fact→Fact or Fact→Character).

Planned:

* Quest / Objective nodes.
* Location nodes for scene continuity.
* Tag / Topic nodes for clustering.

## 3. Why Graph vs Relational

* Variable, evolving relationships (N:N) without predefined join explosion.
* Path / neighborhood queries (shortest path, bounded depth expansion).
* Natural modeling for provenance chaining (Turn -> Fact -> Derived Fact).
* Easier to express fuzzy retrieval augmentation (expand 2 hops, filter by recency).

## 4. Data Model (Draft)

| Label     | Key Properties                                     | Notes             |
| --------- | -------------------------------------------------- | ----------------- |
| Character | id (string), name, archetype, createdAt            | Stable identity   |
| Session   | id, title, startedAt, endedAt?                     | Grouping of turns |
| Turn      | id, index (int), timestamp, role, text             | role = player     |
| Fact      | id, text, importance (1–5), createdAt, decayScore | Derived memory    |

### Relationships

| Type            | From -> To        | Purpose                       |
| --------------- | ----------------- | ----------------------------- |
| PARTICIPATED_IN | Character -> Turn | Who spoke / acted             |
| IN_SESSION      | Turn -> Session   | Turn grouping                 |
| PRODUCED        | Turn -> Fact      | Fact provenance               |
| RELATED_TO      | Fact -> Fact      | Semantic/causal linkage       |
| REFERS_TO       | Fact -> Character | Entity grounding              |
| CONTINUES       | Fact -> Fact      | Narrative thread continuation |

## 5. Example Cypher Snippets

Fetch recent high-signal facts for a session (simplified):

```cypher
MATCH (s:Session {id: $sessionId})<-[:IN_SESSION]-(t:Turn)-[:PRODUCED]->(f:Fact)
WHERE t.index > $minTurnIndex
WITH f
ORDER BY f.importance DESC, f.createdAt DESC
LIMIT $limit
RETURN f
```

Expand related facts (1-hop) for diversification:

```cypher
UNWIND $factIds AS fid
MATCH (f:Fact {id: fid})-[:RELATED_TO]->(r:Fact)
RETURN fid AS sourceId, collect(r.id) AS related
```

Insert a new turn and produced facts (example pattern):

```cypher
MERGE (sess:Session {id: $session.id})
MERGE (turn:Turn {id: $turn.id})
  ON CREATE SET turn.index = $turn.index,
                turn.timestamp = datetime($turn.timestamp),
                turn.role = $turn.role,
                turn.text = $turn.text
MERGE (turn)-[:IN_SESSION]->(sess)
WITH turn
UNWIND $facts AS f
  MERGE (fact:Fact {id: f.id})
    ON CREATE SET fact.text = f.text,
                  fact.importance = f.importance,
                  fact.createdAt = datetime(f.createdAt),
                  fact.decayScore = f.decayScore
  MERGE (turn)-[:PRODUCED]->(fact)
RETURN turn.id AS turnId, count(*) AS factCount
```

## 6. Backend Integration Points

(Names may differ slightly—adjust when refactoring.)

* Graph initialization: creates Neo4j driver at startup.
* Memory extraction pipeline: after a Turn is generated, salient facts are distilled and persisted with PRODUCED.
* Context assembly: given active Session + character set, selects candidate Facts via (a) recency/importance sort, (b) relationship expansion.
* (Planned) Contradiction check: search for conflicting facts (e.g., same subject with opposing attributes).

## 7. Environment Variables

| Variable             | Description                             | Example               |
| -------------------- | --------------------------------------- | --------------------- |
| NEO4J_URI            | Bolt URI                                | bolt://localhost:7687 |
| NEO4J_USERNAME       | Database user                           | neo4j                 |
| NEO4J_PASSWORD       | Password                                | devpassword           |
| NEO4J_DATABASE       | (Optional) Database name                | neo4j                 |
| NEO4J_OPTIONAL       | If "true", do not crash on connect fail | true                  |
| NEO4J_MAX_RETRIES    | Retry attempts before giving up         | 5                     |
| NEO4J_RETRY_DELAY_MS | Base delay (ms) for backoff             | 1000                  |

## 8. Optional / Degraded Mode (Recommended)

If `NEO4J_OPTIONAL=true` and connection fails:

* Log a WARN (once).
* Set internal `graphEnabled=false`.
* Stub graph queries to return empty arrays or no-op writes.
* Health endpoint reports `neo4j:false` but overall still 200 so the dev stack boots without local Neo4j.

## 9. Local Development

1. Run a container:

  ```bash
  docker run -d --name neo4j \
    -p 7474:7474 -p 7687:7687 \
    -e NEO4J_AUTH=neo4j/devpassword \
    neo4j:5.23
  ```

1. Export env vars (or use `.env` in backend package).
1. Start dev stack (`pnpm dev:all`).
1. Browse <http://localhost:7474> (optional) and run diagnostic:

  ```cypher
  MATCH (n) RETURN count(n);
  ```

## 10. Minimal Driver Usage (Example Code)

(Adjust to match actual file names if different.)

```ts
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
);

export async function runQuery<T = unknown>(cypher: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' });
  try {
    const res = await session.run(cypher, params);
    return res.records.map(r => r.toObject() as T);
  } finally {
    await session.close();
  }
}
```

## 11. Schema Evolution

We use a *migrateless* approach for now (dynamic MERGE). When relationships / labels change substantially:

* Create a migration script (e.g., `scripts/graph-migrations/2025-09-add-quest-label.ts`).
* Idempotent Cypher (repeat safe).
* Add a root script `pnpm backend:migrate:graph` to run them in order.

## 12. Performance Considerations

* Add indexes on high-selectivity properties (e.g., `:Fact(id)`, `:Turn(id)`, `:Session(id)`, `:Character(id)`).

  ```cypher
  CREATE INDEX fact_id IF NOT EXISTS FOR (f:Fact) ON (f.id);
  ```
* For recency queries, consider storing numeric epoch (`createdAtEpoch`) to sort faster.
* Batch writes: combine multiple MERGE statements in a single transaction per turn.
* Use `EXPLAIN` / `PROFILE` for slow queries (watch for accidental Cartesian products).

## 13. Future Enhancements

| Goal                     | Approach                                                                        |
| ------------------------ | ------------------------------------------------------------------------------- |
| Contradiction detection  | Pattern search for opposing attributes on same Character via property tagging   |
| Thread summarization     | Collapse chains of CONTINUES into a synthesized summary Fact                    |
| Aging / decay            | Periodic job lowering `decayScore` and pruning low-value Facts past threshold |
| Hybrid retrieval ranking | Combine vector similarity score + graph centrality (degree / PageRank)          |

## 14. Troubleshooting

| Symptom                            | Likely Cause                       | Action                                                              |
| ---------------------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| Driver connect timeout             | Wrong URI / port closed            | Verify container running,`docker logs neo4j`                      |
| Auth error                         | Wrong creds                        | Reset with `docker exec neo4j cypher-shell` or recreate container |
| Memory / OOM on large fact growth  | Unbounded graph                    | Introduce pruning + summarization                                   |
| Slow related fact expansion        | Missing indexes or deep traversals | Add indexes, cap traversal depth                                    |
| Dev startup crash (before changes) | Hard dependency on driver          | Enable optional mode / retries                                      |

## 15. Action Items (If Not Yet Implemented)

* [ ] Add optional mode (env flag + stubs).
* [ ] Add basic indexes (id fields).
* [ ] Add retrieval service combining vector + graph hops.
* [ ] Add migration scaffold folder.
* [ ] Add test harness using an ephemeral Neo4j container or test double.
* [ ] Add health sub-endpoint `/health/neo4j`.

(Once each is completed, check them off.)

---

Questions or adjustments: update this doc and keep it aligned with actual code
