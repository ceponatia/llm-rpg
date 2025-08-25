import type { FastifyInstance } from 'fastify';
import { CharacterRegistry } from '../services/character-registry.js';

export function charactersRoutes(fastify: FastifyInstance): void {
  const registry = CharacterRegistry.getInstance();

  fastify.get('/', () => {
    const list = registry.list().map(c => ({
      id: c.id,
      name: c.name,
      avatar_url: c.avatar_url,
      description: c.description
    }));
    return { characters: list };
  });

  fastify.get('/:id', (request, reply) => {
    const { id } = request.params as { id: string };
    const c = registry.get(id);
    if (c === undefined) {
      reply.code(404);
      return { error: 'Character not found' };
    }
    return c;
  });
}
