import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables: base .env then optional .env.local overrides
dotenv.config({ path: resolve(__dirname, '../../../.env') });
dotenv.config({ path: resolve(__dirname, '../../../.env.local') });

interface Config {
  // Server
  PORT: number;
  NODE_ENV: string;
  
  // Neo4j
  NEO4J_URI: string;
  NEO4J_USER: string;
  NEO4J_PASSWORD: string;
  
  // Redis (optional)
  REDIS_URL?: string;
  
  // Ollama
  OLLAMA_BASE_URL: string;
  OLLAMA_MODEL: string;

  // Prompting
  PROMPT_TEMPLATE: 'default' | 'roleplay' | 'consistency_maintenance';
  PROMPT_CONSISTENCY_ENABLED: boolean;
  PROMPT_CONSISTENCY_TURN_INTERVAL: number; // inject every N assistant turns
  PROMPT_CONSISTENCY_COOLDOWN_TURNS: number; // minimum turns between injections
  PROMPT_CONSISTENCY_TIME_MINUTES: number; // minimum minutes between injections
  
  // FAISS
  FAISS_INDEX_PATH: string;
  VECTOR_DIMENSION: number;
}

function resolvePromptTemplate(): Config['PROMPT_TEMPLATE'] {
  const pt = process.env.PROMPT_TEMPLATE;
  if (pt === 'roleplay' || pt === 'consistency_maintenance' || pt === 'default') {
    return pt;
  }
  return 'default';
}

export const config: Config = {
  PORT: parseInt(process.env.PORT ?? '3001', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  
  NEO4J_URI: process.env.NEO4J_URI ?? 'bolt://localhost:7687',
  NEO4J_USER: process.env.NEO4J_USERNAME ?? 'neo4j',
  NEO4J_PASSWORD: process.env.NEO4J_PASSWORD ?? 'test1234',
  
  REDIS_URL: process.env.REDIS_URL,
  
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL ?? 'mistral:instruct',

  PROMPT_TEMPLATE: resolvePromptTemplate(),
  PROMPT_CONSISTENCY_ENABLED: process.env.PROMPT_CONSISTENCY_ENABLED === undefined
    ? true
    : process.env.PROMPT_CONSISTENCY_ENABLED === 'true',
  PROMPT_CONSISTENCY_TURN_INTERVAL: parseInt(process.env.PROMPT_CONSISTENCY_TURN_INTERVAL ?? '6', 10),
  PROMPT_CONSISTENCY_COOLDOWN_TURNS: parseInt(process.env.PROMPT_CONSISTENCY_COOLDOWN_TURNS ?? '3', 10),
  PROMPT_CONSISTENCY_TIME_MINUTES: parseInt(process.env.PROMPT_CONSISTENCY_TIME_MINUTES ?? '10', 10),
  
  FAISS_INDEX_PATH: process.env.FAISS_INDEX_PATH ?? './data/faiss_index',
  VECTOR_DIMENSION: parseInt(process.env.VECTOR_DIMENSION ?? '1536', 10)
};