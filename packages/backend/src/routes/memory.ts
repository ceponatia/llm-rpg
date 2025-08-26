import type { FastifyInstance } from 'fastify';

export function memoryRoutes(fastify: FastifyInstance): void {
  // Helper guard
  const ensureMCA = (): void => {
    const maybe = (fastify as { mca?: unknown }).mca;
    if (maybe == null) { // runtime guard even if type says present
      throw new Error('MCA not available');
    }
  };
  
  // Pre-handler for admin-only endpoints
  const adminPreHandler = (request: unknown, reply: unknown, done: (err?: Error) => void): void => {
    const maybeVerify = (fastify as Partial<FastifyInstance> & { verifyAdmin?: (req: unknown, rep: unknown) => unknown }).verifyAdmin;
    if (typeof maybeVerify === 'function') {
      try {
        const result = maybeVerify(request, reply);
        if (result instanceof Promise) {
          void result.then(() => done()).catch(err => done(err instanceof Error ? err : new Error(String(err))));
          return;
        }
      } catch (err) {
        done(err instanceof Error ? err : new Error(String(err)));
        return;
      }
    }
    done();
  };

  // Inspect current memory state
  fastify.get('/inspect', { preHandler: adminPreHandler }, async (_request, reply): Promise<unknown> => {
    try {
      ensureMCA();
      const memoryState = await fastify.mca.inspectMemoryState();
      return memoryState;
    } catch (error: unknown) {
  fastify.log.error(error);
  reply.status(500).send({
        error: 'Failed to inspect memory',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return undefined;
    }
  });

  // Search memory layers
  fastify.post('/search', { preHandler: adminPreHandler }, async (request, reply): Promise<unknown> => {
    try {
      ensureMCA();
      const { query, limit = 10 } = request.body as { query: string; limit?: number };
      const results = await fastify.mca.searchMemory(query, { limit });
      return results;
    } catch (error: unknown) {
  fastify.log.error(error);
  reply.status(500).send({ error: 'Memory search failed', message: error instanceof Error ? error.message : 'Unknown error' });
      return undefined;
    }
  });

  // Get character emotional states
  fastify.get('/characters', { preHandler: adminPreHandler }, async (_request, reply): Promise<unknown> => {
    try {
      ensureMCA();
      const characters = await fastify.mca.getAllCharacters();
      return { characters };
    } catch (error: unknown) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch characters',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return undefined;
    }
  });

  // Get character emotional history
  fastify.get('/characters/:characterId/emotions', { preHandler: adminPreHandler }, async (request, reply): Promise<unknown> => {
    try {
      ensureMCA();
      const { characterId } = request.params as { characterId: string };
      // Current API does not accept character filter; returns global history
      const emotionalHistory = await fastify.mca.getCharacterEmotionalHistory();
      return { character_id: characterId, emotional_history: emotionalHistory };
    } catch (error: unknown) {
  fastify.log.error(error);
  reply.status(500).send({ error: 'Failed to fetch emotional history', message: error instanceof Error ? error.message : 'Unknown error' });
      return undefined;
    }
  });

  // Get fact versions
  fastify.get<{ Params: { factId: string } }>('/facts/:factId/versions', async (request, reply): Promise<unknown> => {
    try {
      ensureMCA();
      const { factId } = request.params;
      const fact = await fastify.mca.getFactWithHistory(factId);
      
  if (fact == null) {
        return reply.status(404).send({ error: 'Fact not found' });
      }
      
      return { fact };
    } catch (error: unknown) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch fact versions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return undefined;
    }
  });

  // Manual memory management
  fastify.post('/prune', { preHandler: adminPreHandler }, async (_request, reply): Promise<unknown> => {
    try {
      ensureMCA();
      const pruningResult = await fastify.mca.pruneMemory();
      return { 
        message: 'Memory pruning completed',
        results: pruningResult
      };
    } catch (error: unknown) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Memory pruning failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return undefined;
    }
  });

  // Get memory statistics
  fastify.get('/stats', { preHandler: adminPreHandler }, async (_request, reply): Promise<unknown> => {
    try {
      ensureMCA();
      const stats = await fastify.mca.getMemoryStatistics();
      return stats;
    } catch (error: unknown) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch memory statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return undefined;
    }
  });
}