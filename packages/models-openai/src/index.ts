/**
 * OpenAI Model Adapter Example
 * 
 * This is a reference implementation showing how to integrate UUICS
 * with OpenAI GPT models. Users should adapt this to their needs.
 */

import type { PageContext, Action } from '@uuics/core';

/**
 * OpenAI adapter configuration
 */
export interface OpenAIAdapterConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

/**
 * OpenAI Adapter
 * 
 * Example adapter for integrating UUICS with OpenAI GPT models.
 * This demonstrates how to use function calling with UUICS actions.
 */
export class OpenAIAdapter {
  private apiKey: string;
  private model: string;
  private maxTokens: number;

  constructor(config: OpenAIAdapterConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'gpt-4-turbo';
    this.maxTokens = config.maxTokens ?? 2048;
  }

  /**
   * Convert UUICS actions to OpenAI function definitions
   */
  formatTools(actions: Action[]): any[] {
    const toolsByType: Record<string, Action[]> = {};

    // Group actions by type
    for (const action of actions) {
      if (!toolsByType[action.type]) {
        toolsByType[action.type] = [];
      }
      toolsByType[action.type].push(action);
    }

    // Create function definitions for each action type
    const tools: any[] = [];

    for (const [type, actionsOfType] of Object.entries(toolsByType)) {
      const tool: any = {
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
                enum: actionsOfType.map(a => a.target),
              },
            },
            required: ['target'],
          },
        },
      };

      // Add additional parameters if the action type requires them
      if (type === 'setValue' || type === 'select') {
        tool.function.parameters.properties.value = {
          type: 'string',
          description: 'The value to set',
        };
        tool.function.parameters.required.push('value');
      }

      tools.push(tool);
    }

    return tools;
  }

  /**
   * Send request to OpenAI API
   */
  async chat(prompt: string, context: PageContext, contextString: string): Promise<any> {
    const tools = this.formatTools(context.actions);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant helping to interact with a web page. Use the provided functions to perform actions.

Current Page Context:
${contextString}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        tools,
        tool_choice: 'auto',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Parse OpenAI response to extract action commands
   */
  parseResponse(response: any): any[] | null {
    const message = response.choices[0].message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      return message.tool_calls.map((call: any) => {
        const functionName = call.function.name;
        const args = JSON.parse(call.function.arguments);

        // Extract action type from function name (e.g., 'ui_click' -> 'click')
        const action = functionName.replace('ui_', '');

        return {
          action,
          target: args.target,
          parameters: args.value ? { value: args.value } : undefined,
        };
      });
    }

    return null;
  }
}

