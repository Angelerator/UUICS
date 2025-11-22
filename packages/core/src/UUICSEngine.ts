/**
 * UUICS Engine - Main class integrating all components
 */

import type {
  UUICSConfig,
  PageContext,
  ActionCommand,
  ActionResult,
  ContextSubscriber,
  SerializationFormat,
  UIElement,
} from './types';
import { DOMScanner } from './scanner';
import { MutationTracker, StateTracker } from './tracker';
import { ContextAggregator } from './aggregator';
import { Serializer } from './serializer';
import { ActionExecutor } from './executor';
import { runInIdle } from './utils';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: UUICSConfig = {
  scan: {
    interval: 0,
    depth: 10,
    includeHidden: false,
    includeDisabled: false,
    useIdleCallback: true,
  },
  track: {
    mutations: true,
    clicks: true,
    changes: true,
    submits: true,
    debounceDelay: 100,
  },
  serialize: {
    format: 'json',
    includeMetadata: true,
    pretty: false,
    includeBounds: false,
  },
  performance: {
    enableCache: true,
    cacheTTL: 5000,
    maxElements: 1000,
    useWorker: false,
  },
  debug: {
    enabled: false,
    level: 'info',
  },
  state: {
    enabled: false,
    exclude: [],
  },
};

/**
 * UUICS Engine - Universal UI Context System
 */
export class UUICSEngine {
  private config: UUICSConfig;
  private scanner: DOMScanner;
  private tracker: MutationTracker;
  private stateTracker?: StateTracker;
  private aggregator: ContextAggregator;
  private serializer: Serializer;
  private executor: ActionExecutor;
  
  private currentContext: PageContext | null = null;
  private subscribers: Set<ContextSubscriber> = new Set();
  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private isInitialized: boolean = false;

  constructor(config: UUICSConfig = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config);
    
    // Initialize components
    this.scanner = new DOMScanner(this.config);
    this.tracker = new MutationTracker(this.config);
    this.aggregator = new ContextAggregator();
    this.serializer = new Serializer();
    this.executor = new ActionExecutor();
    
    // Initialize state tracker if enabled
    if (this.config.state?.enabled) {
      this.stateTracker = new StateTracker(this.config.state);
      this.log('info', 'State tracking enabled');
    }
    
    this.log('info', 'UUICS Engine created');
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.log('warn', 'Already initialized');
      return;
    }

    this.log('info', 'Initializing UUICS Engine...');

    // Initial scan
    await this.scan();

    // Setup mutation tracking
    if (this.config.track?.mutations || 
        this.config.track?.clicks || 
        this.config.track?.changes ||
        this.config.track?.submits) {
      this.startTracking();
    }

    // Setup auto-scan interval
    if (this.config.scan?.interval && this.config.scan.interval > 0) {
      this.scanInterval = setInterval(() => {
        this.scan();
      }, this.config.scan.interval);
    }

    this.isInitialized = true;
    this.log('info', 'UUICS Engine initialized');
  }

  /**
   * Scan the DOM and update context
   */
  async scan(root?: HTMLElement, configOverride?: Partial<UUICSConfig['scan']>): Promise<PageContext> {
    const startTime = performance.now();
    
    const scanFunction = () => {
      // Scan DOM with optional config override
      // Note: scanner.scan will parse the config internally to handle RegExp | RegExp[] properly
      const elements = this.scanner.scan(root, configOverride as any);
      
      // Aggregate context
      const scanDuration = performance.now() - startTime;
      const context = this.aggregator.aggregate(elements, {
        scanDuration,
        scanDepth: configOverride?.depth ?? this.config.scan?.depth ?? 10,
        partial: elements.length >= (this.config.performance?.maxElements ?? 1000),
      });
      
      // Capture state snapshot if state tracking is enabled
      if (this.stateTracker) {
        context.state = this.stateTracker.captureSnapshot();
      }
      
      // Update current context
      this.currentContext = context;
      
      // Notify subscribers
      this.notifySubscribers(context);
      
      this.log('debug', `Scan completed: ${elements.length} elements in ${scanDuration.toFixed(2)}ms`);
      
      return context;
    };

    // Use idle callback if configured
    if (this.config.scan?.useIdleCallback) {
      return new Promise((resolve) => {
        runInIdle(() => {
          const context = scanFunction();
          resolve(context);
        });
      });
    } else {
      return scanFunction();
    }
  }

  /**
   * Start mutation tracking
   */
  private startTracking(): void {
    this.tracker.start((trigger) => {
      this.log('debug', `Change detected: ${trigger}`);
      
      // Re-scan on changes
      this.scan();
    });
  }

  /**
   * Get current context
   */
  getContext(): PageContext | null {
    return this.currentContext;
  }

  /**
   * Subscribe to context updates
   */
  subscribe(callback: ContextSubscriber): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current context if available
    if (this.currentContext) {
      callback(this.currentContext);
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of context update
   */
  private notifySubscribers(context: PageContext): void {
    this.subscribers.forEach(callback => {
      try {
        callback(context);
      } catch (error) {
        this.log('error', 'Subscriber error', error);
      }
    });
  }

  /**
   * Serialize current context
   */
  serialize(format?: SerializationFormat): string {
    if (!this.currentContext) {
      return format === 'json' ? '{}' : 'No context available';
    }

    const serialized = this.serializer.serialize(
      this.currentContext,
      format ?? this.config.serialize?.format ?? 'json',
      {
        pretty: this.config.serialize?.pretty,
        includeMetadata: this.config.serialize?.includeMetadata,
        includeBounds: this.config.serialize?.includeBounds,
      }
    );

    return typeof serialized.content === 'string' 
      ? serialized.content 
      : JSON.stringify(serialized.content);
  }

  /**
   * Execute an action
   */
  async execute(command: ActionCommand): Promise<ActionResult> {
    this.log('info', 'Executing action', command);
    
    const result = await this.executor.execute(command, this.currentContext ?? undefined);
    
    this.log(result.success ? 'info' : 'error', 'Action result', result);
    
    // Re-scan after action to update context
    if (result.success) {
      setTimeout(() => this.scan(), 100);
    }
    
    return result;
  }

  /**
   * Execute multiple actions in sequence
   */
  async executeBatch(commands: ActionCommand[]): Promise<ActionResult[]> {
    this.log('info', `Executing batch of ${commands.length} actions`);
    
    const results = await this.executor.executeBatch(commands, this.currentContext ?? undefined);
    
    // Re-scan after batch
    setTimeout(() => this.scan(), 100);
    
    return results;
  }

  /**
   * Find element by selector
   */
  findElement(selector: string): UIElement | null {
    if (!this.currentContext) {
      return null;
    }

    return this.currentContext.elements.find(el => el.selector === selector) ?? null;
  }

  /**
   * Find elements by type
   */
  findElements(type: string): UIElement[] {
    if (!this.currentContext) {
      return [];
    }

    return this.currentContext.elements.filter(el => el.type === type);
  }

  /**
   * Track an object with proxy-based state tracking
   */
  trackState<T extends object>(name: string, obj: T): T {
    if (!this.stateTracker) {
      throw new Error('State tracking is not enabled. Set config.state.enabled to true.');
    }
    
    this.log('debug', `Tracking state: ${name}`);
    return this.stateTracker.track(name, obj);
  }

  /**
   * Register a state getter for manual state tracking
   */
  registerState(name: string, getter: () => any): void {
    if (!this.stateTracker) {
      throw new Error('State tracking is not enabled. Set config.state.enabled to true.');
    }
    
    this.log('debug', `Registering state getter: ${name}`);
    this.stateTracker.register(name, getter);
  }

  /**
   * Unregister a state getter
   */
  unregisterState(name: string): void {
    if (!this.stateTracker) {
      return;
    }
    
    this.log('debug', `Unregistering state: ${name}`);
    this.stateTracker.unregister(name);
  }

  /**
   * Remove a tracked object
   */
  untrackState(name: string): void {
    if (!this.stateTracker) {
      return;
    }
    
    this.log('debug', `Untracking state: ${name}`);
    this.stateTracker.untrack(name);
  }

  /**
   * Get list of tracked state names
   */
  getTrackedStateNames(): string[] {
    if (!this.stateTracker) {
      return [];
    }
    
    return this.stateTracker.getTrackedNames();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<UUICSConfig>): void {
    this.config = this.mergeConfig(this.config, config);
    
    // Update component configs
    this.scanner.updateConfig({
      depth: this.config.scan?.depth ?? 10,
      includeHidden: this.config.scan?.includeHidden ?? false,
      includeDisabled: this.config.scan?.includeDisabled ?? false,
      includeBounds: this.config.serialize?.includeBounds ?? false,
      filter: this.config.scan?.filter,
      maxElements: this.config.performance?.maxElements,
    });
    
    this.tracker.updateConfig({
      mutations: this.config.track?.mutations ?? true,
      clicks: this.config.track?.clicks ?? true,
      changes: this.config.track?.changes ?? true,
      submits: this.config.track?.submits ?? true,
      debounceDelay: this.config.track?.debounceDelay ?? 100,
    });
    
    this.log('info', 'Configuration updated');
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.scanner.clearCache();
    this.log('info', 'Cache cleared');
  }

  /**
   * Destroy the engine and cleanup
   */
  destroy(): void {
    this.log('info', 'Destroying UUICS Engine');
    
    // Stop tracking
    this.tracker.stop();
    
    // Clear state tracker
    if (this.stateTracker) {
      this.stateTracker.clear();
    }
    
    // Clear scan interval
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    
    // Clear subscribers
    this.subscribers.clear();
    
    // Clear context
    this.currentContext = null;
    
    // Clear cache
    this.clearCache();
    
    this.isInitialized = false;
    
    this.log('info', 'UUICS Engine destroyed');
  }

  /**
   * Check if engine is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get configuration
   */
  getConfig(): UUICSConfig {
    return { ...this.config };
  }

  /**
   * Merge configurations
   */
  private mergeConfig(base: UUICSConfig, override: Partial<UUICSConfig>): UUICSConfig {
    return {
      scan: { ...base.scan, ...override.scan },
      track: { ...base.track, ...override.track },
      serialize: { ...base.serialize, ...override.serialize },
      performance: { ...base.performance, ...override.performance },
      debug: { ...base.debug, ...override.debug },
      state: { ...base.state, ...override.state },
    };
  }

  /**
   * Logging helper
   */
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {
    if (!this.config.debug?.enabled) {
      return;
    }

    const configLevel = this.config.debug?.level ?? 'info';
    const levels = ['error', 'warn', 'info', 'debug'];
    
    if (levels.indexOf(level) > levels.indexOf(configLevel)) {
      return;
    }

    const prefix = '[UUICS]';
    
    if (data) {
      console[level](prefix, message, data);
    } else {
      console[level](prefix, message);
    }
  }
}

