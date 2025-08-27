import type { ChatResponse } from '@rpg/types';

export function broadcastChatResponse(clients: Set<any> | undefined, chatResponse: ChatResponse): void {
  if (!clients) return;
  clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify({ type: 'chat_response', data: chatResponse }));
    }
  });
}
