import type { 
  MCAConfig, 
  WorkingMemoryTurn, 
  WorkingMemory,
  L1RetrievalResult,
  MemoryRetrievalQuery,
  ChatSession
} from '@rpg/types';

/**
 * L1 Working Memory - Ephemeral session-based buffer
 * Holds the last N conversational turns for immediate context
 */
export class L1WorkingMemory {
  private readonly sessions = new Map<string, WorkingMemory>();

  public constructor(private readonly config: MCAConfig) {}

  /**
   * Add a new turn to the working memory buffer
   */
  public addTurn(sessionId: string, turn: WorkingMemoryTurn): void {
    let session = this.sessions.get(sessionId);
    
    if (session === undefined) {
      session = {
        turns: [],
        max_turns: this.config.l1_max_turns,
        total_tokens: 0
      };
      this.sessions.set(sessionId, session);
    }

    // Add the new turn
    session.turns.push(turn);
    session.total_tokens += turn.tokens;

    // Enforce max turns limit (FIFO)
    while (session.turns.length > session.max_turns) {
      const removedTurn = session.turns.shift();
      if (removedTurn !== undefined) {
        session.total_tokens -= removedTurn.tokens;
      }
    }

    // Enforce max tokens limit
    while (session.total_tokens > this.config.l1_max_tokens && session.turns.length > 1) {
      const removedTurn = session.turns.shift();
      if (removedTurn !== undefined) {
        session.total_tokens -= removedTurn.tokens;
      }
    }
  }

  /**
   * Retrieve relevant turns from working memory
   */
  public async retrieve(query: MemoryRetrievalQuery): Promise<L1RetrievalResult> {
    await Promise.resolve();
    const session = this.sessions.get(query.session_id);
    
    if (session === undefined || session.turns.length === 0) {
      return {
        turns: [],
        relevance_score: 0,
        token_count: 0
      };
    }

    // For working memory, we typically return all recent turns
    // In a more sophisticated implementation, we might filter by relevance
    const relevantTurns = session.turns.slice(); // Copy all turns
    
    // Calculate simple relevance score based on recency
    const relevanceScore = this.calculateRelevanceScore(relevantTurns, query.query_text);
    
    return {
      turns: relevantTurns,
      relevance_score: relevanceScore,
      token_count: session.total_tokens
    };
  }

  /**
   * Calculate relevance score for working memory turns
   */
  private calculateRelevanceScore(turns: Array<WorkingMemoryTurn>, query: string): number {
    if (turns.length === 0) {return 0;}

    // Simple keyword matching for now
    const queryWords = query.toLowerCase().split(/\s+/);
    let totalRelevance = 0;

    turns.forEach((turn, index) => {
      const content = turn.content.toLowerCase();
      let turnRelevance = 0;

      // Check for keyword matches
      queryWords.forEach(word => {
        if (content.includes(word)) {
          turnRelevance += 1;
        }
      });

      // Apply recency boost (more recent turns are more relevant)
      const recencyBoost = (index + 1) / turns.length;
      turnRelevance *= recencyBoost;
      
      totalRelevance += turnRelevance;
    });

    // Normalize by number of turns and query words
    return Math.min(1.0, totalRelevance / (turns.length * queryWords.length));
  }

  /**
   * Get chat history for a session
   */
  public getHistory(sessionId: string): Array<WorkingMemoryTurn> {
    const session = this.sessions.get(sessionId);
    return session !== undefined ? [...session.turns] : [];
  }

  /**
   * Get all active sessions
   */
  public getAllSessions(): Array<ChatSession> {
    const sessions: Array<ChatSession> = [];
    
    for (const [sessionId, memory] of this.sessions) {
  if (memory.turns.length > 0) {
        const firstTurn = memory.turns[0];
        const lastTurn = memory.turns[memory.turns.length - 1];
        
        sessions.push({
          id: sessionId,
          messages: memory.turns.map(turn => ({
            id: turn.id,
            role: turn.role,
            content: turn.content,
            timestamp: turn.timestamp
          })),
          created_at: firstTurn.timestamp,
          last_updated: lastTurn.timestamp,
          total_tokens: memory.total_tokens
        });
      }
    }
    
    return sessions.sort((a, b) => 
      new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
    );
  }

  /**
   * Clear old sessions to free memory
   */
  public clearOldSessions(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const sessionsToDelete: Array<string> = [];

    for (const [sessionId, memory] of this.sessions) {
      if (memory.turns.length === 0) {
        sessionsToDelete.push(sessionId);
        continue;
      }

      const lastTurn = memory.turns[memory.turns.length - 1];
      const lastActivity = new Date(lastTurn.timestamp).getTime();
      
      if (now - lastActivity > maxAge) {
        sessionsToDelete.push(sessionId);
      }
    }

    sessionsToDelete.forEach(sessionId => {
      this.sessions.delete(sessionId);
    });
  }

  /**
   * Inspect current state
   */
  public async inspect(): Promise<unknown> {
    await Promise.resolve();
    const sessionData: Array<{ session_id: string; turn_count: number; total_tokens: number; recent_activity: string | null; }> = [];
    
    for (const [sessionId, memory] of this.sessions) {
      sessionData.push({
        session_id: sessionId,
        turn_count: memory.turns.length,
        total_tokens: memory.total_tokens,
        recent_activity: memory.turns.length > 0 ? 
          memory.turns[memory.turns.length - 1].timestamp : null
      });
    }

    return {
      total_sessions: this.sessions.size,
      active_sessions: sessionData,
      config: {
        max_turns: this.config.l1_max_turns,
        max_tokens: this.config.l1_max_tokens
      }
    };
  }

  /**
   * Get statistics
   */
  public async getStatistics(): Promise<{ total_sessions: number; total_turns: number; total_tokens: number; avg_turns_per_session: number; avg_tokens_per_session: number }> {
    await Promise.resolve();
    let totalTurns = 0;
    let totalTokens = 0;
    
    for (const memory of this.sessions.values()) {
      totalTurns += memory.turns.length;
      totalTokens += memory.total_tokens;
    }

    return {
      total_sessions: this.sessions.size,
      total_turns: totalTurns,
      total_tokens: totalTokens,
  avg_turns_per_session: this.sessions.size > 0 ? totalTurns / this.sessions.size : 0,
  avg_tokens_per_session: this.sessions.size > 0 ? totalTokens / this.sessions.size : 0
    };
  }
}