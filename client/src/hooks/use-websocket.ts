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
    maxReconnectAttempts = 10 // Increased from 5 for better reliability
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [socketUrl] = useState(API.WEBSOCKET);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (isConnecting || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    setIsConnecting(true);
    
    // Clean up any existing socket
    if (socketRef.current) {
      socketRef.current.onclose = null; // Remove existing handlers
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;
      try {
        socketRef.current.close();
      } catch (error) {
        console.error('Error closing existing WebSocket:', error);
      }
      socketRef.current = null;
    }
    
    try {
      // Create a new WebSocket connection
      console.log(`Connecting to WebSocket at: ${socketUrl}`);
      const ws = new WebSocket(socketUrl);
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout');
          ws.close();
          setIsConnecting(false);
          
          if (reconnectOnClose && reconnectAttemptsRef.current < maxReconnectAttempts) {
            const backoffTime = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current += 1;
              connect();
            }, backoffTime);
          }
        }
      }, 5000); // 5 second timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        
        // Send client connected message
        ws.send(JSON.stringify({ 
          type: WS_MESSAGE_TYPES.CLIENT_CONNECTED,
          clientId: 'client-' + Date.now(),
          timestamp: new Date().toISOString()
        }));

        // Setup ping interval for keeping connection alive
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ 
                type: WS_MESSAGE_TYPES.PING,
                timestamp: new Date().toISOString()
              }));
            } catch (error) {
              console.error('Error sending ping:', error);
              // If we can't send a ping, the connection is likely dead
              if (ws.readyState === WebSocket.OPEN) {
                ws.close();
              }
            }
          }
        }, 30000); // 30 seconds

        if (onOpen) {
          onOpen();
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        setIsConnected(false);
        setIsConnecting(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = undefined;
        }

        if (onClose) {
          onClose();
        }

        if (reconnectOnClose && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const backoffTime = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current);
          console.log(`Attempting to reconnect in ${backoffTime}ms (attempt ${reconnectAttemptsRef.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, backoffTime);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.warn('Maximum reconnect attempts reached');
          // Reset counter after a delay to allow future reconnection attempts
          setTimeout(() => {
            reconnectAttemptsRef.current = 0;
          }, 30000); // Wait 30 seconds before allowing reconnection attempts again
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        setIsConnecting(false);
        
        console.error('WebSocket error:', error);
        
        // If we get an error and the socket is still in CONNECTING state,
        // it probably means there's a network issue or the server is unreachable
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
        
        if (onError) {
          onError(error);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          // Handle pong messages specially
          if (message.type === WS_MESSAGE_TYPES.PONG) {
            console.log('Received pong from server');
            return;
          }
          
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      socketRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsConnecting(false);
      
      if (reconnectOnClose && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, reconnectInterval);
      }
    }
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
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = undefined;
    }

    if (socketRef.current) {
      socketRef.current.onclose = null; // Remove handler to prevent reconnection
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
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