/**
 * Mutation Tracker - Debounced mutation observer and event tracking
 */

import type { UUICSConfig } from '../types';
import { debounce } from '../utils';

/**
 * Tracker configuration
 */
interface TrackerConfig {
  mutations: boolean;
  clicks: boolean;
  changes: boolean;
  submits: boolean;
  debounceDelay: number;
}

/**
 * Change callback type
 */
type ChangeCallback = (trigger: 'mutation' | 'click' | 'change' | 'submit', target?: HTMLElement) => void;

/**
 * Mutation Tracker class
 */
export class MutationTracker {
  private config: TrackerConfig;
  private observer: MutationObserver | null = null;
  private listeners: Map<string, EventListener> = new Map();
  private changeCallback: ChangeCallback | null = null;
  private debouncedOnChange: ReturnType<typeof debounce> | null = null;
  private isActive: boolean = false;

  constructor(config?: Partial<UUICSConfig>) {
    this.config = {
      mutations: config?.track?.mutations ?? true,
      clicks: config?.track?.clicks ?? true,
      changes: config?.track?.changes ?? true,
      submits: config?.track?.submits ?? true,
      debounceDelay: config?.track?.debounceDelay ?? 100,
    };
  }

  /**
   * Start tracking
   */
  start(callback: ChangeCallback): void {
    if (this.isActive) {
      console.warn('[UUICS Tracker] Already active');
      return;
    }

    this.changeCallback = callback;
    this.debouncedOnChange = debounce(
      (trigger: 'mutation' | 'click' | 'change' | 'submit', target?: HTMLElement) => {
        if (this.changeCallback) {
          this.changeCallback(trigger, target);
        }
      },
      this.config.debounceDelay
    );

    // Setup mutation observer
    if (this.config.mutations) {
      this.setupMutationObserver();
    }

    // Setup event listeners
    if (this.config.clicks) {
      this.setupClickListener();
    }

    if (this.config.changes) {
      this.setupChangeListener();
    }

    if (this.config.submits) {
      this.setupSubmitListener();
    }

    this.isActive = true;

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[UUICS Tracker] Started tracking');
    }
  }

  /**
   * Stop tracking
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    // Disconnect mutation observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Remove event listeners
    this.listeners.forEach((listener, eventType) => {
      document.body.removeEventListener(eventType, listener, true);
    });
    this.listeners.clear();

    // Cancel any pending debounced calls
    if (this.debouncedOnChange) {
      this.debouncedOnChange.cancel();
      this.debouncedOnChange = null;
    }

    this.changeCallback = null;
    this.isActive = false;

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[UUICS Tracker] Stopped tracking');
    }
  }

  /**
   * Setup mutation observer for DOM changes
   */
  private setupMutationObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      // Filter out irrelevant mutations
      const relevantMutations = mutations.filter(mutation => {
        // Ignore our own changes (elements with uuics- prefix)
        if (mutation.target instanceof HTMLElement) {
          const id = mutation.target.id;
          if (id && id.startsWith('uuics-')) {
            return false;
          }
        }

        // Only track structural changes and attribute changes on interactive elements
        if (mutation.type === 'childList') {
          return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
        }

        if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          return this.isInteractiveElement(target);
        }

        return false;
      });

      if (relevantMutations.length > 0 && this.debouncedOnChange) {
        const firstTarget = relevantMutations[0].target as HTMLElement;
        this.debouncedOnChange('mutation', firstTarget);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['value', 'disabled', 'checked', 'selected', 'class', 'style'],
    });
  }

  /**
   * Setup click event listener
   */
  private setupClickListener(): void {
    const listener = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (this.isInteractiveElement(target) && this.debouncedOnChange) {
        this.debouncedOnChange('click', target);
      }
    };

    document.body.addEventListener('click', listener, true);
    this.listeners.set('click', listener);
  }

  /**
   * Setup change event listener
   */
  private setupChangeListener(): void {
    const listener = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (this.isFormControl(target) && this.debouncedOnChange) {
        this.debouncedOnChange('change', target);
      }
    };

    // Listen for input and change events
    document.body.addEventListener('input', listener, true);
    document.body.addEventListener('change', listener, true);
    this.listeners.set('input', listener);
  }

  /**
   * Setup submit event listener
   */
  private setupSubmitListener(): void {
    const listener = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (target instanceof HTMLFormElement && this.debouncedOnChange) {
        this.debouncedOnChange('submit', target);
      }
    };

    document.body.addEventListener('submit', listener, true);
    this.listeners.set('submit', listener);
  }

  /**
   * Check if element is interactive
   */
  private isInteractiveElement(element: HTMLElement): boolean {
    const tag = element.tagName.toLowerCase();
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
    
    if (interactiveTags.includes(tag)) {
      return true;
    }

    // Check for click handlers
    if (element.hasAttribute('onclick') || 
        element.hasAttribute('ng-click') ||
        element.getAttribute('role') === 'button') {
      return true;
    }

    return false;
  }

  /**
   * Check if element is a form control
   */
  private isFormControl(element: HTMLElement): boolean {
    return element instanceof HTMLInputElement ||
           element instanceof HTMLTextAreaElement ||
           element instanceof HTMLSelectElement;
  }

  /**
   * Flush any pending changes immediately
   */
  flush(): void {
    if (this.debouncedOnChange) {
      this.debouncedOnChange.flush();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TrackerConfig>): void {
    const wasActive = this.isActive;
    const callback = this.changeCallback;

    if (wasActive) {
      this.stop();
    }

    this.config = { ...this.config, ...config };

    if (wasActive && callback) {
      this.start(callback);
    }
  }

  /**
   * Check if tracker is active
   */
  get active(): boolean {
    return this.isActive;
  }
}

