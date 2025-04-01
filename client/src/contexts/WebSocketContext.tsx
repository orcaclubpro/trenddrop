import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { API, WS_MESSAGE_TYPES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

// Types
export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

type WebSocketContextType = {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => boolean;
  reconnect: () => void;
};

// Create the context with a default value
const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  isConnecting: false,
  lastMessage: null,
  // These functions will be properly implemented in the provider
  sendMessage: () => false,
  reconnect: () => {},
});

// Custom provider component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const messageCallbacksRef = useRef<Map<string, Set<(message: WebSocketMessage) => void>>>(new Map());
  const { toast } = useToast();

  // Maximum reconnection attempts and intervals
  const MAX_RECONNECT_ATTEMPTS = 10;  // Increased from 5
  const RECONNECT_INTERVAL = 2000;    // Reduced from 3000 ms to 2000 ms
  const PING_INTERVAL = 30000;        // 30 seconds - for heartbeat
  const pingIntervalRef = useRef<NodeJS.Timeout>();

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (isConnecting || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    setIsConnecting(true);
    
    // Clean up any existing socket
    if (socketRef.current) {
      socketRef.current.onclose = null; // Remove the existing onclose handler
      socketRef.current.onerror = null; // Remove the existing onerror handler
      socketRef.current.onmessage = null; // Remove the existing onmessage handler
      socketRef.current.close();
      socketRef.current = null;
    }
    
    try {
      const ws = new WebSocket(API.WEBSOCKET);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
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
            ws.send(JSON.stringify({ 
              type: 'ping',
              timestamp: new Date().toISOString(),
              clientId: 'client-' + Date.now()
            }));
          }
        }, PING_INTERVAL);
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
        setIsConnected(false);
        setIsConnecting(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = undefined;
        }

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const backoffTime = RECONNECT_INTERVAL * Math.pow(1.5, reconnectAttemptsRef.current);
          console.log(`Attempting to reconnect in ${backoffTime}ms (attempt ${reconnectAttemptsRef.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, backoffTime);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          toast({
            title: 'Connection Lost',
            description: 'Could not reconnect to the server. Please refresh the page.',
            variant: 'destructive'
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(message);
          
          // Handle pong messages internally
          if (message.type === 'pong') {
            console.log('Received pong from server');
            return;
          }
          
          // Dispatch the message to registered callbacks
          if (message.type && messageCallbacksRef.current.has(message.type)) {
            const callbacks = messageCallbacksRef.current.get(message.type);
            if (callbacks) {
              callbacks.forEach(callback => {
                try {
                  callback(message);
                } catch (error) {
                  console.error('Error in message callback:', error);
                }
              });
            }
          }
          
          // Dispatch to wildcard listeners
          if (messageCallbacksRef.current.has('*')) {
            const wildcardCallbacks = messageCallbacksRef.current.get('*');
            if (wildcardCallbacks) {
              wildcardCallbacks.forEach(callback => {
                try {
                  callback(message);
                } catch (error) {
                  console.error('Error in wildcard message callback:', error);
                }
              });
            }
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      socketRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsConnecting(false);
      
      // Attempt to reconnect
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, RECONNECT_INTERVAL);
      }
    }
  }, [isConnecting, toast]);

  // Subscribe to a specific message type
  const subscribe = useCallback((type: string, callback: (message: WebSocketMessage) => void) => {
    if (!messageCallbacksRef.current.has(type)) {
      messageCallbacksRef.current.set(type, new Set());
    }
    
    messageCallbacksRef.current.get(type)?.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = messageCallbacksRef.current.get(type);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          messageCallbacksRef.current.delete(type);
        }
      }
    };
  }, []);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = undefined;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
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

  // Manual reconnect function - resets counters and attempts connection
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    // Clean up on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Context value
  const contextValue = {
    isConnected,
    isConnecting,
    lastMessage,
    sendMessage,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use the WebSocket context
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

// Enhanced hook for subscribing to specific message types
export const useWebSocketSubscription = (
  messageType: string | string[],
  callback: (message: WebSocketMessage) => void
) => {
  const { isConnected, isConnecting } = useWebSocketContext();
  
  useEffect(() => {
    const messageCallbacksRef = new Map<string, Set<(message: WebSocketMessage) => void>>();
    const unsubscribers: (() => void)[] = [];
    
    const types = Array.isArray(messageType) ? messageType : [messageType];
    
    types.forEach(type => {
      if (!messageCallbacksRef.has(type)) {
        messageCallbacksRef.set(type, new Set());
      }
      
      messageCallbacksRef.get(type)?.add(callback);
      
      // Add unsubscribe function
      unsubscribers.push(() => {
        const callbacks = messageCallbacksRef.get(type);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            messageCallbacksRef.delete(type);
          }
        }
      });
    });
    
    // Clean up subscriptions on unmount
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [messageType, callback]);
  
  return { isConnected, isConnecting };
};