/**
 * MCP (Model Context Protocol) Module for UUICS
 * 
 * Enables Claude and other MCP-compatible AI models to natively
 * interact with web UIs through structured tool calls.
 */

// Main classes
export { MCPToolsGenerator } from './MCPToolsGenerator';
export { MCPToolHandler } from './MCPToolHandler';

// Types
export type {
  MCPTool,
  MCPToolCall,
  MCPToolResult,
  MCPGeneratorConfig,
  JSONSchema,
  JSONSchemaProperty,
} from './types';

// Constants
export { CORE_TOOLS, DEFAULT_MCP_CONFIG } from './types';
export type { CoreToolName } from './types';
