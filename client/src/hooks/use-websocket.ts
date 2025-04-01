import { useState, useEffect, useRef, useCallback } from 'react';
import { API, WS_MESSAGE_TYPES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

type WebSocketHookOptions = {
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  reconnectOnClose?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
};

/**
 * A custom hook for managing WebSocket connections
 */
export function useWebSocket(options: WebSocketHookOptions = {}) {
  const {
    onOpen,
    onClose,
    onMessage,
    onError,
    reconnectOnClose = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (typeof WebSocket === 'undefined') {
      console.error('WebSocket is not supported in this browser');
      return;
    }

    // Close existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      const socket = new WebSocket(API.WEBSOCKET);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Send client_connected message
        socket.send(JSON.stringify({
          type: WS_MESSAGE_TYPES.CLIENT_CONNECTED,
          clientTime: new Date().toISOString(),
        }));
        
        if (onOpen) onOpen();
      };

      socket.onclose = (event) => {
        setIsConnected(false);
        if (onClose) onClose();

        // Attempt to reconnect if not closed cleanly and reconnect is enabled
        if (reconnectOnClose && !event.wasClean) {
          attemptReconnect();
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(data);
          if (onMessage) onMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) onError(error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [onOpen, onClose, onMessage, onError, reconnectOnClose]);

  // Attempt to reconnect
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current += 1;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
        connect();
      }, reconnectInterval);
    } else {
      console.error(`Failed to reconnect after ${maxReconnectAttempts} attempts`);
      toast({
        title: 'Connection Lost',
        description: 'Failed to reconnect to the server. Please refresh the page.',
        variant: 'destructive',
      });
    }
  }, [connect, maxReconnectAttempts, reconnectInterval, toast]);

  // Send a message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, [isConnected]);

  // Manually disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
  };
}