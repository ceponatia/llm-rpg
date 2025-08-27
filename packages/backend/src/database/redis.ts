import { createClient, type RedisClientType } from 'redis';
import { logger } from '@rpg/utils';

export interface RedisConfig { url: string; }

export class RedisConnection {
  public client: RedisClientType | null = null;
  constructor(private readonly config?: RedisConfig) {}

  public async initialize(): Promise<void> {
    if (!this.config) return; // optional
    try {
      this.client = createClient({ url: this.config.url });
      await this.client.connect();
      await this.client.ping();
      logger.info('Redis connection established');
    } catch (err) {
      logger.error('Failed to connect to Redis', err as Error);
      this.client = null; // degrade gracefully
    }
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}
