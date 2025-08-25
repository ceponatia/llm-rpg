import { FastifyInstance } from 'fastify';

export async function publicRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/memory/summary', async () => {
    const stats = await fastify.db.getHighLevelStats();
    return stats;
  });
}
