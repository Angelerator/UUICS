/**
 * MCP Tool Handler
 * 
 * Handles execution of MCP tool calls by delegating to UUICS ActionExecutor.
 * Provides the bridge between MCP tool calls from AI models and actual UI actions.
 */

import type { UUICSEngine } from '../UUICSEngine';
import type { ActionCommand, ActionResult, PageContext } from '../types';
import type { MCPToolCall, MCPToolResult } from './types';
import { CORE_TOOLS } from './types';

/**
 * MCPToolHandler - Handles MCP tool calls and delegates to UUICS
 */
export class MCPToolHandler {
  private engine: UUICSEngine;
  private dynamicToolMap: Map<string, { selector: string; action: string }> = new Map();

  constructor(engine: UUICSEngine) {
    this.engine = engine;
  }

  /**
   * Handle an MCP tool call
   */
  async handleToolCall(toolCall: MCPToolCall): Promise<MCPToolResult> {
    const startTime = performance.now();
    
    try {
      const result = await this.executeToolCall(toolCall);
      
      return {
        success: result.success,
        content: result.success ? result.message : result.error || 'Unknown error',
        error: result.success ? undefined : result.error,
        id: toolCall.id,
        metadata: {
          executionTime: performance.now() - startTime,
          stateChanged: result.success,
        },
      };
    } catch (error) {
      return {
        success: false,
        content: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.message : String(error),
        id: toolCall.id,
        metadata: {
          executionTime: performance.now() - startTime,
          stateChanged: false,
        },
      };
    }
  }

  /**
   * Handle multiple tool calls in sequence
   */
  async handleToolCalls(toolCalls: MCPToolCall[]): Promise<MCPToolResult[]> {
    const results: MCPToolResult[] = [];
    
    for (const toolCall of toolCalls) {
      const result = await this.handleToolCall(toolCall);
      results.push(result);
      
      // If a tool failed and it's a mutating action, we might want to stop
      if (!result.success && this.isMutatingTool(toolCall.name)) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Execute a specific tool call
   */
  private async executeToolCall(toolCall: MCPToolCall): Promise<ActionResult> {
    const { name, input } = toolCall;

    // Handle core tools
    switch (name) {
      case CORE_TOOLS.SCAN:
        return this.handleScan(input);

      case CORE_TOOLS.GET_CONTEXT:
        return this.handleGetContext(input);

      case CORE_TOOLS.CLICK:
        return this.handleClick(input);

      case CORE_TOOLS.TYPE:
        return this.handleType(input);

      case CORE_TOOLS.SELECT:
        return this.handleSelect(input);

      case CORE_TOOLS.CHECK:
        return this.handleCheck(input);

      case CORE_TOOLS.UNCHECK:
        return this.handleUncheck(input);

      case CORE_TOOLS.SUBMIT:
        return this.handleSubmit(input);

      case CORE_TOOLS.SCROLL:
        return this.handleScroll(input);

      case CORE_TOOLS.FOCUS:
        return this.handleFocus(input);

      case CORE_TOOLS.GET_ELEMENT:
        return this.handleGetElement(input);

      case CORE_TOOLS.EXECUTE_BATCH:
        return this.handleExecuteBatch(input);

      default:
        // Check for dynamic tools
        return this.handleDynamicTool(name, input);
    }
  }

  // ============================================================================
  // CORE TOOL HANDLERS
  // ============================================================================

  private async handleScan(input: Record<string, unknown>): Promise<ActionResult> {
    const rootSelector = input.root_selector as string | undefined;
    
    let root: HTMLElement | undefined;
    if (rootSelector) {
      const element = document.querySelector(rootSelector);
      if (element instanceof HTMLElement) {
        root = element;
      }
    }
    
    const context = await this.engine.scan(root);
    
    // Update dynamic tool map
    this.updateDynamicToolMap(context);
    
    return {
      success: true,
      message: `Scanned page: found ${context.elements.length} elements`,
      data: {
        elementCount: context.elements.length,
        url: context.url,
        title: context.title,
      },
    };
  }

  private async handleGetContext(input: Record<string, unknown>): Promise<ActionResult> {
    const format = (input.format as string) || 'natural';
    const context = this.engine.getContext();
    
    if (!context) {
      return {
        success: false,
        message: 'No context available. Call ui_scan first.',
        error: 'No context',
      };
    }
    
    if (format === 'summary') {
      const summary = this.generateContextSummary(context);
      return {
        success: true,
        message: summary,
        data: { format: 'summary' },
      };
    }
    
    const serialized = this.engine.serialize(format as 'json' | 'natural');
    
    return {
      success: true,
      message: serialized,
      data: { format },
    };
  }

  private async handleClick(input: Record<string, unknown>): Promise<ActionResult> {
    const target = input.target as string;
    if (!target) {
      return { success: false, message: 'Missing target parameter', error: 'Missing target' };
    }
    
    return this.engine.execute({
      action: 'click',
      target,
    });
  }

  private async handleType(input: Record<string, unknown>): Promise<ActionResult> {
    const target = input.target as string;
    const value = input.value as string;
    const clearFirst = input.clear_first !== false;
    
    if (!target || value === undefined) {
      return { success: false, message: 'Missing target or value parameter', error: 'Missing parameters' };
    }
    
    // If clearing first, we set the value directly
    // Otherwise, we could append (not yet supported in base executor)
    return this.engine.execute({
      action: 'setValue',
      target,
      parameters: { value: clearFirst ? value : value },
    });
  }

  private async handleSelect(input: Record<string, unknown>): Promise<ActionResult> {
    const target = input.target as string;
    const value = input.value as string;
    
    if (!target || !value) {
      return { success: false, message: 'Missing target or value parameter', error: 'Missing parameters' };
    }
    
    return this.engine.execute({
      action: 'select',
      target,
      parameters: { value },
    });
  }

  private async handleCheck(input: Record<string, unknown>): Promise<ActionResult> {
    const target = input.target as string;
    if (!target) {
      return { success: false, message: 'Missing target parameter', error: 'Missing target' };
    }
    
    return this.engine.execute({
      action: 'check',
      target,
    });
  }

  private async handleUncheck(input: Record<string, unknown>): Promise<ActionResult> {
    const target = input.target as string;
    if (!target) {
      return { success: false, message: 'Missing target parameter', error: 'Missing target' };
    }
    
    return this.engine.execute({
      action: 'uncheck',
      target,
    });
  }

  private async handleSubmit(input: Record<string, unknown>): Promise<ActionResult> {
    const target = input.target as string;
    if (!target) {
      return { success: false, message: 'Missing target parameter', error: 'Missing target' };
    }
    
    return this.engine.execute({
      action: 'submit',
      target,
    });
  }

  private async handleScroll(input: Record<string, unknown>): Promise<ActionResult> {
    const target = input.target as string;
    const behavior = (input.behavior as ScrollBehavior) || 'smooth';
    
    if (!target) {
      return { success: false, message: 'Missing target parameter', error: 'Missing target' };
    }
    
    return this.engine.execute({
      action: 'scroll',
      target,
      parameters: { behavior },
    });
  }

  private async handleFocus(input: Record<string, unknown>): Promise<ActionResult> {
    const target = input.target as string;
    if (!target) {
      return { success: false, message: 'Missing target parameter', error: 'Missing target' };
    }
    
    return this.engine.execute({
      action: 'focus',
      target,
    });
  }

  private async handleGetElement(input: Record<string, unknown>): Promise<ActionResult> {
    const selector = input.selector as string;
    if (!selector) {
      return { success: false, message: 'Missing selector parameter', error: 'Missing selector' };
    }
    
    const element = this.engine.findElement(selector);
    
    if (!element) {
      return {
        success: false,
        message: `Element not found: ${selector}`,
        error: 'Element not found',
      };
    }
    
    return {
      success: true,
      message: `Found element: ${element.label || element.type}`,
      data: element,
    };
  }

  private async handleExecuteBatch(input: Record<string, unknown>): Promise<ActionResult> {
    const actions = input.actions as Array<{ action: string; target: string; value?: string }>;
    const stopOnError = input.stop_on_error !== false;
    
    if (!actions || !Array.isArray(actions)) {
      return { success: false, message: 'Missing or invalid actions array', error: 'Invalid actions' };
    }
    
    const commands: ActionCommand[] = actions.map(a => ({
      action: this.mapActionName(a.action),
      target: a.target,
      parameters: a.value ? { value: a.value } : undefined,
    }));
    
    const results = await this.engine.executeBatch(commands);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    // Check if we should have stopped early
    if (stopOnError && failCount > 0) {
      const firstFailIndex = results.findIndex(r => !r.success);
      return {
        success: false,
        message: `Batch stopped at action ${firstFailIndex + 1}: ${results[firstFailIndex].error}`,
        error: results[firstFailIndex].error,
        data: { results: results.slice(0, firstFailIndex + 1) },
      };
    }
    
    return {
      success: failCount === 0,
      message: `Executed ${successCount}/${results.length} actions successfully`,
      data: { results },
    };
  }

  // ============================================================================
  // DYNAMIC TOOL HANDLERS
  // ============================================================================

  private async handleDynamicTool(name: string, input: Record<string, unknown>): Promise<ActionResult> {
    const toolInfo = this.dynamicToolMap.get(name);
    
    if (!toolInfo) {
      return {
        success: false,
        message: `Unknown tool: ${name}`,
        error: 'Tool not found',
      };
    }
    
    const { selector, action } = toolInfo;
    
    // Build action command based on tool type
    const command: ActionCommand = {
      action,
      target: selector,
    };
    
    // Handle parameters for specific action types
    if (action === 'setValue' && input.value !== undefined) {
      command.parameters = { value: input.value as string };
    } else if (action === 'select' && input.value !== undefined) {
      command.parameters = { value: input.value as string };
    } else if (action === 'check' && input.checked !== undefined) {
      // Toggle based on checked parameter
      command.action = input.checked ? 'check' : 'uncheck';
    }
    
    return this.engine.execute(command);
  }

  /**
   * Update the dynamic tool map from current context
   */
  private updateDynamicToolMap(context: PageContext): void {
    this.dynamicToolMap.clear();
    
    const prefix = 'ui_'; // Default prefix
    
    for (const element of context.elements) {
      if (!element.visible || !element.enabled) continue;
      
      const safeName = this.sanitizeName(element.label || element.id || element.selector);
      if (!safeName) continue;
      
      let toolName: string;
      let action: string;
      
      switch (element.type) {
        case 'button':
        case 'link':
          toolName = `${prefix}click_${safeName}`;
          action = 'click';
          break;
        case 'input':
        case 'textarea':
          toolName = `${prefix}set_${safeName}`;
          action = 'setValue';
          break;
        case 'select':
          toolName = `${prefix}select_${safeName}`;
          action = 'select';
          break;
        case 'checkbox':
          toolName = `${prefix}toggle_${safeName}`;
          action = 'check';
          break;
        case 'radio':
          toolName = `${prefix}select_${safeName}`;
          action = 'click';
          break;
        default:
          continue;
      }
      
      this.dynamicToolMap.set(toolName, { selector: element.selector, action });
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private mapActionName(action: string): string {
    const actionMap: Record<string, string> = {
      type: 'setValue',
      input: 'setValue',
      enter: 'setValue',
    };
    return actionMap[action] || action;
  }

  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 30);
  }

  private isMutatingTool(name: string): boolean {
    const nonMutating = [CORE_TOOLS.SCAN, CORE_TOOLS.GET_CONTEXT, CORE_TOOLS.GET_ELEMENT];
    return !nonMutating.includes(name as any);
  }

  private generateContextSummary(context: PageContext): string {
    const byType: Record<string, number> = {};
    
    for (const el of context.elements) {
      byType[el.type] = (byType[el.type] || 0) + 1;
    }
    
    const parts = [`Page: ${context.title}`, `URL: ${context.url}`, '', 'Elements:'];
    
    for (const [type, count] of Object.entries(byType)) {
      parts.push(`  - ${type}: ${count}`);
    }
    
    if (context.state && Object.keys(context.state).length > 0) {
      parts.push('', 'State:', `  ${Object.keys(context.state).join(', ')}`);
    }
    
    return parts.join('\n');
  }

  /**
   * Get list of registered dynamic tools
   */
  getDynamicTools(): string[] {
    return Array.from(this.dynamicToolMap.keys());
  }

  /**
   * Clear dynamic tool map
   */
  clearDynamicTools(): void {
    this.dynamicToolMap.clear();
  }
}
