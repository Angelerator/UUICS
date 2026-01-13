/**
 * MCP Tools Generator
 * 
 * Generates MCP (Model Context Protocol) tool definitions from UUICS page context.
 * This enables Claude and other MCP-compatible AI models to natively call UI actions.
 */

import type { PageContext, UIElement } from '../types';
import type { 
  MCPTool, 
  MCPGeneratorConfig, 
  JSONSchema,
  JSONSchemaProperty 
} from './types';
import { DEFAULT_MCP_CONFIG, CORE_TOOLS } from './types';

/**
 * MCPToolsGenerator - Generates MCP tool definitions from UI context
 */
export class MCPToolsGenerator {
  private config: Required<MCPGeneratorConfig>;

  constructor(config: MCPGeneratorConfig = {}) {
    this.config = { ...DEFAULT_MCP_CONFIG, ...config };
  }

  /**
   * Generate all MCP tools from page context
   */
  generateTools(context?: PageContext | null): MCPTool[] {
    const tools: MCPTool[] = [];

    // Add core tools (always available)
    if (this.config.includeCoreTools) {
      tools.push(...this.generateCoreTools(context));
    }

    // Add dynamic tools based on current UI state
    if (this.config.generateDynamicTools && context) {
      tools.push(...this.generateDynamicTools(context));
    }

    // Add custom tools
    if (this.config.customTools.length > 0) {
      tools.push(...this.config.customTools);
    }

    return tools;
  }

  /**
   * Generate core UI interaction tools
   */
  private generateCoreTools(context?: PageContext | null): MCPTool[] {
    const tools: MCPTool[] = [];

    // ui_scan - Scan the page and get context
    tools.push({
      name: CORE_TOOLS.SCAN,
      description: 'Scan the current page to discover all interactive elements. Returns a structured context of the UI.',
      input_schema: {
        type: 'object',
        properties: {
          root_selector: {
            type: 'string',
            description: 'Optional CSS selector to limit scanning to a specific part of the page',
          },
        },
      },
      metadata: { category: 'context', mutates: false, executionTime: 'fast' },
    });

    // ui_get_context - Get current context without re-scanning
    tools.push({
      name: CORE_TOOLS.GET_CONTEXT,
      description: 'Get the current page context without re-scanning. Use ui_scan first if context is stale.',
      input_schema: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['json', 'natural', 'summary'],
            description: 'Output format for the context',
            default: 'natural',
          },
        },
      },
      metadata: { category: 'context', mutates: false, executionTime: 'fast' },
    });

    // ui_click - Click an element
    tools.push({
      name: CORE_TOOLS.CLICK,
      description: 'Click on an interactive element on the page.',
      input_schema: this.buildTargetSchema(context, ['button', 'link']),
      metadata: { category: 'interaction', mutates: true, executionTime: 'fast' },
    });

    // ui_type - Type text into an input
    tools.push({
      name: CORE_TOOLS.TYPE,
      description: 'Type text into an input field or textarea.',
      input_schema: {
        type: 'object',
        properties: {
          target: this.buildTargetProperty(context, ['input', 'textarea']),
          value: {
            type: 'string',
            description: 'The text to type into the input',
          },
          clear_first: {
            type: 'boolean',
            description: 'Whether to clear the input before typing (default: true)',
            default: true,
          },
        },
        required: ['target', 'value'],
      },
      metadata: { category: 'interaction', mutates: true, executionTime: 'fast' },
    });

    // ui_select - Select an option from dropdown
    tools.push({
      name: CORE_TOOLS.SELECT,
      description: 'Select an option from a dropdown/select element.',
      input_schema: {
        type: 'object',
        properties: {
          target: this.buildTargetProperty(context, ['select']),
          value: {
            type: 'string',
            description: 'The value or label of the option to select',
          },
        },
        required: ['target', 'value'],
      },
      metadata: { category: 'interaction', mutates: true, executionTime: 'fast' },
    });

    // ui_check - Check a checkbox
    tools.push({
      name: CORE_TOOLS.CHECK,
      description: 'Check (enable) a checkbox.',
      input_schema: this.buildTargetSchema(context, ['checkbox']),
      metadata: { category: 'interaction', mutates: true, executionTime: 'fast' },
    });

    // ui_uncheck - Uncheck a checkbox
    tools.push({
      name: CORE_TOOLS.UNCHECK,
      description: 'Uncheck (disable) a checkbox.',
      input_schema: this.buildTargetSchema(context, ['checkbox']),
      metadata: { category: 'interaction', mutates: true, executionTime: 'fast' },
    });

    // ui_submit - Submit a form
    tools.push({
      name: CORE_TOOLS.SUBMIT,
      description: 'Submit a form.',
      input_schema: this.buildTargetSchema(context, ['form']),
      metadata: { category: 'interaction', mutates: true, executionTime: 'medium' },
    });

    // ui_scroll - Scroll to an element
    tools.push({
      name: CORE_TOOLS.SCROLL,
      description: 'Scroll the page to bring an element into view.',
      input_schema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'CSS selector of the element to scroll to',
          },
          behavior: {
            type: 'string',
            enum: ['smooth', 'instant', 'auto'],
            description: 'Scroll behavior',
            default: 'smooth',
          },
        },
        required: ['target'],
      },
      metadata: { category: 'interaction', mutates: false, executionTime: 'fast' },
    });

    // ui_focus - Focus an element
    tools.push({
      name: CORE_TOOLS.FOCUS,
      description: 'Set focus on an interactive element.',
      input_schema: this.buildTargetSchema(context, ['input', 'textarea', 'button', 'select']),
      metadata: { category: 'interaction', mutates: false, executionTime: 'fast' },
    });

    // ui_get_element - Get details about a specific element
    tools.push({
      name: CORE_TOOLS.GET_ELEMENT,
      description: 'Get detailed information about a specific element.',
      input_schema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of the element',
          },
        },
        required: ['selector'],
      },
      metadata: { category: 'context', mutates: false, executionTime: 'fast' },
    });

    // ui_execute_batch - Execute multiple actions in sequence
    tools.push({
      name: CORE_TOOLS.EXECUTE_BATCH,
      description: 'Execute multiple UI actions in sequence. Useful for complex workflows.',
      input_schema: {
        type: 'object',
        properties: {
          actions: {
            type: 'array',
            description: 'Array of actions to execute in order',
            items: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['click', 'type', 'select', 'check', 'uncheck', 'submit', 'scroll', 'focus'],
                },
                target: { type: 'string' },
                value: { type: 'string' },
              },
            },
          },
          stop_on_error: {
            type: 'boolean',
            description: 'Whether to stop execution on first error',
            default: true,
          },
        },
        required: ['actions'],
      },
      metadata: { category: 'interaction', mutates: true, executionTime: 'medium' },
    });

    return tools;
  }

  /**
   * Generate dynamic tools based on current UI elements
   * These provide more specific, discoverable tools for the current page state
   */
  private generateDynamicTools(context: PageContext): MCPTool[] {
    const tools: MCPTool[] = [];
    let toolCount = 0;

    for (const element of context.elements) {
      if (toolCount >= this.config.maxDynamicTools) break;
      if (!this.config.elementTypes.includes(element.type)) continue;
      if (!element.enabled || !element.visible) continue;

      const tool = this.generateToolForElement(element);
      if (tool) {
        tools.push(tool);
        toolCount++;
      }
    }

    return tools;
  }

  /**
   * Generate a specific tool for an element
   */
  private generateToolForElement(element: UIElement): MCPTool | null {
    const prefix = this.config.toolPrefix;
    const safeName = this.sanitizeName(element.label || element.id || element.selector);
    
    if (!safeName) return null;

    switch (element.type) {
      case 'button':
      case 'link':
        return {
          name: `${prefix}click_${safeName}`,
          description: `Click the "${element.label || element.text}" ${element.type}`,
          input_schema: {
            type: 'object',
            properties: {},
          },
          metadata: {
            category: 'dynamic',
            mutates: true,
            executionTime: 'fast',
          },
        };

      case 'input':
      case 'textarea':
        return {
          name: `${prefix}set_${safeName}`,
          description: `Set the value of "${element.label}" input field`,
          input_schema: {
            type: 'object',
            properties: {
              value: {
                type: 'string',
                description: `Value to enter in ${element.label}`,
              },
            },
            required: ['value'],
          },
          metadata: {
            category: 'dynamic',
            mutates: true,
            executionTime: 'fast',
          },
        };

      case 'select':
        const options = element.selectMetadata?.options || element.options || [];
        return {
          name: `${prefix}select_${safeName}`,
          description: `Select an option from "${element.label}" dropdown`,
          input_schema: {
            type: 'object',
            properties: {
              value: {
                type: 'string',
                description: `Option to select`,
                enum: options.map(o => o.value || o.label),
              },
            },
            required: ['value'],
          },
          metadata: {
            category: 'dynamic',
            mutates: true,
            executionTime: 'fast',
          },
        };

      case 'checkbox':
        return {
          name: `${prefix}toggle_${safeName}`,
          description: `Toggle the "${element.label}" checkbox`,
          input_schema: {
            type: 'object',
            properties: {
              checked: {
                type: 'boolean',
                description: 'Whether to check (true) or uncheck (false) the checkbox',
              },
            },
            required: ['checked'],
          },
          metadata: {
            category: 'dynamic',
            mutates: true,
            executionTime: 'fast',
          },
        };

      case 'radio':
        return {
          name: `${prefix}select_${safeName}`,
          description: `Select the "${element.label}" radio option`,
          input_schema: {
            type: 'object',
            properties: {},
          },
          metadata: {
            category: 'dynamic',
            mutates: true,
            executionTime: 'fast',
          },
        };

      default:
        return null;
    }
  }

  /**
   * Build target schema with available selectors
   */
  private buildTargetSchema(context: PageContext | null | undefined, types: string[]): JSONSchema {
    return {
      type: 'object',
      properties: {
        target: this.buildTargetProperty(context, types),
      },
      required: ['target'],
    };
  }

  /**
   * Build target property with enum of available selectors
   */
  private buildTargetProperty(context: PageContext | null | undefined, types: string[]): JSONSchemaProperty {
    const property: JSONSchemaProperty = {
      type: 'string',
      description: `CSS selector or label of the ${types.join('/')} element`,
    };

    // Add enum of available selectors if context is provided
    if (context?.elements) {
      const selectors = context.elements
        .filter(el => types.includes(el.type) && el.visible && el.enabled)
        .map(el => el.selector)
        .slice(0, 20); // Limit to prevent huge enums

      if (selectors.length > 0) {
        property.enum = selectors;
      }
    }

    return property;
  }

  /**
   * Sanitize a string to be a valid tool name component
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 30);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MCPGeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<MCPGeneratorConfig> {
    return { ...this.config };
  }
}
