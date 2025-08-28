import Fastify, { type FastifyRequest, type FastifyReply } from 'fastify';
import { logger } from '../../utils/src/logger.js';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config } from './config.js';
import { setupRoutes } from './routes/index.js';
import { DatabaseManager } from './database/manager.js';
import { CharacterRegistry } from './services/character-registry.js';
import { setupStaticAdmin } from './staticAdmin.js';
import { FLAGS } from './config/flags.js';

interface MemoryControllerConfig {
  l1_max_turns: number;
  l1_max_tokens: number;
  l2_significance_threshold: number;
  l2_emotional_delta_threshold: number;
  l3_vector_dimension: number;
  l3_max_fragments: number;
  default_fusion_weights: { w_L1: number; w_L2: number; w_L3: number };
  importance_decay_rate: number;
  access_boost_factor: number;
  recency_boost_factor: number;
}

type MemoryControllerCtor = new (db: DatabaseManager, config: MemoryControllerConfig) => unknown;
let MemoryController: MemoryControllerCtor | null = null;
try {
  const mod = await import('@rpg/mca');
  MemoryController = mod.MemoryController as MemoryControllerCtor;
} catch (e: unknown) { // explicit unknown
  logger.warn('MemoryController not available, continuing without MCA layer:', e instanceof Error ? e.message : String(e));
}

const fastify = Fastify({
  logger: { level: config.NODE_ENV === 'development' ? 'debug' : 'info' }
});

// Enable compression (Fastify v5 compatible)
try {
  const compressMod = await import('@fastify/compress');
  // Module may export either default or named; normalize to known plugin signature.
  const plugin = (compressMod as { default?: unknown })?.default ?? compressMod;
  await fastify.register(plugin as any, { global: true });
  fastify.log.info('Compression plugin enabled');
} catch {
  fastify.log.warn('Compression plugin failed to load');
}

// Register plugins (broadened CORS for story + admin dashboards)
await fastify.register(cors, {
  origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void): void => {
    const allowedEnv = [process.env.STORY_ORIGIN, process.env.ADMIN_ORIGIN].filter((v): v is string => typeof v === 'string' && v !== '');
    const allowed: string[] = [
      'http://localhost:5173',
      'http://localhost:5174',
      ...allowedEnv
    ];
    if (origin == null || origin === '' || allowed.includes(origin)) {
      cb(null, true);
      return;
    }
    cb(new Error('Origin not allowed'), false);
  },
  credentials: true
});
// Simple admin guard (header X-Admin-Key match). Added directly without plugin wrapper.
fastify.decorate('verifyAdmin', async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const expectedRaw = process.env.ADMIN_API_KEY;
  if (expectedRaw == null || expectedRaw === '') { return; }
  const expected = expectedRaw;
  const keyHeader = req.headers['x-admin-key'];
  const key = Array.isArray(keyHeader) ? keyHeader[0] : keyHeader; // headers can be string | string[]
  if (typeof key !== 'string' || key !== expected) {
    await reply.code(401).send({ error: 'Unauthorized' });
  }
});
await fastify.register(websocket);

// Optionally serve static admin dashboard (consolidated deployment)
await setupStaticAdmin(fastify, { serve: FLAGS.SERVE_ADMIN_STATIC });

// Initialize database connections
  const redisUrl = config.REDIS_URL;
  const dbManager = new DatabaseManager({
  neo4j: { uri: config.NEO4J_URI, user: config.NEO4J_USER, password: config.NEO4J_PASSWORD, optional: FLAGS.NEO4J_OPTIONAL, maxRetries: FLAGS.NEO4J_MAX_RETRIES, retryDelayMs: FLAGS.NEO4J_RETRY_DELAY_MS },
    faiss: { indexPath: config.FAISS_INDEX_PATH, dimension: config.VECTOR_DIMENSION },
    redis: (typeof redisUrl === 'string' && redisUrl.length > 0) ? { url: redisUrl } : undefined
  });
fastify.decorate('db', dbManager);
let memoryController: unknown; // remains unknown until assignment

// Setup routes
await setupRoutes(fastify);

// Health check
fastify.get('/health', async () => {
  const neo4jHealth = await dbManager.checkNeo4jHealth();
  return { status: 'ok', timestamp: new Date().toISOString(), services: { neo4j: neo4jHealth ? 'healthy' : 'unhealthy', faiss: 'healthy', redis: dbManager.hasRedis() ? 'healthy' : 'not_configured' } };
});

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  fastify.log.info('Shutting down gracefully...');
  await dbManager.close();
  await fastify.close();
  process.exit(0);
};
process.on('SIGTERM', () => { void gracefulShutdown(); });
process.on('SIGINT', () => { void gracefulShutdown(); });

// Start server
const start = async (): Promise<void> => {
  try {
    await dbManager.initialize();
    const registry = CharacterRegistry.getInstance();
  registry.load(true); // load is synchronous
    fastify.log.info(`Loaded ${registry.list().length} characters`);
  if (MemoryController != null) {
      const cfg: MemoryControllerConfig = {
        l1_max_turns: 20,
        l1_max_tokens: 4000,
        l2_significance_threshold: 5.0,
        l2_emotional_delta_threshold: 0.3,
        l3_vector_dimension: config.VECTOR_DIMENSION,
        l3_max_fragments: 1000,
        default_fusion_weights: { w_L1: 0.4, w_L2: 0.4, w_L3: 0.2 },
        importance_decay_rate: 0.1,
        access_boost_factor: 1.2,
        recency_boost_factor: 1.5
      };
      memoryController = new MemoryController(dbManager, cfg);
      fastify.decorate('mca', memoryController as object as typeof fastify.mca);
    }
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
  fastify.log.info(`Backend running on port ${config.PORT}`);
  } catch (err: unknown) { // explicit unknown
    fastify.log.error(err);
    process.exit(1);
  }
};
void start();