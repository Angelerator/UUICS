/**
 * Universal UI Context System (UUICS) - Core Types
 * 
 * Framework-agnostic, Model-agnostic type definitions for UI context tracking
 * and interaction automation.
 */

// ============================================================================
// ELEMENT TYPES
// ============================================================================

/**
 * Supported interactive element types
 */
export type ElementType =
  | 'button'
  | 'input'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'link'
  | 'form'
  | 'container'
  | 'text'
  | 'other';

/**
 * Represents an option within a select element
 */
export interface SelectOption {
  /** Option value attribute */
  value: string;
  
  /** Display label/text */
  label: string;
  
  /** Whether this option is currently selected */
  selected: boolean;
  
  /** Whether this option is disabled */
  disabled: boolean;
  
  /** Full text content */
  text: string;
  
  /** Option index in the select */
  index: number;
}

/**
 * Metadata for select elements
 */
export interface SelectMetadata {
  /** All available options */
  options: SelectOption[];
  
  /** Whether multiple selection is allowed */
  multiple: boolean;
  
  /** Currently selected value(s) */
  selectedValues: string[];
  
  /** Number of visible options */
  size?: number;
}

/**
 * Represents a single UI element in the DOM
 */
export interface UIElement {
  /** Unique identifier for the element */
  id: string;
  
  /** Element type classification */
  type: ElementType;
  
  /** HTML tag name (e.g., 'button', 'input') */
  tag: string;
  
  /** CSS selector to uniquely identify this element */
  selector: string;
  
  /** Human-readable label or description */
  label: string;
  
  /** Relevant HTML attributes */
  attributes: Record<string, string | boolean | number>;
  
  /** Current value (for inputs) */
  value?: string | number | boolean | string[];
  
  /** Text content of the element */
  text?: string;
  
  /** Whether the element is currently visible */
  visible: boolean;
  
  /** Whether the element is enabled/disabled */
  enabled: boolean;
  
  /** Child elements (for containers) */
  children?: UIElement[];
  
  /** Options for select elements */
  options?: SelectOption[];
  
  /** Select-specific metadata (for select elements only) */
  selectMetadata?: SelectMetadata;
  
  /** Bounding rectangle information */
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  /** Metadata for caching and change detection */
  metadata?: {
    /** Hash of element state for change detection */
    hash?: string;
    /** Last update timestamp */
    lastUpdated?: number;
    /** Additional metadata (e.g., options for select) */
    [key: string]: unknown;
  };
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Represents the complete UI context of a page
 */
export interface PageContext {
  /** Unique identifier for this context snapshot */
  id: string;
  
  /** Timestamp of context capture */
  timestamp: number;
  
  /** Current page URL */
  url: string;
  
  /** Page title */
  title: string;
  
  /** All interactive elements found on the page */
  elements: UIElement[];
  
  /** Available actions that can be performed */
  actions: Action[];
  
  /** Current form states (if any) */
  forms?: FormState[];
  
  /** Page metadata */
  metadata: {
    /** Total number of elements scanned */
    elementCount: number;
    /** Scan depth used */
    scanDepth: number;
    /** Time taken to scan (ms) */
    scanDuration: number;
    /** Whether scan was partial/truncated */
    partial: boolean;
  };
  
  /** Captured JavaScript state/variables (if state tracking enabled) */
  state?: Record<string, any>;
}

/**
 * Represents the state of a form
 */
export interface FormState {
  /** Form identifier */
  id: string;
  
  /** Form selector */
  selector: string;
  
  /** Form fields and their values */
  fields: Record<string, unknown>;
  
  /** Whether the form is valid */
  valid: boolean;
  
  /** Validation errors (if any) */
  errors?: Record<string, string>;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

/**
 * Supported action types
 */
export type ActionType =
  | 'click'
  | 'setValue'
  | 'submit'
  | 'select'
  | 'check'
  | 'uncheck'
  | 'focus'
  | 'scroll'
  | 'hover'
  | 'custom';

/**
 * Represents an available action on the page
 */
export interface Action {
  /** Unique action identifier */
  id: string;
  
  /** Action type */
  type: ActionType;
  
  /** Human-readable description */
  description: string;
  
  /** Target element selector */
  target: string;
  
  /** Parameter schema for this action */
  parameters?: ActionParameters;
  
  /** Whether this action is currently available */
  available: boolean;
}

/**
 * Parameter schema for an action
 */
export interface ActionParameters {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array';
    description?: string;
    required?: boolean;
    default?: unknown;
    enum?: unknown[];
  };
}

/**
 * Command to execute an action
 */
export interface ActionCommand {
  /** Action ID or type */
  action: string;
  
  /** Target element selector */
  target: string;
  
  /** Action parameters */
  parameters?: Record<string, unknown>;
  
  /** Optional custom script to execute */
  script?: string;
}

/**
 * Result of an action execution
 */
export interface ActionResult {
  /** Whether the action succeeded */
  success: boolean;
  
  /** Result message */
  message: string;
  
  /** Error details (if failed) */
  error?: string;
  
  /** Any return value from the action */
  data?: unknown;
  
  /** Updated context after action (optional) */
  context?: PageContext;
}

// ============================================================================
// SERIALIZATION TYPES
// ============================================================================

/**
 * Supported serialization formats
 */
export type SerializationFormat = 'json' | 'natural' | 'openapi';

/**
 * Serialized context in various formats
 */
export interface SerializedContext {
  /** Format of serialization */
  format: SerializationFormat;
  
  /** Serialized content */
  content: string | object;
  
  /** Timestamp of serialization */
  timestamp: number;
  
  /** Metadata about the serialization */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Configuration for UUICS Engine
 */
export interface UUICSConfig {
  /** Scanning configuration */
  scan?: {
    /** Auto-scan interval in milliseconds (0 = manual only) */
    interval?: number;
    
    /** Maximum DOM depth to scan */
    depth?: number;
    
    /** Include hidden elements */
    includeHidden?: boolean;
    
    /** Include disabled elements */
    includeDisabled?: boolean;
    
    /** Root CSS selectors to limit scanning scope (string or array) */
    rootSelectors?: string | string[];
    
    /** CSS selectors to exclude from scanning (string or array) */
    excludeSelectors?: string | string[];
    
    /** Regex patterns to match against selectors/IDs/classes for inclusion */
    includePatterns?: RegExp | RegExp[];
    
    /** Regex patterns to match against selectors/IDs/classes for exclusion */
    excludePatterns?: RegExp | RegExp[];
    
    /** HTML element types to include (e.g., ['input', 'button', 'select']) */
    includeElements?: string | string[];
    
    /** HTML element types to exclude (e.g., ['script', 'style', 'noscript']) */
    excludeElements?: string | string[];
    
    /** Custom element filter function */
    filter?: (element: HTMLElement) => boolean;
    
    /** Use idle callback for scanning */
    useIdleCallback?: boolean;
  };
  
  /** Tracking configuration */
  track?: {
    /** Track DOM mutations */
    mutations?: boolean;
    
    /** Track click events */
    clicks?: boolean;
    
    /** Track input changes */
    changes?: boolean;
    
    /** Track form submissions */
    submits?: boolean;
    
    /** Debounce delay for events (ms) */
    debounceDelay?: number;
  };
  
  /** Serialization configuration */
  serialize?: {
    /** Default format */
    format?: SerializationFormat;
    
    /** Include metadata in output */
    includeMetadata?: boolean;
    
    /** Pretty-print JSON */
    pretty?: boolean;
    
    /** Include element bounds */
    includeBounds?: boolean;
  };
  
  /** Performance configuration */
  performance?: {
    /** Enable caching */
    enableCache?: boolean;
    
    /** Cache TTL in milliseconds */
    cacheTTL?: number;
    
    /** Maximum number of elements to scan */
    maxElements?: number;
    
    /** Use Web Worker for scanning */
    useWorker?: boolean;
  };
  
  /** Debug configuration */
  debug?: {
    /** Enable debug logging */
    enabled?: boolean;
    
    /** Log level */
    level?: 'error' | 'warn' | 'info' | 'debug';
  };
  
  /** State tracking configuration */
  state?: {
    /** Enable state tracking */
    enabled?: boolean;
    
    /** Custom state capture function */
    capture?: () => Record<string, any>;
    
    /** Objects to auto-track with proxies */
    track?: Record<string, object>;
    
    /** Patterns to exclude from state snapshots (e.g., 'password', 'token', '*.secret') */
    exclude?: string[];
  };
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Event emitted when context changes
 */
export interface ContextChangeEvent {
  /** Event type */
  type: 'context-change';
  
  /** Updated context */
  context: PageContext;
  
  /** What triggered the change */
  trigger: 'scan' | 'mutation' | 'action' | 'manual';
  
  /** Timestamp */
  timestamp: number;
}

/**
 * Event emitted when an action is executed
 */
export interface ActionExecutedEvent {
  /** Event type */
  type: 'action-executed';
  
  /** Executed action */
  action: ActionCommand;
  
  /** Action result */
  result: ActionResult;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * All event types
 */
export type UUICSEvent = ContextChangeEvent | ActionExecutedEvent;

/**
 * Event listener callback
 */
export type EventListener<T extends UUICSEvent = UUICSEvent> = (event: T) => void;

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Callback for context updates
 */
export type ContextSubscriber = (context: PageContext) => void;

/**
 * Debounced function type
 */
export type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
};

