/**
 * State Tracker - Track JavaScript variables and state with proxies and manual registration
 */

import type { UUICSConfig } from '../types';

/**
 * State getter function type
 */
type StateGetter = () => any;

/**
 * State Tracker class
 */
export class StateTracker {
  private trackedObjects: Map<string, any> = new Map();
  private stateGetters: Map<string, StateGetter> = new Map();
  private captureFunction?: () => Record<string, any>;
  private excludePatterns: string[] = [];

  constructor(config?: UUICSConfig['state']) {
    this.captureFunction = config?.capture;
    this.excludePatterns = config?.exclude ?? [];
    
    // Auto-track configured objects
    if (config?.track) {
      for (const [name, obj] of Object.entries(config.track)) {
        this.track(name, obj);
      }
    }
  }

  /**
   * Track an object with Proxy for automatic change detection
   */
  track<T extends object>(name: string, obj: T): T {
    const proxy = new Proxy(obj, {
      set: (target: any, property: string | symbol, value: any) => {
        target[property] = value;
        return true;
      },
      get: (target: any, property: string | symbol) => {
        return target[property];
      }
    });
    
    this.trackedObjects.set(name, proxy);
    return proxy;
  }

  /**
   * Register a state getter function for manual state retrieval
   */
  register(name: string, getter: StateGetter): void {
    this.stateGetters.set(name, getter);
  }

  /**
   * Unregister a state getter
   */
  unregister(name: string): void {
    this.stateGetters.delete(name);
  }

  /**
   * Remove a tracked object
   */
  untrack(name: string): void {
    this.trackedObjects.delete(name);
  }

  /**
   * Capture current state snapshot
   */
  captureSnapshot(): Record<string, any> {
    const snapshot: Record<string, any> = {};
    
    // 1. Tracked objects (proxy-based)
    for (const [name, obj] of this.trackedObjects) {
      snapshot[name] = this.deepClone(obj);
    }
    
    // 2. Manual getters
    for (const [name, getter] of this.stateGetters) {
      try {
        snapshot[name] = this.deepClone(getter());
      } catch (error) {
        // If getter fails, capture the error
        snapshot[name] = { error: error instanceof Error ? error.message : String(error) };
      }
    }
    
    // 3. Custom capture function
    if (this.captureFunction) {
      try {
        const customState = this.captureFunction();
        Object.assign(snapshot, customState);
      } catch (error) {
        console.warn('[StateTracker] Custom capture function failed:', error);
      }
    }
    
    // 4. Apply exclusion filters
    return this.applyExclusions(snapshot);
  }

  /**
   * Deep clone an object with circular reference handling
   */
  private deepClone(obj: any, seen = new WeakSet()): any {
    // Handle primitives
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    // Handle circular references
    if (seen.has(obj)) {
      return '[Circular]';
    }
    
    // Handle Date
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    
    // Handle RegExp
    if (obj instanceof RegExp) {
      return obj.toString();
    }
    
    // Handle Arrays
    if (Array.isArray(obj)) {
      seen.add(obj);
      const arr = obj.map(item => this.deepClone(item, seen));
      seen.delete(obj);
      return arr;
    }
    
    // Handle Functions - don't clone, just note their presence
    if (typeof obj === 'function') {
      return '[Function]';
    }
    
    // Handle Objects
    try {
      seen.add(obj);
      const cloned: Record<string, any> = {};
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          try {
            cloned[key] = this.deepClone(obj[key], seen);
          } catch (error) {
            cloned[key] = '[Error cloning]';
          }
        }
      }
      
      seen.delete(obj);
      return cloned;
    } catch (error) {
      // Fallback for objects that can't be cloned
      return '[Unserializable]';
    }
  }

  /**
   * Apply exclusion filters to remove sensitive data
   */
  private applyExclusions(snapshot: Record<string, any>): Record<string, any> {
    if (this.excludePatterns.length === 0) {
      return snapshot;
    }
    
    const filtered = { ...snapshot };
    
    for (const pattern of this.excludePatterns) {
      this.filterByPattern(filtered, pattern);
    }
    
    return filtered;
  }

  /**
   * Recursively filter object by pattern
   */
  private filterByPattern(obj: any, pattern: string, path: string = ''): void {
    if (obj === null || typeof obj !== 'object') {
      return;
    }
    
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) {
        continue;
      }
      
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check if this key/path matches the exclusion pattern
      if (this.matchesPattern(currentPath, pattern) || this.matchesPattern(key, pattern)) {
        obj[key] = '[EXCLUDED]';
        continue;
      }
      
      // Recurse into nested objects/arrays
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.filterByPattern(obj[key], pattern, currentPath);
      }
    }
  }

  /**
   * Check if a string matches a pattern (supports wildcards)
   */
  private matchesPattern(str: string, pattern: string): boolean {
    // Convert pattern to regex
    // * matches any characters
    // ? matches single character
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except * and ?
      .replace(/\*/g, '.*') // * becomes .*
      .replace(/\?/g, '.'); // ? becomes .
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(str.toLowerCase());
  }

  /**
   * Get list of tracked state names
   */
  getTrackedNames(): string[] {
    const names: string[] = [];
    names.push(...this.trackedObjects.keys());
    names.push(...this.stateGetters.keys());
    return names;
  }

  /**
   * Clear all tracked state
   */
  clear(): void {
    this.trackedObjects.clear();
    this.stateGetters.clear();
  }
}

