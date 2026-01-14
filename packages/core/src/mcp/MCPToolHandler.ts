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

      case CORE_TOOLS.HOVER:
        return this.handleHover(input);

      case CORE_TOOLS.WAIT_FOR:
        return this.handleWaitFor(input);

      case CORE_TOOLS.SCREENSHOT:
        return this.handleScreenshot(input);

      case CORE_TOOLS.GET_STATE:
        return this.handleGetState(input);

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

  private async handleHover(input: Record<string, unknown>): Promise<ActionResult> {
    const target = input.target as string;
    const duration = (input.duration as number) || 0;
    
    if (!target) {
      return { success: false, message: 'Missing target parameter', error: 'Missing target' };
    }
    
    const result = await this.engine.execute({
      action: 'hover',
      target,
    });
    
    // If duration is specified, wait before returning
    if (duration > 0 && result.success) {
      await this.delay(duration);
    }
    
    return result;
  }

  private async handleWaitFor(input: Record<string, unknown>): Promise<ActionResult> {
    const selector = input.selector as string | undefined;
    const condition = (input.condition as string) || 'visible';
    const timeout = (input.timeout as number) || 5000;
    const pollInterval = (input.poll_interval as number) || 100;
    
    // If no selector and no timeout, just wait a bit
    if (!selector) {
      if (timeout > 0) {
        await this.delay(Math.min(timeout, 10000)); // Cap at 10 seconds
        return {
          success: true,
          message: `Waited ${timeout}ms`,
        };
      }
      return { success: false, message: 'Either selector or timeout is required', error: 'Missing parameters' };
    }
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      let conditionMet = false;
      
      switch (condition) {
        case 'exists':
          conditionMet = element !== null;
          break;
        case 'not_exists':
          conditionMet = element === null;
          break;
        case 'visible':
          if (element instanceof HTMLElement) {
            const style = window.getComputedStyle(element);
            conditionMet = style.display !== 'none' && 
                          style.visibility !== 'hidden' && 
                          style.opacity !== '0' &&
                          element.offsetParent !== null;
          }
          break;
        case 'hidden':
          if (element === null) {
            conditionMet = true;
          } else if (element instanceof HTMLElement) {
            const style = window.getComputedStyle(element);
            conditionMet = style.display === 'none' || 
                          style.visibility === 'hidden' || 
                          style.opacity === '0' ||
                          element.offsetParent === null;
          }
          break;
        case 'enabled':
          if (element instanceof HTMLButtonElement || 
              element instanceof HTMLInputElement || 
              element instanceof HTMLSelectElement || 
              element instanceof HTMLTextAreaElement) {
            conditionMet = !element.disabled;
          }
          break;
        case 'disabled':
          if (element instanceof HTMLButtonElement || 
              element instanceof HTMLInputElement || 
              element instanceof HTMLSelectElement || 
              element instanceof HTMLTextAreaElement) {
            conditionMet = element.disabled;
          }
          break;
      }
      
      if (conditionMet) {
        return {
          success: true,
          message: `Element "${selector}" is ${condition}`,
          data: { elapsed: Date.now() - startTime },
        };
      }
      
      await this.delay(pollInterval);
    }
    
    return {
      success: false,
      message: `Timeout waiting for element "${selector}" to be ${condition}`,
      error: `Condition not met within ${timeout}ms`,
    };
  }

  private async handleScreenshot(input: Record<string, unknown>): Promise<ActionResult> {
    const selector = input.selector as string | undefined;
    const format = (input.format as string) || 'png';
    const quality = (input.quality as number) || 0.92;
    const scale = (input.scale as number) || 1;
    
    try {
      // Check if html2canvas or similar is available
      // For now, we use the native Canvas API for element screenshots
      // Full page screenshots require external libraries
      
      if (selector) {
        // Element screenshot using Canvas
        const element = document.querySelector(selector);
        if (!element || !(element instanceof HTMLElement)) {
          return {
            success: false,
            message: `Element not found: ${selector}`,
            error: 'Element not found',
          };
        }
        
        // Try to capture element using range and getClientRects
        const rect = element.getBoundingClientRect();
        
        // Create a canvas
        const canvas = document.createElement('canvas');
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          return {
            success: false,
            message: 'Canvas context not available',
            error: 'Canvas 2D context not supported',
          };
        }
        
        // Note: For complex element capture, html2canvas would be needed
        // This is a simplified version that captures basic element info
        ctx.scale(scale, scale);
        ctx.fillStyle = window.getComputedStyle(element).backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
        
        // Draw element border for debugging
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, rect.width - 2, rect.height - 2);
        
        // Add element info text
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.fillText(`${element.tagName.toLowerCase()}`, 10, 20);
        ctx.fillText(`${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`, 10, 40);
        
        const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        
        return {
          success: true,
          message: `Screenshot captured for element: ${selector}`,
          data: {
            dataUrl,
            width: rect.width,
            height: rect.height,
            format,
            note: 'Basic element bounds capture. For full element rendering, use html2canvas library.',
          },
        };
      }
      
      // Full page screenshot - requires external library
      // Return page info instead
      return {
        success: true,
        message: 'Full page screenshot info (requires html2canvas for actual capture)',
        data: {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          page: {
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight,
          },
          scroll: {
            x: window.scrollX,
            y: window.scrollY,
          },
          note: 'Full page screenshots require html2canvas library. Use selector for element-level capture.',
        },
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Screenshot capture failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async handleGetState(input: Record<string, unknown>): Promise<ActionResult> {
    const key = input.key as string | undefined;
    const includeMetadata = (input.include_metadata as boolean) || false;
    
    const context = this.engine.getContext();
    
    if (!context?.state) {
      return {
        success: false,
        message: 'No state available. State tracking may not be enabled.',
        error: 'State tracking not enabled or no state captured',
      };
    }
    
    if (key) {
      // Get specific state key
      if (!(key in context.state)) {
        return {
          success: false,
          message: `State key "${key}" not found`,
          error: 'Key not found',
          data: { availableKeys: Object.keys(context.state) },
        };
      }
      
      const value = context.state[key];
      
      if (includeMetadata) {
        return {
          success: true,
          message: `State for "${key}" retrieved`,
          data: {
            key,
            value,
            timestamp: context.timestamp,
            type: typeof value,
          },
        };
      }
      
      return {
        success: true,
        message: `State for "${key}" retrieved`,
        data: { [key]: value },
      };
    }
    
    // Get all state
    if (includeMetadata) {
      return {
        success: true,
        message: `All tracked state retrieved (${Object.keys(context.state).length} keys)`,
        data: {
          state: context.state,
          keys: Object.keys(context.state),
          timestamp: context.timestamp,
        },
      };
    }
    
    return {
      success: true,
      message: `All tracked state retrieved (${Object.keys(context.state).length} keys)`,
      data: context.state,
    };
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
    const nonMutating = [
      CORE_TOOLS.SCAN, 
      CORE_TOOLS.GET_CONTEXT, 
      CORE_TOOLS.GET_ELEMENT,
      CORE_TOOLS.GET_STATE,
      CORE_TOOLS.SCREENSHOT,
      CORE_TOOLS.WAIT_FOR,
      CORE_TOOLS.HOVER,
    ];
    return !nonMutating.includes(name as any);
  }

  /**
   * Delay helper for async operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
