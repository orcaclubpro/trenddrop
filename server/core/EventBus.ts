/**
 * EventBus - Application Event System
 * 
 * This class implements a simple event bus for communication between services.
 */

type EventCallback = (data: any) => void;

export class EventBus {
  private static instance: EventBus;
  private events: Map<string, Set<EventCallback>> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   * @returns An unsubscribe function
   */
  public subscribe(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    this.events.get(event)!.add(callback);
    
    // Return an unsubscribe function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.events.delete(event);
        }
      }
    };
  }

  /**
   * Publish an event
   */
  public publish(event: string, data: any): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in event handler for '${event}':`, error);
        }
      });
    }
  }

  /**
   * List all active event types
   */
  public listEventTypes(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Get the number of subscribers for an event
   */
  public subscriberCount(event: string): number {
    return this.events.has(event) ? this.events.get(event)!.size : 0;
  }

  /**
   * Clear all event subscriptions (mainly used for testing)
   */
  public clear(): void {
    this.events.clear();
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();

// Export default for convenience
export default eventBus;