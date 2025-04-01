import { useState, useEffect, useCallback, useRef } from 'react';
import { WS_MESSAGE_TYPES, API } from '@/lib/constants';
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
    maxReconnectAttempts = 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [socketUrl] = useState(API.WEBSOCKET);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (isConnecting || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    setIsConnecting(true);
    const ws = new WebSocket(socketUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      reconnectAttemptsRef.current = 0;
      
      // Send client connected message
      ws.send(JSON.stringify({ 
        type: WS_MESSAGE_TYPES.CLIENT_CONNECTED
      }));

      if (onOpen) {
        onOpen();
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);

      if (onClose) {
        onClose();
      }

      if (reconnectOnClose && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, reconnectInterval);
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        toast({
          title: 'Connection Lost',
          description: 'Could not reconnect to the server. Please refresh the page.',
          variant: 'destructive'
        });
      }
    };

    ws.onerror = (error) => {
      setIsConnecting(false);
      
      if (onError) {
        onError(error);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        
        if (onMessage) {
          onMessage(message);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socketRef.current = ws;
  }, [
    isConnecting,
    socketUrl,
    onOpen,
    onClose,
    onMessage,
    onError,
    reconnectOnClose,
    reconnectInterval,
    maxReconnectAttempts,
    toast
  ]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
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
    isConnecting,
    connect,
    disconnect,
    sendMessage
  };
}