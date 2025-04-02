/**
 * Event Bus
 * 
 * A simple event bus for inter-service communication.
 * This enables loosely coupled components to communicate through events.
 */

import { log } from '../vite.js';

// Event handler type
type EventHandler = (data: any) => void;

class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, Set<EventHandler>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   * @param eventName The name of the event to subscribe to
   * @param handler The function to call when the event is published
   * @returns A function that can be called to unsubscribe
   */
  public subscribe(eventName: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    
    this.handlers.get(eventName)?.add(handler);
    
    // Return an unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventName);
      if (handlers) {
        handlers.delete(handler);
        
        // Clean up if no handlers left
        if (handlers.size === 0) {
          this.handlers.delete(eventName);
        }
      }
    };
  }

  /**
   * Publish an event
   * @param eventName The name of the event to publish
   * @param data The data to pass to handlers
   */
  public publish(eventName: string, data: any = {}): void {
    const handlers = this.handlers.get(eventName);
    
    if (!handlers || handlers.size === 0) {
      // No handlers for this event
      log(`Event '${eventName}' published but no handlers`, 'event-bus');
      return;
    }
    
    // Add timestamp to event data if not already present
    const eventData = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    // Call all handlers - convert Set to Array to avoid iteration error
    Array.from(handlers).forEach(handler => {
      try {
        handler(eventData);
      } catch (error) {
        log(`Error in event handler for '${eventName}': ${error}`, 'event-bus');
      }
    });
    
    log(`Event '${eventName}' published to ${handlers.size} handlers`, 'event-bus');
  }

  /**
   * Check if an event has subscribers
   * @param eventName The name of the event to check
   * @returns True if the event has subscribers
   */
  public hasSubscribers(eventName: string): boolean {
    const handlers = this.handlers.get(eventName);
    return !!handlers && handlers.size > 0;
  }

  /**
   * Get the number of subscribers for an event
   * @param eventName The name of the event to check
   * @returns The number of subscribers
   */
  public subscriberCount(eventName: string): number {
    const handlers = this.handlers.get(eventName);
    return handlers ? handlers.size : 0;
  }

  /**
   * Get all event names that have subscribers
   * @returns An array of event names
   */
  public getEventNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers for a specific event
   * @param eventName The name of the event to clear
   */
  public clearEvent(eventName: string): void {
    this.handlers.delete(eventName);
  }

  /**
   * Clear all handlers for all events
   */
  public clearAllEvents(): void {
    this.handlers.clear();
  }
}

// Export a singleton instance
export const eventBus = EventBus.getInstance();