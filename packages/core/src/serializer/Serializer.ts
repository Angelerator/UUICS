/**
 * Serializers - Convert PageContext to various formats
 */

import type { PageContext, SerializationFormat, SerializedContext, UIElement } from '../types';

/**
 * Serializer class
 */
export class Serializer {
  /**
   * Serialize context to specified format
   */
  serialize(
    context: PageContext,
    format: SerializationFormat = 'json',
    options: {
      pretty?: boolean;
      includeMetadata?: boolean;
      includeBounds?: boolean;
    } = {}
  ): SerializedContext {
    let content: string | object;

    switch (format) {
      case 'json':
        content = this.toJSON(context, options);
        break;
      case 'natural':
        content = this.toNaturalLanguage(context, options);
        break;
      case 'openapi':
        content = this.toOpenAPI(context, options);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return {
      format,
      content,
      timestamp: Date.now(),
      metadata: options.includeMetadata ? context.metadata : undefined,
    };
  }

  /**
   * Serialize to JSON
   */
  private toJSON(
    context: PageContext,
    options: { pretty?: boolean; includeBounds?: boolean }
  ): string {
    const data = {
      id: context.id,
      timestamp: context.timestamp,
      url: context.url,
      title: context.title,
      elements: options.includeBounds 
        ? context.elements 
        : context.elements.map(el => {
            const { bounds, ...rest } = el;
            return rest;
          }),
      actions: context.actions,
      forms: context.forms,
      metadata: context.metadata,
      state: context.state,
    };

    try {
      return JSON.stringify(data, this.createCircularReplacer(), options.pretty ? 2 : undefined);
    } catch (error) {
      // If JSON.stringify still fails (e.g., string too large), try without state
      console.warn('Failed to serialize with state, retrying without state:', error);
      const dataWithoutState = { ...data, state: undefined };
      return JSON.stringify(dataWithoutState, this.createCircularReplacer(), options.pretty ? 2 : undefined);
    }
  }

  /**
   * Create a replacer function that handles circular references and limits depth
   */
  private createCircularReplacer() {
    const seen = new WeakSet();
    let depth = 0;
    const maxDepth = 50;

    return (_key: string, value: any) => {
      // Limit serialization depth to prevent stack overflow
      if (typeof value === 'object' && value !== null) {
        if (depth > maxDepth) {
          return '[Max Depth Exceeded]';
        }
        
        // Detect circular references
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        
        seen.add(value);
        depth++;
        
        // Clone and recurse
        const result = value;
        depth--;
        
        return result;
      }
      
      // Truncate very long strings to prevent memory issues
      if (typeof value === 'string' && value.length > 10000) {
        return value.substring(0, 10000) + '... [truncated]';
      }
      
      return value;
    };
  }

  /**
   * Serialize to natural language (LLM-friendly)
   */
  private toNaturalLanguage(
    context: PageContext,
    options: { includeMetadata?: boolean }
  ): string {
    const lines: string[] = [];

    // Header
    lines.push('# Page Context\n');
    lines.push(`Page: ${context.title}`);
    lines.push(`URL: ${context.url}`);
    lines.push(`Timestamp: ${new Date(context.timestamp).toISOString()}`);
    lines.push('');

    // Summary
    lines.push('## Summary\n');
    lines.push(`Total Elements: ${context.elements.length}`);
    lines.push(`Available Actions: ${context.actions.length}`);
    if (context.forms && context.forms.length > 0) {
      lines.push(`Forms: ${context.forms.length}`);
    }
    lines.push('');

    // Interactive Elements
    lines.push('## Interactive Elements\n');
    
    const groupedElements = this.groupElementsByType(context.elements);
    
    for (const [type, elements] of Object.entries(groupedElements)) {
      if (elements.length === 0) continue;
      
      lines.push(`### ${this.capitalizeFirst(type)}s (${elements.length})\n`);
      
      for (const element of elements.slice(0, 50)) { // Show up to 50 elements per type
        lines.push(this.formatElementNatural(element));
      }
      
      if (elements.length > 50) {
        lines.push(`... and ${elements.length - 50} more\n`);
      }
      
      lines.push('');
    }

    // Forms
    if (context.forms && context.forms.length > 0) {
      lines.push('## Forms\n');
      
      for (const form of context.forms) {
        lines.push(`### Form: ${form.id}`);
        lines.push(`Valid: ${form.valid ? 'Yes' : 'No'}`);
        lines.push(`Fields: ${Object.keys(form.fields).length}`);
        
        if (form.errors && Object.keys(form.errors).length > 0) {
          lines.push('\nErrors:');
          for (const [field, error] of Object.entries(form.errors)) {
            lines.push(`- ${field}: ${error}`);
          }
        }
        
        lines.push('');
      }
    }

    // Available Actions
    lines.push('## Available Actions\n');
    
    const groupedActions = this.groupActionsByType(context.actions);
    
    for (const [type, actions] of Object.entries(groupedActions)) {
      if (actions.length === 0) continue;
      
      lines.push(`### ${this.capitalizeFirst(type)} (${actions.length})\n`);
      
      for (const action of actions.slice(0, 50)) { // Show up to 50 actions per type
        lines.push(`- ${action.description} (target: \`${action.target}\`)`);
      }
      
      if (actions.length > 50) {
        lines.push(`... and ${actions.length - 50} more`);
      }
      
      lines.push('');
    }

    // Metadata
    if (options.includeMetadata && context.metadata) {
      lines.push('## Metadata\n');
      lines.push(`Scan Duration: ${context.metadata.scanDuration.toFixed(2)}ms`);
      lines.push(`Scan Depth: ${context.metadata.scanDepth}`);
      lines.push(`Partial Scan: ${context.metadata.partial ? 'Yes' : 'No'}`);
    }

    // Application State
    if (context.state && Object.keys(context.state).length > 0) {
      lines.push('');
      lines.push('## Application State\n');
      
      for (const [key, value] of Object.entries(context.state)) {
        const valueStr = typeof value === 'object' 
          ? JSON.stringify(value, null, 2).split('\n').map((line, i) => i === 0 ? line : `  ${line}`).join('\n')
          : String(value);
        lines.push(`### ${key}\n`);
        lines.push('```');
        lines.push(valueStr);
        lines.push('```');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Serialize to OpenAPI format (tool calling)
   */
  private toOpenAPI(
    context: PageContext,
    options: { includeMetadata?: boolean }
  ): object {
    const tools: any[] = [];

    // Group actions by type
    const groupedActions = this.groupActionsByType(context.actions);

    for (const [type, actions] of Object.entries(groupedActions)) {
      if (actions.length === 0) continue;

      // Create a tool for this action type
      const tool = {
        type: 'function',
        function: {
          name: `ui_${type}`,
          description: `Perform ${type} action on a UI element`,
          parameters: {
            type: 'object',
            properties: {
              target: {
                type: 'string',
                description: 'CSS selector of the target element',
                enum: actions.map(a => a.target),
              },
            },
            required: ['target'],
          },
        },
      };

      // Add additional parameters if needed
      const firstAction = actions[0];
      if (firstAction.parameters) {
        for (const [paramName, paramDef] of Object.entries(firstAction.parameters)) {
          const param = paramDef as any;
          (tool.function.parameters.properties as any)[paramName] = {
            type: param.type,
            description: param.description,
          };
          
          if (param.enum) {
            (tool.function.parameters.properties as any)[paramName].enum = param.enum;
          }
          
          if (param.required) {
            if (!tool.function.parameters.required) {
              tool.function.parameters.required = ['target'];
            }
            tool.function.parameters.required.push(paramName);
          }
        }
      }

      tools.push(tool);
    }

    // Add state context if available
    const stateContext = context.state && Object.keys(context.state).length > 0
      ? { state: context.state }
      : undefined;

    return {
      openapi: '3.1.0',
      info: {
        title: `UI Context: ${context.title}`,
        version: '1.0.0',
        description: `Available UI actions for ${context.url}`,
      },
      servers: [
        {
          url: context.url,
        },
      ],
      tools,
      context: stateContext,
      metadata: options.includeMetadata ? context.metadata : undefined,
    };
  }

  /**
   * Format element for natural language output
   */
  private formatElementNatural(element: UIElement): string {
    const parts: string[] = [];
    
    // Include selector hint in label for disambiguation
    const selectorHint = element.selector.includes('#') 
      ? ` (${element.selector.split(/[>\s]/)[0]})` 
      : '';
    parts.push(`- **${element.label}${selectorHint}**`);
    
    if (element.value !== undefined && element.value !== '') {
      parts.push(`(value: "${element.value}")`);
    }
    
    // Emphasize disabled state for buttons and interactive elements
    if (!element.enabled) {
      if (element.type === 'button') {
        parts.push('⛔ **[DISABLED - DO NOT CLICK]**');
      } else {
        parts.push('[DISABLED]');
      }
    }
    
    // Include dropdown options if available, showing both label and value
    if (element.options && element.options.length > 0) {
      const optionsList = element.options
        .map(opt => `"${opt.label}" (value: ${opt.value})`)
        .join(', ');
      
      // Check if this is a multi-select element
      const isMultiSelect = element.selectMetadata?.multiple === true;
      const selectType = isMultiSelect ? 'MULTI-SELECT' : 'SINGLE-SELECT';
      
      parts.push(`[${selectType} OPTIONS: ${optionsList}]`);
    }
    
    parts.push(`→ \`${element.selector}\``);
    
    return parts.join(' ');
  }

  /**
   * Group elements by type
   */
  private groupElementsByType(elements: UIElement[]): Record<string, UIElement[]> {
    const grouped: Record<string, UIElement[]> = {};
    
    for (const element of elements) {
      if (!grouped[element.type]) {
        grouped[element.type] = [];
      }
      grouped[element.type].push(element);
    }
    
    return grouped;
  }

  /**
   * Group actions by type
   */
  private groupActionsByType(actions: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    for (const action of actions) {
      if (!grouped[action.type]) {
        grouped[action.type] = [];
      }
      grouped[action.type].push(action);
    }
    
    return grouped;
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

