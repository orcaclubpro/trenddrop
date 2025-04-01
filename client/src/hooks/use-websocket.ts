import { useEffect, useState, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid'; // Import nanoid for generating client IDs

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error';

export function useWebSocket(url: string) {
  const [status, setStatus] = useState<WebSocketStatus>('connecting');
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate a unique client ID for this connection
  const clientIdRef = useRef<string>(nanoid());

  // Function to connect to WebSocket
  const connect = useCallback(() => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close existing connection if any
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (err) {
        console.warn('Error closing existing socket:', err);
      }
    }
    
    // Create new WebSocket connection
    try {
      setStatus('connecting');
      console.log(`Connecting to WebSocket at ${url}`);
      const wsUrl = url.endsWith('/ws') ? url : `${url}/ws`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          console.warn('WebSocket connection timeout');
          socket.close();
        }
      }, 10000); // 10 seconds timeout
      
      // WebSocket event handlers
      socket.onopen = () => {
        clearTimeout(connectionTimeout);
        setStatus('open');
        console.log('WebSocket connection established');
        
        // Reset reconnection attempts on successful connection
        reconnectAttemptsRef.current = 0;
        
        // Send a ping on connection to request status updates
        try {
          socket.send(JSON.stringify({ 
            type: 'client_connected',
            timestamp: new Date().toISOString(),
            clientId: clientIdRef.current
          }));
          console.log('Sent client_connected message');
        } catch (error) {
          console.error('Error sending client_connected message:', error);
        }
        
        // Setup keepalive ping for the connection
        heartbeatIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            try {
              socket.send(JSON.stringify({ 
                type: 'ping',
                timestamp: new Date().toISOString(),
                clientId: clientIdRef.current
              }));
              console.log('Sent ping to keep connection alive');
            } catch (err) {
              console.warn('Error sending ping:', err);
            }
          }
        }, 30000); // Send ping every 30 seconds
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          console.log('WebSocket message received:', data);
          
          // Only add non-ping/pong messages to the message history
          if (data.type !== 'ping' && data.type !== 'pong') {
            setMessages((prev) => [...prev, data]);
          }
          
          // Handle pong response
          if (data.type === 'pong') {
            console.log('Received pong from server');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          console.error('Raw message data:', event.data);
        }
      };
      
      socket.onclose = (event) => {
        clearTimeout(connectionTimeout);
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        setStatus('closed');
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        
        // Implement exponential backoff for reconnection
        const reconnectDelay = Math.min(
          1000 * Math.pow(1.5, reconnectAttemptsRef.current), 
          30000
        ); // Max 30 seconds
        
        console.log(`Will attempt to reconnect in ${reconnectDelay/1000} seconds`);
        
        // Attempt to reconnect with backoff
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect WebSocket (attempt ${reconnectAttemptsRef.current})...`);
          connect();
        }, reconnectDelay);
      };
      
      socket.onerror = (error) => {
        setStatus('error');
        console.error('WebSocket error:', error);
        console.error(`WebSocket connection to ${wsUrl} failed`);
        
        // No need to explicitly close here as onclose will fire
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      
      // Setup reconnect after error
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++;
        console.log(`Attempting to reconnect WebSocket after error (attempt ${reconnectAttemptsRef.current})...`);
        connect();
      }, 5000);
    }
  }, [url]);
  
  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      // Clean up on unmount
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (err) {
          console.warn('Error closing socket on cleanup:', err);
        }
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [connect]);
  
  // Function to send a message
  const sendMessage = useCallback((data: any) => {
    if (socketRef.current && status === 'open') {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn('Cannot send message, WebSocket is not open');
    }
  }, [status]);
  
  // Function to clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  // Get the latest message of a specific type
  const getLatestMessageOfType = useCallback((type: string) => {
    return messages.filter(msg => msg.type === type).pop();
  }, [messages]);
  
  return {
    status,
    messages,
    sendMessage,
    clearMessages,
    getLatestMessageOfType,
    connect
  };
}
