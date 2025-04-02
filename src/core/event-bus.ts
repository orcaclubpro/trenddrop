/**
 * EventBus Service
 * 
 * This service provides a publish/subscribe pattern implementation for
 * application-wide events.
 */

import { EventEmitter } from 'events';
import { injectable } from 'inversify';
import { TYPES } from './types';
import { Logger } from './logger';

// Event callback type
export type EventCallback = (data?: any) => void;

// EventBus interface
export interface EventBus {
  /**
   * Publish an event
   * @param eventName Name of the event
   * @param data Optional data to include with the event
   */
  publish(eventName: string, data?: any): void;
  
  /**
   * Subscribe to an event
   * @param eventName Name of the event
   * @param callback Callback function to invoke when the event is published
   * @returns Unsubscribe function
   */
  subscribe(eventName: string, callback: EventCallback): () => void;
  
  /**
   * One-time subscription to an event
   * @param eventName Name of the event
   * @param callback Callback function to invoke when the event is published
   * @returns Unsubscribe function
   */
  subscribeOnce(eventName: string, callback: EventCallback): () => void;
  
  /**
   * Unsubscribe all callbacks for an event
   * @param eventName Name of the event
   */
  unsubscribeAll(eventName: string): void;
}

/**
 * EventBus implementation using Node.js EventEmitter
 */
@injectable()
export class EventBusImpl implements EventBus {
  private eventEmitter: EventEmitter;
  private logger: Logger;
  
  constructor(logger: Logger) {
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(0); // Unlimited listeners
    this.logger = logger;
  }
  
  /**
   * Publish an event
   * @param eventName Name of the event
   * @param data Optional data to include with the event
   */
  publish(eventName: string, data?: any): void {
    this.logger.debug(`Publishing event: ${eventName}`, 'event-bus', {
      data: typeof data === 'object' ? JSON.stringify(data) : data
    });
    this.eventEmitter.emit(eventName, data);
  }
  
  /**
   * Subscribe to an event
   * @param eventName Name of the event
   * @param callback Callback function to invoke when the event is published
   * @returns Unsubscribe function
   */
  subscribe(eventName: string, callback: EventCallback): () => void {
    this.logger.debug(`Subscribing to event: ${eventName}`, 'event-bus');
    this.eventEmitter.on(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off(eventName, callback);
      this.logger.debug(`Unsubscribed from event: ${eventName}`, 'event-bus');
    };
  }
  
  /**
   * One-time subscription to an event
   * @param eventName Name of the event
   * @param callback Callback function to invoke when the event is published
   * @returns Unsubscribe function
   */
  subscribeOnce(eventName: string, callback: EventCallback): () => void {
    this.logger.debug(`Subscribing once to event: ${eventName}`, 'event-bus');
    this.eventEmitter.once(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off(eventName, callback);
      this.logger.debug(`Unsubscribed from one-time event: ${eventName}`, 'event-bus');
    };
  }
  
  /**
   * Unsubscribe all callbacks for an event
   * @param eventName Name of the event
   */
  unsubscribeAll(eventName: string): void {
    this.logger.debug(`Unsubscribing all listeners for event: ${eventName}`, 'event-bus');
    this.eventEmitter.removeAllListeners(eventName);
  }
}

/**
 * Factory function to create an EventBus instance
 * 
 * This function is used to create an EventBus instance without
 * using the DI container, which is useful in bootstrap scenarios.
 * 
 * @param logger Logger instance
 * @returns EventBus instance
 */
export function createEventBus(logger: Logger): EventBus {
  return new EventBusImpl(logger);
}