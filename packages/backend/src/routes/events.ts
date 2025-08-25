import type { FastifyInstance } from 'fastify';

interface NarrativeEventBody {
  type: string; // e.g. character_created, setting_updated, narrative_edit
  payload: Record<string, unknown>;
  sessionId?: string;
  timestamp?: string;
}

export function eventsRoutes(fastify: FastifyInstance): void {
  fastify.post<{ Body: NarrativeEventBody }>('/api/events/narrative', async (request, reply) => {
    try {
      const { type, payload, sessionId, timestamp } = request.body;
      if (typeof type !== 'string' || type === '') {
        return reply.status(400).send({ error: 'Invalid type' });
      }
      // Basic normalization
      const evt = {
        type,
        payload,
        sessionId: sessionId ?? 'global',
        timestamp: timestamp ?? new Date().toISOString()
      };
      // Optionally hand off to MCA if available for ingestion/scoring
      const maybeMca: unknown = fastify.mca;
      if (maybeMca !== undefined && maybeMca !== null && typeof (maybeMca as { ingestDomainEvent?: unknown }).ingestDomainEvent === 'function') {
        const ingestFn = (maybeMca as { ingestDomainEvent: (e: typeof evt) => Promise<void> }).ingestDomainEvent;
        try { await ingestFn(evt); } catch (e) { fastify.log.warn({ err: e }, 'MCA ingestDomainEvent failed'); }
      }
      // Broadcast to WS clients for real-time dev visibility
      if (typeof fastify.broadcastToClients === 'function') {
        fastify.broadcastToClients({
          type: 'narrative_event',
          event: evt
        });
      }
      return { status: 'ok', received: evt };
    } catch (e) {
      fastify.log.error({ err: e }, 'Failed to process narrative event');
      return reply.status(500).send({ error: 'Failed to record event' });
    }
  });
}