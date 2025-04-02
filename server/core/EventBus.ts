/**
 * EventBus - Simple event pub/sub implementation
 * 
 * This provides a central hub for application-wide events in TrendDrop.
 */

type EventCallback = (data: any) => void;

/**
 * EventBus class - Simple pub/sub implementation
 */
export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>>;
  
  private constructor() {
    this.listeners = new Map();
  }
  
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
   */
  public subscribe(eventType: string, callback: EventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)?.add(callback);
  }
  
  /**
   * Unsubscribe from an event
   */
  public unsubscribe(eventType: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
      
      if (callbacks.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }
  
  /**
   * Publish an event
   */
  public publish(eventType: string, data: any = {}): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for "${eventType}":`, error);
        }
      }
    }
  }
  
  /**
   * Clear all listeners for an event
   */
  public clearListeners(eventType: string): void {
    this.listeners.delete(eventType);
  }
  
  /**
   * Clear all listeners for all events
   */
  public clearAllListeners(): void {
    this.listeners.clear();
  }
  
  /**
   * Get the number of listeners for an event
   */
  public listenerCount(eventType: string): number {
    return this.listeners.get(eventType)?.size || 0;
  }
  
  /**
   * Get all registered event types
   */
  public getEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();

// Export default for convenience
export default eventBus;