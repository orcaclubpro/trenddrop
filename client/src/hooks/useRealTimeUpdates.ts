/**
 * useRealTimeUpdates - React hook for real-time WebSocket updates
 * 
 * This hook subscribes to WebSocket events and provides real-time updates
 * for entities in the TrendDrop application.
 */

import { useState, useEffect, useRef } from 'react';
import { queryClient } from '../lib/queryClient';

// Types of events that can be subscribed to
type EventType = 
  | 'product_created' 
  | 'product_updated' 
  | 'product_deleted'
  | 'trend_created'
  | 'region_created'
  | 'video_created'
  | 'ai_agent_status'
  | 'database_status'
  | 'high_quality_product_verified';

// Event callback type
type EventCallback = (data: any) => void;

// Subscription options
interface SubscriptionOptions {
  enabled?: boolean;
  onEvent?: EventCallback;
  invalidateQueries?: string[];
}

/**
 * React hook for subscribing to real-time WebSocket events
 */
export function useRealTimeUpdates(
  eventType: EventType | EventType[],
  options: SubscriptionOptions = {}
) {
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const eventTypes = Array.isArray(eventType) ? eventType : [eventType];
  
  // Default options
  const {
    enabled = true,
    onEvent,
    invalidateQueries = []
  } = options;

  useEffect(() => {
    // Skip if disabled
    if (!enabled) return;

    // Determine WebSocket URL based on current environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Create WebSocket connection
    const ws = new WebSocket(wsUrl);
    socket.current = ws;
    
    // Connection event handlers
    ws.addEventListener('open', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
      console.log('WebSocket connection established');
    });
    
    ws.addEventListener('close', (event) => {
      setIsConnected(false);
      setConnectionStatus(event.wasClean ? 'closed' : 'disconnected');
      console.log(`WebSocket connection closed: ${event.wasClean ? 'clean' : 'unclean'} (${event.code})`);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (enabled) {
          console.log('Attempting to reconnect WebSocket...');
          setConnectionStatus('reconnecting');
        }
      }, 5000);
    });
    
    ws.addEventListener('error', (event) => {
      setError(new Error('WebSocket connection error'));
      setConnectionStatus('error');
      console.error('WebSocket error:', event);
    });
    
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Check if this is an event we care about
        if (eventTypes.includes(data.type)) {
          // Update last event
          setLastEvent(data);
          
          // Call onEvent callback if provided
          if (onEvent) {
            onEvent(data);
          }
          
          // Invalidate queries if specified
          if (invalidateQueries.length > 0) {
            invalidateQueries.forEach(queryKey => {
              queryClient.invalidateQueries({ queryKey: [queryKey] });
            });
          }
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    });
    
    // Cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      socket.current = null;
    };
  }, [enabled, JSON.stringify(eventTypes), JSON.stringify(invalidateQueries)]);

  /**
   * Send a message to the WebSocket server
   */
  const sendMessage = (message: any) => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    }
    return false;
  };

  return {
    lastEvent,
    isConnected,
    connectionStatus,
    error,
    sendMessage
  };
}

/**
 * Hook for subscribing to product updates
 */
export function useProductUpdates(options: SubscriptionOptions = {}) {
  return useRealTimeUpdates(
    ['product_created', 'product_updated', 'product_deleted'],
    {
      ...options,
      invalidateQueries: [...(options.invalidateQueries || []), '/api/products']
    }
  );
}

/**
 * Hook for subscribing to AI agent status updates
 */
export function useAIAgentStatus(options: SubscriptionOptions = {}) {
  return useRealTimeUpdates('ai_agent_status', options);
}

/**
 * Hook for subscribing to database status updates
 */
export function useDatabaseStatus(options: SubscriptionOptions = {}) {
  return useRealTimeUpdates('database_status', options);
}

/**
 * Hook for subscribing to high quality product notifications
 */
export function useHighQualityProductAlerts(options: SubscriptionOptions = {}) {
  return useRealTimeUpdates('high_quality_product_verified', options);
}

// Export default for convenience
export default useRealTimeUpdates;