import { useEffect, useState, useRef, useCallback } from 'react';

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

  // Function to connect to WebSocket
  const connect = useCallback(() => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    // Create new WebSocket connection
    setStatus('connecting');
    console.log(`Connecting to WebSocket at ${url}`);
    const socket = new WebSocket(url);
    socketRef.current = socket;
    
    // WebSocket event handlers
    socket.onopen = () => {
      setStatus('open');
      console.log('WebSocket connection established');
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        setMessages((prev) => [...prev, data]);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      setStatus('closed');
      console.log('WebSocket connection closed');
      
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        connect();
      }, 5000);
    };
    
    socket.onerror = (error) => {
      setStatus('error');
      console.error('WebSocket error:', error);
      console.error(`WebSocket connection to ${url} failed`);
      
      // Close the socket and trigger reconnect
      socket.close();
    };
  }, [url]);
  
  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      // Clean up on unmount
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
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
