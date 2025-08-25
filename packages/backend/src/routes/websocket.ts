import { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { webSocketMessageSchema } from '@rpg/types';

// Extend FastifyInstance to include websocket clients
declare module 'fastify' {
  interface FastifyInstance {
    websocketClients?: Set<WebSocket>;
    broadcastToClients?: (data: WebSocketOutboundMessage) => void;
  }
}

// Outbound WebSocket messages we intentionally send
type WebSocketOutboundMessage =
  | { type: 'connection_established'; timestamp: string; message: string }
  | { type: 'subscription_confirmed'; subscription: string; timestamp: string }
  | { type: 'pong'; timestamp: string }
  | { type: 'error'; message: string; timestamp: string }
  | { type: 'narrative_event'; event: Record<string, unknown> }
  | { type: 'memory_operation'; data: unknown; timestamp?: string };

export async function websocketRoutes(fastify: FastifyInstance): Promise<void> {
  // Initialize WebSocket clients set
  if (!fastify.websocketClients) {
    fastify.websocketClients = new Set<WebSocket>();
  }

  // WebSocket endpoint for real-time updates
  fastify.register(async function (fastify) {
    fastify.get('/updates', { websocket: true }, (connection) => {
      const socket = connection;
      
      // Add client to the set
      fastify.websocketClients!.add(socket);
      
      fastify.log.info('New WebSocket client connected');
      
      // Send welcome message
      socket.send(JSON.stringify({
        type: 'connection_established',
        timestamp: new Date().toISOString(),
        message: 'Connected to Cognitive Architecture Simulator'
      }));

      // Handle incoming messages
      socket.on('message', async (message: WebSocket.Data) => {
        try {
          const rawData = JSON.parse(message.toString());
          const parseResult = webSocketMessageSchema.safeParse(rawData);
          
          if (!parseResult.success) {
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Invalid message format',
              timestamp: new Date().toISOString()
            }));
            return;
          }
          
          const data = parseResult.data;
          
          switch (data.type) {
            case 'subscribe_to_memory_operations':
              // Client wants to receive memory operation updates
              socket.send(JSON.stringify({
                type: 'subscription_confirmed',
                subscription: 'memory_operations',
                timestamp: new Date().toISOString()
              }));
              break;
              
            case 'subscribe_to_emotional_changes':
              // Client wants to receive emotional state changes
              socket.send(JSON.stringify({
                type: 'subscription_confirmed',
                subscription: 'emotional_changes',
                timestamp: new Date().toISOString()
              }));
              break;
              
            case 'ping':
              socket.send(JSON.stringify({
                type: 'pong',
                timestamp: new Date().toISOString()
              }));
              break;
              
            default:
              socket.send(JSON.stringify({
                type: 'error',
                message: `Unknown message type: ${data.type}`,
                timestamp: new Date().toISOString()
              }));
          }
        } catch (error) {
          fastify.log.error({ err: error }, 'WebSocket message parsing error');
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
            timestamp: new Date().toISOString()
          }));
        }
      });

      // Handle client disconnect
      socket.on('close', () => {
        fastify.websocketClients!.delete(socket);
        fastify.log.info('WebSocket client disconnected');
      });

      // Handle errors
      socket.on('error', (error: Error) => {
        fastify.log.error({ err: error }, 'WebSocket error');
        fastify.websocketClients!.delete(socket);
      });
    });
  });

  // Helper function to broadcast to all connected clients
  fastify.decorate('broadcastToClients', function(data: WebSocketOutboundMessage) {
    const message = JSON.stringify(data);
    this.websocketClients?.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
}