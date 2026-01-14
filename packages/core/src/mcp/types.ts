/**
 * MCP (Model Context Protocol) Types for UUICS
 * 
 * These types define the interface between UUICS and MCP-compatible AI models
 * like Claude, enabling native tool calling for UI interactions.
 */

// ============================================================================
// MCP TOOL DEFINITION TYPES
// ============================================================================

/**
 * JSON Schema for tool parameters
 */
export interface JSONSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  description?: string;
}

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: (string | number | boolean)[];
  items?: JSONSchemaProperty;
  default?: unknown;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

/**
 * MCP Tool Definition
 * Follows the Anthropic MCP specification for tool definitions
 */
export interface MCPTool {
  /** Unique tool name (snake_case recommended) */
  name: string;
  
  /** Human-readable description of what the tool does */
  description: string;
  
  /** JSON Schema for tool input parameters */
  input_schema: JSONSchema;
  
  /** Optional metadata */
  metadata?: {
    /** Category for grouping tools */
    category?: string;
    /** Whether this tool modifies state */
    mutates?: boolean;
    /** Estimated execution time hint */
    executionTime?: 'fast' | 'medium' | 'slow';
  };
}

/**
 * MCP Tool Call from AI model
 */
export interface MCPToolCall {
  /** Tool name to execute */
  name: string;
  
  /** Input parameters for the tool */
  input: Record<string, unknown>;
  
  /** Optional tool call ID (for tracking) */
  id?: string;
}

/**
 * Result of an MCP tool execution
 */
export interface MCPToolResult {
  /** Whether the tool executed successfully */
  success: boolean;
  
  /** Result content (can be string, JSON, or error) */
  content: string | object;
  
  /** Error message if failed */
  error?: string;
  
  /** Tool call ID (echoed back for tracking) */
  id?: string;
  
  /** Optional metadata about execution */
  metadata?: {
    /** Execution time in milliseconds */
    executionTime?: number;
    /** Whether UI state changed */
    stateChanged?: boolean;
  };
}

// ============================================================================
// MCP GENERATOR CONFIGURATION
// ============================================================================

/**
 * Configuration for MCP tools generation
 */
export interface MCPGeneratorConfig {
  /**
   * Include core UI interaction tools
   * @default true
   */
  includeCoreTools?: boolean;
  
  /**
   * Generate dynamic tools from current UI state
   * @default true
   */
  generateDynamicTools?: boolean;
  
  /**
   * Maximum number of dynamic tools to generate
   * @default 50
   */
  maxDynamicTools?: number;
  
  /**
   * Tool name prefix
   * @default 'ui_'
   */
  toolPrefix?: string;
  
  /**
   * Include element bounds in tool descriptions
   * @default false
   */
  includeBounds?: boolean;
  
  /**
   * Custom tool definitions to include
   */
  customTools?: MCPTool[];
  
  /**
   * Element types to generate tools for
   * @default ['button', 'input', 'select', 'checkbox', 'radio', 'link', 'textarea']
   */
  elementTypes?: string[];
}

/**
 * Default MCP generator configuration
 */
export const DEFAULT_MCP_CONFIG: Required<MCPGeneratorConfig> = {
  includeCoreTools: true,
  generateDynamicTools: true,
  maxDynamicTools: 50,
  toolPrefix: 'ui_',
  includeBounds: false,
  customTools: [],
  elementTypes: ['button', 'input', 'select', 'checkbox', 'radio', 'link', 'textarea'],
};

// ============================================================================
// CORE TOOL NAMES
// ============================================================================

/**
 * Core tool names (always available)
 */
export const CORE_TOOLS = {
  SCAN: 'ui_scan',
  CLICK: 'ui_click',
  TYPE: 'ui_type',
  SELECT: 'ui_select',
  CHECK: 'ui_check',
  UNCHECK: 'ui_uncheck',
  SUBMIT: 'ui_submit',
  SCROLL: 'ui_scroll',
  FOCUS: 'ui_focus',
  HOVER: 'ui_hover',
  WAIT_FOR: 'ui_wait_for',
  SCREENSHOT: 'ui_screenshot',
  GET_STATE: 'ui_get_state',
  GET_CONTEXT: 'ui_get_context',
  GET_ELEMENT: 'ui_get_element',
  EXECUTE_BATCH: 'ui_execute_batch',
} as const;

export type CoreToolName = typeof CORE_TOOLS[keyof typeof CORE_TOOLS];
