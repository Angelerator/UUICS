# @uuics/models-openai

Example OpenAI GPT adapter for Universal UI Context System (UUICS).

## Overview

This is a **reference implementation** showing how to integrate UUICS with OpenAI GPT models using function calling. Users should adapt this to their specific needs.

## Installation

```bash
npm install @uuics/core @uuics/models-openai
```

## Usage

```typescript
import { UUICSEngine } from '@uuics/core';
import { OpenAIAdapter } from '@uuics/models-openai';

// Create UUICS engine
const uuics = new UUICSEngine();
await uuics.initialize();

// Create OpenAI adapter
const openai = new OpenAIAdapter({
  apiKey: 'your-api-key',
  model: 'gpt-4-turbo',
  maxTokens: 2048,
});

// Get context
const context = uuics.getContext();
const contextString = uuics.serialize('natural');

// Send request to OpenAI
const userPrompt = 'Fill in the name field with John Doe';
const response = await openai.chat(userPrompt, context, contextString);

// Parse response and execute actions
const commands = openai.parseResponse(response);
if (commands) {
  for (const command of commands) {
    await uuics.execute(command);
  }
}
```

## API

### OpenAIAdapter

#### Constructor

```typescript
new OpenAIAdapter(config: OpenAIAdapterConfig)
```

**Config:**

```typescript
interface OpenAIAdapterConfig {
  apiKey: string;
  model?: string;        // Default: 'gpt-4-turbo'
  maxTokens?: number;    // Default: 2048
}
```

#### Methods

**formatTools(actions: Action[]): any[]**

Convert UUICS actions to OpenAI function definitions for tool calling.

**chat(prompt: string, context: PageContext, contextString: string): Promise<any>**

Send a chat request to OpenAI with context and tool definitions.

**parseResponse(response: any): ActionCommand[] | null**

Parse OpenAI's response to extract tool calls and convert to action commands.

## Function Calling

This adapter uses OpenAI's function calling feature. UUICS actions are automatically converted to function definitions:

```typescript
// UUICS actions like this:
{
  type: 'click',
  target: '#submit-btn',
  description: 'Click Submit button'
}

// Become OpenAI functions like this:
{
  type: 'function',
  function: {
    name: 'ui_click',
    description: 'Perform click action on a UI element',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['#submit-btn', '#cancel-btn']
        }
      },
      required: ['target']
    }
  }
}
```

## Customization

Customize the adapter for your needs:

1. **Tool Definitions**: Modify `formatTools()` to add custom parameters
2. **Response Handling**: Enhance `parseResponse()` for complex scenarios
3. **System Prompts**: Add domain-specific instructions in `chat()`
4. **Batch Actions**: Handle multiple tool calls in one response
5. **Validation**: Add action validation before execution

## Example: Custom Adapter

```typescript
import { OpenAIAdapter } from '@uuics/models-openai';

class MyOpenAIAdapter extends OpenAIAdapter {
  formatTools(actions: Action[]): any[] {
    const tools = super.formatTools(actions);
    
    // Add custom validation function
    tools.push({
      type: 'function',
      function: {
        name: 'validate_form',
        description: 'Validate form before submission',
        parameters: {
          type: 'object',
          properties: {
            formSelector: {
              type: 'string',
              description: 'CSS selector of the form',
            },
          },
          required: ['formSelector'],
        },
      },
    });
    
    return tools;
  }

  async chat(prompt: string, context: PageContext, contextString: string): Promise<any> {
    // Add custom system instructions
    const customInstructions = `
Before performing actions:
1. Validate all input values
2. Check for required fields
3. Ensure forms are valid before submission
    `;
    
    // Call parent method with enhanced context
    return super.chat(
      prompt,
      context,
      contextString + '\n\n' + customInstructions
    );
  }
}
```

## Streaming Example

```typescript
// Note: This example shows the concept - implement based on OpenAI SDK
class StreamingOpenAIAdapter extends OpenAIAdapter {
  async chatStream(
    prompt: string,
    context: PageContext,
    contextString: string,
    onChunk: (chunk: string) => void
  ): Promise<any> {
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
        stream: true,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant. ${contextString}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        tools,
      }),
    });

    // Handle streaming response
    const reader = response.body?.getReader();
    // Implement stream reading and chunk handling
  }
}
```

## Best Practices

### Rate Limiting

```typescript
class RateLimitedAdapter extends OpenAIAdapter {
  private lastCall = 0;
  private minInterval = 1000; // 1 second between calls

  async chat(prompt: string, context: PageContext, contextString: string): Promise<any> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      );
    }
    
    this.lastCall = Date.now();
    return super.chat(prompt, context, contextString);
  }
}
```

### Error Handling

```typescript
try {
  const response = await openai.chat(userPrompt, context, contextString);
  const commands = openai.parseResponse(response);
  
  if (commands) {
    for (const command of commands) {
      const result = await uuics.execute(command);
      if (!result.success) {
        console.error(`Action failed: ${result.error}`);
        break; // Stop on first failure
      }
    }
  }
} catch (error) {
  if (error.status === 429) {
    console.error('Rate limit exceeded');
  } else if (error.status === 401) {
    console.error('Invalid API key');
  } else {
    console.error('API error:', error);
  }
}
```

### Token Management

```typescript
// Limit context size to stay within token limits
const uuics = new UUICSEngine({
  scan: {
    depth: 5, // Reduce depth
    excludeSelectors: ['.ads', 'footer', 'nav'] // Exclude unnecessary elements
  },
  performance: {
    maxElements: 100 // Limit element count
  }
});

// Use concise format
const contextString = uuics.serialize('json'); // More token-efficient than 'natural'
```

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { OpenAIAdapter } from '@uuics/models-openai';

describe('OpenAIAdapter', () => {
  it('formats tools correctly', () => {
    const adapter = new OpenAIAdapter({ apiKey: 'test-key' });
    const actions = [
      { type: 'click', target: '#btn', description: 'Click button' }
    ];
    
    const tools = adapter.formatTools(actions);
    expect(tools[0].function.name).toBe('ui_click');
  });
});
```

## Cost Optimization

OpenAI API costs can add up. Optimize:

1. **Cache responses**: Store common patterns
2. **Limit context**: Use `rootSelectors` and `excludeSelectors`
3. **Use cheaper models**: GPT-3.5 for simple tasks
4. **Batch actions**: Combine multiple operations
5. **Set max_tokens**: Limit response length

Example:

```typescript
const openai = new OpenAIAdapter({
  apiKey: 'your-key',
  model: 'gpt-3.5-turbo', // Cheaper than GPT-4
  maxTokens: 512 // Limit response size
});
```

## Security

**⚠️ Never expose API keys in frontend code!**

Always use a backend proxy:

```typescript
// ❌ BAD - Exposes API key
const openai = new OpenAIAdapter({
  apiKey: 'sk-...' // Hard-coded key
});

// ✅ GOOD - Use backend proxy
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  body: JSON.stringify({ prompt, context })
});
```

## Model Comparison

| Model | Speed | Cost | Quality | Best For |
|-------|-------|------|---------|----------|
| GPT-4 Turbo | Medium | High | Excellent | Complex UI tasks |
| GPT-4 | Slow | Highest | Best | Critical operations |
| GPT-3.5 Turbo | Fast | Low | Good | Simple interactions |

## Limitations

- Function calling may not work with older models
- Context length limits (4K-128K tokens depending on model)
- Rate limits vary by account tier
- CORS policy prevents direct browser calls (requires proxy)

## Migration from Other Adapters

### From Claude Adapter

```typescript
// Before (Claude)
import { ClaudeAdapter } from '@uuics/models-claude';
const adapter = new ClaudeAdapter({ apiKey: 'sk-...' });

// After (OpenAI)
import { OpenAIAdapter } from '@uuics/models-openai';
const adapter = new OpenAIAdapter({ apiKey: 'sk-...' });

// API is identical
const response = await adapter.chat(prompt, context, contextString);
```

## Notes

- ✅ Requires OpenAI API key (get at https://platform.openai.com/)
- ✅ Function calling works best with GPT-4 and GPT-3.5 Turbo
- ⚠️ API calls cost money - implement rate limiting and monitoring
- ⚠️ This is a reference implementation - production requires error handling
- 💡 Consider using OpenAI's official SDK for advanced features
- 🔒 Always use a backend proxy to protect API keys

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
- [UUICS Core Documentation](../core/README.md)

## License

MIT - see [LICENSE](../../LICENSE) file for details.

## Support

- Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/uuics/issues)
- OpenAI Support: https://help.openai.com/
- Main Docs: [README](../../README.md)
