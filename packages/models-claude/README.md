# @angelerator/uuics-models-claude

Example Claude AI adapter for Universal UI Context System (UUICS).

## Overview

This is a **reference implementation** showing how to integrate UUICS with Claude AI. Users should adapt this to their specific needs.

## Installation

```bash
npm install @angelerator/uuics-core @angelerator/uuics-models-claude
```

## Usage

```typescript
import { UUICSEngine } from '@angelerator/uuics-core';
import { ClaudeAdapter } from '@angelerator/uuics-models-claude';

// Create UUICS engine
const uuics = new UUICSEngine();
await uuics.initialize();

// Create Claude adapter
const claude = new ClaudeAdapter({
  apiKey: 'your-api-key',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 2048,
});

// Get context
const context = uuics.getContext();
const contextString = uuics.serialize('natural');

// Send request to Claude
const userPrompt = 'Fill in the name field with John Doe';
const response = await claude.chat(userPrompt, context, contextString);

// Parse response and execute action
const command = claude.parseResponse(response);
if (command) {
  await uuics.execute(command);
}
```

## API

### ClaudeAdapter

#### Constructor

```typescript
new ClaudeAdapter(config: ClaudeAdapterConfig)
```

**Config:**

```typescript
interface ClaudeAdapterConfig {
  apiKey: string;
  model?: string;        // Default: 'claude-sonnet-4-20250514'
  maxTokens?: number;    // Default: 2048
}
```

#### Methods

**formatContext(context: PageContext, naturalLanguage: string): string**

Format UUICS context for Claude's system prompt.

**chat(prompt: string, context: PageContext, contextString: string): Promise<string>**

Send a chat request to Claude with context.

**parseResponse(response: string): ActionCommand | null**

Parse Claude's response to extract action commands.

## Customization

This adapter is meant to be customized for your use case. Some ideas:

1. **Custom Prompts**: Modify `formatContext()` to include domain-specific instructions
2. **Response Parsing**: Enhance `parseResponse()` to handle more complex responses
3. **Error Handling**: Add retry logic and better error messages
4. **Streaming**: Implement streaming responses for better UX
5. **Tool Calling**: Use Claude's tool calling features instead of JSON parsing

## Example: Custom Adapter

```typescript
import { ClaudeAdapter } from '@angelerator/uuics-models-claude';

class MyClaudeAdapter extends ClaudeAdapter {
  formatContext(context: PageContext, naturalLanguage: string): string {
    return `You are a form-filling assistant.

${naturalLanguage}

Focus only on form-related elements. When filling forms:
1. Validate data before setting values
2. Fill required fields first
3. Check for validation errors

Respond with action commands as JSON.`;
  }

  parseResponse(response: string): any {
    // Custom parsing logic
    const parsed = super.parseResponse(response);
    
    // Add validation
    if (parsed && parsed.action === 'setValue') {
      // Validate value before returning
      if (this.validateValue(parsed.parameters.value)) {
        return parsed;
      }
    }
    
    return parsed;
  }

  private validateValue(value: any): boolean {
    // Your validation logic
    return value !== null && value !== undefined;
  }
}
```

## Tool Calling (Advanced)

Claude supports native tool calling. Here's how to use it with UUICS:

```typescript
class ToolCallingClaudeAdapter extends ClaudeAdapter {
  formatTools(actions: Action[]): any[] {
    return actions.map(action => ({
      name: `ui_${action.type}`,
      description: `Perform ${action.type} action on UI element`,
      input_schema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'CSS selector of target element'
          },
          value: {
            type: 'string',
            description: 'Value to set (for setValue action)'
          }
        },
        required: ['target']
      }
    }));
  }

  async chatWithTools(prompt: string, context: PageContext): Promise<any> {
    const tools = this.formatTools(context.actions);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{ role: 'user', content: prompt }],
        tools: tools
      })
    });

    return response.json();
  }
}
```

## Best Practices

### Rate Limiting

```typescript
class RateLimitedClaudeAdapter extends ClaudeAdapter {
  private lastCall = 0;
  private minInterval = 1000; // 1 second

  async chat(prompt: string, context: PageContext, contextString: string): Promise<string> {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    
    if (elapsed < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - elapsed)
      );
    }
    
    this.lastCall = Date.now();
    return super.chat(prompt, context, contextString);
  }
}
```

### Error Handling

```typescript
async function executeWithRetry(
  adapter: ClaudeAdapter,
  prompt: string,
  context: PageContext,
  contextString: string,
  maxRetries = 3
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await adapter.chat(prompt, context, contextString);
    } catch (error) {
      if (error.status === 429) {
        // Rate limited - wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      } else if (error.status >= 500) {
        // Server error - retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Client error - don't retry
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Context Optimization

```typescript
// Reduce context size for cost savings
const uuics = new UUICSEngine({
  scan: {
    depth: 5, // Limit depth
    excludeSelectors: ['.ads', 'footer', 'nav'], // Exclude noise
    rootSelectors: ['#main-form'] // Focus on relevant areas
  },
  performance: {
    maxElements: 100 // Limit element count
  }
});

// Use efficient serialization
const contextString = uuics.serialize('json'); // Compact
// vs 'natural' which is more verbose but LLM-friendly
```

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { ClaudeAdapter } from '@angelerator/uuics-models-claude';

describe('ClaudeAdapter', () => {
  it('formats context correctly', () => {
    const adapter = new ClaudeAdapter({ apiKey: 'test-key' });
    const context = { /* mock context */ };
    const formatted = adapter.formatContext(context, 'test context');
    
    expect(formatted).toContain('test context');
  });

  it('parses simple action commands', () => {
    const adapter = new ClaudeAdapter({ apiKey: 'test-key' });
    const response = JSON.stringify({
      action: 'click',
      target: '#submit-btn'
    });
    
    const command = adapter.parseResponse(response);
    expect(command).toBeDefined();
    expect(command.action).toBe('click');
  });
});
```

## Cost Optimization

Claude API costs vary by model. Optimize:

1. **Use Haiku for simple tasks**: Cheapest, fastest
2. **Use Sonnet for balance**: Good quality/cost ratio
3. **Use Opus only when needed**: Best quality, highest cost
4. **Limit context size**: Use scope control
5. **Cache system prompts**: Reduce repeated context

Example:

```typescript
// For simple form filling
const haikuAdapter = new ClaudeAdapter({
  apiKey: 'key',
  model: 'claude-3-haiku-20240307',
  maxTokens: 512
});

// For complex interactions
const sonnetAdapter = new ClaudeAdapter({
  apiKey: 'key',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 2048
});
```

## Security

**⚠️ Never expose API keys in frontend code!**

Always use a backend proxy:

```typescript
// Backend (Node.js/Express)
app.post('/api/ai/chat', async (req, res) => {
  const { prompt, context } = req.body;
  
  const adapter = new ClaudeAdapter({
    apiKey: process.env.CLAUDE_API_KEY // From environment
  });
  
  const response = await adapter.chat(prompt, context, '');
  res.json({ response });
});

// Frontend
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, context })
});
```

## Model Comparison

| Model | Speed | Cost | Quality | Best For |
|-------|-------|------|---------|----------|
| Claude 3 Haiku | Fast | Low | Good | Simple tasks, form filling |
| Claude 3.5 Sonnet | Medium | Medium | Excellent | General UI automation |
| Claude 3 Opus | Slower | High | Best | Complex reasoning |
| Claude Sonnet 4 | Fast | Medium | Excellent | Latest model, best balance |

## Streaming Responses

```typescript
class StreamingClaudeAdapter extends ClaudeAdapter {
  async chatStream(
    prompt: string,
    context: PageContext,
    contextString: string,
    onChunk: (text: string) => void
  ): Promise<void> {
    const systemPrompt = this.formatContext(context, contextString);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      // Parse SSE format and extract text
      onChunk(chunk);
    }
  }
}
```

## Limitations

- Claude API has rate limits (varies by tier)
- Context window limits (200K tokens for Claude 3+)
- CORS policy prevents direct browser calls (requires proxy)
- Streaming requires special handling

## Migration Guide

### From OpenAI

```typescript
// Before (OpenAI)
import { OpenAIAdapter } from '@angelerator/uuics-models-openai';
const adapter = new OpenAIAdapter({ apiKey: 'sk-...' });

// After (Claude)
import { ClaudeAdapter } from '@angelerator/uuics-models-claude';
const adapter = new ClaudeAdapter({ apiKey: 'sk-ant-...' });

// API is identical
const response = await adapter.chat(prompt, context, contextString);
```

## Notes

- ✅ Requires Claude API key (get at https://console.anthropic.com/)
- ✅ Supports Claude 3 Haiku, Sonnet, Opus, and Sonnet 4
- ⚠️ API calls cost money - implement rate limiting and monitoring
- ⚠️ This is a reference implementation - production requires robust error handling
- 💡 Consider implementing tool calling for better reliability
- 🔒 Always use a backend proxy to protect API keys
- 📊 Claude Sonnet 4 recommended for best performance/cost ratio

## Resources

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Claude Models](https://www.anthropic.com/claude)
- [Tool Use Guide](https://docs.anthropic.com/claude/docs/tool-use)
- [UUICS Core Documentation](../core/README.md)

## License

MIT - see [LICENSE](../../LICENSE) file for details.

## Support

- Issues: [GitHub Issues](https://github.com/Angelerator/uuics/issues)
- Anthropic Support: https://support.anthropic.com/
- Main Docs: [README](../../README.md)
