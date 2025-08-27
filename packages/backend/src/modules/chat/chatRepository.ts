import type { DatabaseManager } from '../../database/manager.js';
import type { ChatTurn } from '@rpg/types';

export interface PersistArgs {
  sessionId: string;
  userTurn: ChatTurn & { tokens?: number; character_id?: string | null };
  assistantTurn: ChatTurn & { tokens?: number; character_id?: string | null };
  character_id?: string;
  useCharacter: boolean;
}

export class ChatRepository {
  constructor(private readonly db: DatabaseManager) {}

  async persistTurns(args: PersistArgs): Promise<void> {
    const { sessionId, userTurn, assistantTurn, useCharacter, character_id } = args;
    const neo4jSession = this.db.getNeo4jSession();
    try {
      await neo4jSession.executeWrite(async tx => {
        await tx.run(
          'MERGE (s:Session {id: $sessionId}) ON CREATE SET s.created_at = timestamp() SET s.last_updated = timestamp()',
          { sessionId }
        );
        // User turn
        await tx.run(
          `MERGE (t:Turn {id: $id})
           ON CREATE SET t.role = $role, t.content = $content, t.timestamp = datetime($timestamp), t.tokens = $tokens, t.session_id = $sessionId, t.character_id = $characterId
           ON MATCH SET t.last_seen = timestamp()
           WITH t MATCH (s:Session {id: $sessionId}) MERGE (t)-[:IN_SESSION]->(s)`,
          { id: userTurn.id, role: userTurn.role, content: userTurn.content, timestamp: userTurn.timestamp, tokens: userTurn.tokens ?? 0, sessionId, characterId: userTurn.character_id ?? null }
        );
        // Assistant turn
        await tx.run(
          `MERGE (t:Turn {id: $id})
           ON CREATE SET t.role = $role, t.content = $content, t.timestamp = datetime($timestamp), t.tokens = $tokens, t.session_id = $sessionId, t.character_id = $characterId
           ON MATCH SET t.last_seen = timestamp()
           WITH t MATCH (s:Session {id: $sessionId}) MERGE (t)-[:IN_SESSION]->(s)`,
          { id: assistantTurn.id, role: assistantTurn.role, content: assistantTurn.content, timestamp: assistantTurn.timestamp, tokens: assistantTurn.tokens ?? 0, sessionId, characterId: assistantTurn.character_id ?? null }
        );
        if (useCharacter && character_id) {
          await tx.run('MATCH (c:Character {id: $cid}) MATCH (t:Turn {id: $tid}) MERGE (c)-[:PARTICIPATED_IN]->(t)', { cid: character_id, tid: assistantTurn.id });
          await tx.run('MATCH (c:Character {id: $cid}) MATCH (t:Turn {id: $tid}) MERGE (c)-[:PARTICIPATED_IN]->(t)', { cid: character_id, tid: userTurn.id });
        }
      });
    } finally {
      await neo4jSession.close();
    }
  }

  async getRecentTurns(sessionId: string, limit = 50): Promise<ChatTurn[]> {
    const neo4jSession = this.db.getNeo4jSession();
    try {
      const result = await neo4jSession.executeRead(tx => tx.run(
        `MATCH (s:Session {id: $sessionId})<-[:IN_SESSION]-(t:Turn)
         RETURN t { .id, .role, .content, timestamp: toString(t.timestamp), .tokens, character_id: t.character_id, session_id: s.id } AS turn
         ORDER BY t.timestamp DESC
         LIMIT $limit`,
        { sessionId, limit }
      ));
      // neo4j driver returns records with get method; fake session in tests will adapt
      return (result as any).records.map((r: any) => r.get('turn')) as ChatTurn[];
    } finally {
      await neo4jSession.close();
    }
  }
}
