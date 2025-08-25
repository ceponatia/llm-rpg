import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

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

  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:3001/ws/updates`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = (): void => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onmessage = (event): void => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = (): void => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setSocket(null);
    };

    ws.onerror = (error): void => {
      console.error('WebSocket error:', error);
    };

    // Cleanup on unmount
    return (): void => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const sendMessage = (message: unknown): void => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
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
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};