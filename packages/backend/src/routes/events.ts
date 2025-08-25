import { FastifyInstance } from 'fastify';

interface NarrativeEventBody {
  type: string; // e.g. character_created, setting_updated, narrative_edit
  payload: Record<string, unknown>;
  sessionId?: string;
  timestamp?: string;
}

export async function eventsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: NarrativeEventBody }>('/api/events/narrative', async (request, reply) => {
    try {
      const { type, payload, sessionId, timestamp } = request.body;
      if (!type || typeof type !== 'string') {
        return reply.status(400).send({ error: 'Invalid type' });
      }
      // Basic normalization
      const evt = {
        type,
        payload,
        sessionId: sessionId || 'global',
        timestamp: timestamp || new Date().toISOString()
      };
      // Optionally hand off to MCA if available for ingestion/scoring
      if (fastify.mca && (fastify.mca as any).ingestDomainEvent) {
        try {
          await (fastify.mca as any).ingestDomainEvent(evt);
        } catch (e) {
          fastify.log.warn({ err: e as any }, 'MCA ingestDomainEvent failed');
        }
      }
      // Broadcast to WS clients for real-time dev visibility
      if (fastify.broadcastToClients) {
        fastify.broadcastToClients({
          type: 'narrative_event',
          event: evt
        });
      }
      return { status: 'ok', received: evt };
    } catch (e) {
      fastify.log.error({ err: e as any }, 'Failed to process narrative event');
      return reply.status(500).send({ error: 'Failed to record event' });
    }
  });
}