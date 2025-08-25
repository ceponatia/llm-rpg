import { FastifyInstance } from 'fastify';
import { chatRoutes } from './chat.js';
import { memoryRoutes } from './memory.js';
import { configRoutes } from './config.js';
import { websocketRoutes } from './websocket.js';
import { charactersRoutes } from './characters.js';
import { publicRoutes } from './public.js';
import { eventsRoutes } from './events.js';

export async function setupRoutes(fastify: FastifyInstance): Promise<void> {
  // API routes
  await fastify.register(chatRoutes, { prefix: '/api/chat' });
  await fastify.register(memoryRoutes, { prefix: '/api/memory' });
  await fastify.register(configRoutes, { prefix: '/api/config' });
  await fastify.register(charactersRoutes, { prefix: '/api/characters' });
  await fastify.register(publicRoutes); // no prefix contains own paths
  await fastify.register(eventsRoutes); // events endpoint
  
  // WebSocket routes
  await fastify.register(websocketRoutes, { prefix: '/ws' });
}