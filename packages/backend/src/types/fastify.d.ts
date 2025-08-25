import { DatabaseManager } from '../database/manager.js';
import { MemoryController } from '@rpg/mca';

declare module 'fastify' {
  interface FastifyInstance {
    db: DatabaseManager;
    mca: MemoryController;
    websocketClients?: Set<WebSocket>;
    broadcastToClients?: (data: unknown) => void;
  }
}