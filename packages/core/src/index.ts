/**
 * UUICS Core - Universal UI Context System
 * 
 * Main entry point for the core package
 */

// Main engine
export { UUICSEngine } from './UUICSEngine';

// MCP (Model Context Protocol) support
export { 
  MCPToolsGenerator,
  MCPToolHandler,
  CORE_TOOLS,
  DEFAULT_MCP_CONFIG,
} from './mcp';

export type {
  MCPTool,
  MCPToolCall,
  MCPToolResult,
  MCPGeneratorConfig,
  JSONSchema,
  JSONSchemaProperty,
  CoreToolName,
} from './mcp';

// Types
export type {
  // Element types
  UIElement,
  ElementType,
  
  // Context types
  PageContext,
  FormState,
  
  // Action types
  Action,
  ActionType,
  ActionCommand,
  ActionResult,
  ActionParameters,
  
  // Serialization types
  SerializationFormat,
  SerializedContext,
  
  // Configuration types
  UUICSConfig,
  
  // Event types
  ContextChangeEvent,
  ActionExecutedEvent,
  UUICSEvent,
  EventListener,
  
  // Utility types
  ContextSubscriber,
  DebouncedFunction,
} from './types';

// Components (for advanced usage)
export { DOMScanner } from './scanner';
export { MutationTracker } from './tracker';
export { ContextAggregator } from './aggregator';
export { Serializer } from './serializer';
export { ActionExecutor } from './executor';

// Utilities
export {
  debounce,
  hash,
  generateId,
  isElementVisible,
  getElementSelector,
  runInIdle,
  getElementBounds,
} from './utils';

export {
  sanitizeSelector,
  validateSelector,
  cleanAndValidateSelector,
} from './utils/selectorSanitizer';

export type { SanitizationResult } from './utils/selectorSanitizer';

