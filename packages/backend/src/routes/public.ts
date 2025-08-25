import type { FastifyInstance } from 'fastify';

export function publicRoutes(fastify: FastifyInstance): void {
  fastify.get('/api/memory/summary', async () => fastify.db.getHighLevelStats());
}
