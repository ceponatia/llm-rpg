import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config } from './config.js';
import { setupRoutes } from './routes/index.js';
import { DatabaseManager } from './database/manager.js';
import { CharacterRegistry } from './services/character-registry.js';
import { setupStaticAdmin } from './staticAdmin.js';

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
  console.warn('MemoryController not available, continuing without MCA layer:', e instanceof Error ? e.message : String(e));
}

const fastify = Fastify({
  logger: { level: config.NODE_ENV === 'development' ? 'debug' : 'info' }
});

// Task 6: register compression globally (gzip/brotli) for responses including static assets
// Using dynamic import to avoid type resolution issues if types are absent.
try {
  const compressMod: any = await import('@fastify/compress');
  await fastify.register(compressMod.default || compressMod, { global: true });
} catch (e) {
  fastify.log.warn('Compression plugin failed to register: ' + (e as Error).message);
}

// Register plugins (broadened CORS for story + admin dashboards)
await fastify.register(cors, {
  origin: (origin, cb) => {
    const allowed = [
      'http://localhost:5173', // admin dashboard dev
      'http://localhost:5174', // story frontend dev (expected)
      process.env.STORY_ORIGIN, // production story frontend
      process.env.ADMIN_ORIGIN  // production admin dashboard
    ].filter(Boolean) as string[];
    if (!origin || allowed.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Origin not allowed'), false);
    }
  },
  credentials: true
});
// Simple admin guard (header X-Admin-Key match). Added directly without plugin wrapper.
fastify.decorate('verifyAdmin', async (req: any, reply: any) => {
  const key = req.headers['x-admin-key'];
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return; // open if not set
  if (key !== expected) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});
await fastify.register(websocket);

// Optionally serve static admin dashboard (consolidated deployment)
await setupStaticAdmin(fastify, { serve: process.env.SERVE_ADMIN_STATIC === 'true' });

// Initialize database connections
const dbManager = new DatabaseManager({
  neo4j: { uri: config.NEO4J_URI, user: config.NEO4J_USER, password: config.NEO4J_PASSWORD },
  faiss: { indexPath: config.FAISS_INDEX_PATH, dimension: config.VECTOR_DIMENSION },
  redis: config.REDIS_URL ? { url: config.REDIS_URL } : undefined
});
fastify.decorate('db', dbManager);
let memoryController: unknown; // remains unknown until assignment

// Setup routes
await setupRoutes(fastify);

// Health check
fastify.get('/health', async () => {
  const neo4jHealth = await dbManager.checkNeo4jHealth();
  return { status: 'ok', timestamp: new Date().toISOString(), services: { neo4j: neo4jHealth ? 'healthy' : 'unhealthy', faiss: 'healthy', redis: dbManager.redis ? 'healthy' : 'not_configured' } };
});

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  console.log('Shutting down gracefully...');
  await dbManager.close();
  await fastify.close();
  process.exit(0);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async (): Promise<void> => {
  try {
    await dbManager.initialize();
    const registry = CharacterRegistry.getInstance();
    await registry.load(true);
    fastify.log.info(`Loaded ${registry.list().length} characters`);
    if (MemoryController) {
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
    console.log(`🚀 Backend running on port ${config.PORT}`);
  } catch (err: unknown) { // explicit unknown
    fastify.log.error(err);
    process.exit(1);
  }
};
void start();