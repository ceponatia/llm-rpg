import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react';
import { logger } from '@rpg/utils';

interface WebSocketMessage {
  type: string;
  data?: unknown;
  timestamp: string;
  message?: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: unknown) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const isWebSocketMessage = (val: unknown): val is WebSocketMessage => {
    if (val === null || typeof val !== 'object') { return false; }
    const v = val as Record<string, unknown>;
    return typeof v.type === 'string' && typeof v.timestamp === 'string';
  };

  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:3001/ws/updates`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = (): void => {
      logger.info('WebSocket connected');
      setIsConnected(true);
      setSocket(ws);
    };

  ws.onmessage = (event): void => {
      try {
        if (typeof event.data !== 'string') { return; }
        const parsed: unknown = JSON.parse(event.data);
        if (isWebSocketMessage(parsed)) {
          setLastMessage(parsed);
        }
      } catch (error) {
    logger.warn('Failed to parse WebSocket message', error);
      }
    };

    ws.onclose = (): void => {
      logger.info('WebSocket disconnected');
      setIsConnected(false);
      setSocket(null);
    };

    ws.onerror = (error): void => {
      logger.error('WebSocket error', error);
    };

    // Cleanup on unmount
    return (): void => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const sendMessage = (message: unknown): void => {
    if (socket !== null && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(message));
      } catch (err) {
        logger.error('Failed to send WebSocket message', err);
      }
    } else {
      logger.warn('WebSocket is not connected');
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        lastMessage,
        sendMessage
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};