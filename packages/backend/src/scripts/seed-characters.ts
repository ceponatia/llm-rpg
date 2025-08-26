import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';
import { config } from '../config.js';
import type { CharacterProfile, CharacterAttribute } from '@rpg/types';
import { logger } from '@rpg/utils';

interface ScalarWrapper { value: string | number | boolean }
function isScalarWrapper(v: unknown): v is ScalarWrapper {
  return typeof v === 'object' && v !== null && 'value' in v;
}
function extractAttributeValue(attr: CharacterAttribute['value']): string | number | boolean {
  return isScalarWrapper(attr) ? attr.value : (attr as string | number | boolean);
}
function isCharacterProfile(value: unknown): value is CharacterProfile {
  if (typeof value !== 'object' || value === null) { return false; }
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || typeof v.name !== 'string') { return false; }
  if (v.id.length === 0 || v.name.length === 0) { return false; }
  return true;
}

async function run(): Promise<void> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // script located at packages/backend/src/scripts => go up 4 to repo root
  const repoRoot = path.resolve(__dirname, '../../../../');
  const dataDir = path.join(repoRoot, 'packages/backend/data/characters');
  const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));
  const driver = neo4j.driver(
    config.NEO4J_URI,
    neo4j.auth.basic(config.NEO4J_USER, config.NEO4J_PASSWORD)
  );
  const session = driver.session();

  try {
    for (const file of files) {
  const raw = readFileSync(path.join(dataDir, file), 'utf-8');
  const parsed: unknown = JSON.parse(raw);
  if (!isCharacterProfile(parsed)) { continue; }
  const profile = parsed; // narrowed
  const baseline = profile.baseline_vad ?? { valence: 0, arousal: 0, dominance: 0 };
  const attributes = (profile.attributes ?? []).map(a => `${a.key}:${extractAttributeValue(a.value)}`);

      await session.run(
        `MERGE (c:Character {id: $id})
         ON CREATE SET c.name = $name, c.type = 'Character', c.created_at = timestamp()
         ON MATCH SET c.name = $name
         SET c.valence = $valence, c.arousal = $arousal, c.dominance = $dominance, c.attribute_pairs = $attributes` ,
        {
          id: profile.id,
          name: profile.name,
          valence: baseline.valence,
          arousal: baseline.arousal,
          dominance: baseline.dominance,
          attributes: attributes
        }
      );
      logger.info(`Upserted character ${profile.id}`);
    }
  } catch (e: unknown) {
    logger.error('Seeding failed', e);
  } finally {
    await session.close();
    await driver.close();
  }
}

void run();
