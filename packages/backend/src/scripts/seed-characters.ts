import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import neo4j from 'neo4j-driver';
import { config } from '../config.js';
import { CharacterProfile, CharacterAttribute } from '@rpg/types';

function extractAttributeValue(attr: CharacterAttribute['value']): string | number | boolean {
  if (typeof attr === 'object' && attr !== null && 'value' in attr) {
    const scalar = attr as { value: string | number | boolean };
    return scalar.value;
  }
  return attr as string | number | boolean;
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
      const profile: CharacterProfile = JSON.parse(raw);
      if (!profile.id || !profile.name) continue;

      const baseline = profile.baseline_vad || { valence: 0, arousal: 0, dominance: 0 };
      const attributes = (profile.attributes || []).map(a => `${a.key}:${extractAttributeValue(a.value)}`);

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
      console.log(`Upserted character ${profile.id}`);
    }
  } catch (e) {
    console.error('Seeding failed', e);
  } finally {
    await session.close();
    await driver.close();
  }
}

void run();
