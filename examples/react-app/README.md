# UUICS React Example with Claude AI Chat

This example demonstrates the integration of UUICS with a React application, including an interactive Claude AI chat popup.

## Features

- Demo form with various input types
- Real-time UUICS context tracking
- Debug panel showing serialized context
- Claude AI chat interface

Claude AI Chat Popup

The chat popup demonstrates how to integrate Claude AI with UUICS to create an AI-powered assistant that can understand and interact with your web page.

CORS Limitation

Direct browser calls to the Claude API are blocked by CORS policy. This is a security feature implemented by Anthropic. The demo shows the UI integration, but requires a backend proxy to actually work.

How to Implement a Backend Proxy

To make the chat functional in production, you need to create a backend endpoint that:

1. Receives chat requests from your frontend
2. Forwards them to the Anthropic API with your API key
3. Returns the response to your frontend

Example Implementation

Node.js/Express:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { messages, context } = req.body;
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: context, // UUICS context as system prompt
      messages: messages
    })
  });
  
  const data = await response.json();
  res.json(data);
});

app.listen(3001);
```

Next.js API Route:

```typescript
// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, context } = req.body;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: context,
      messages: messages
    })
  });

  const data = await response.json();
  res.json(data);
}
```

Then update the ChatPopup component to call your backend instead of the Anthropic API directly:

```typescript
// In ChatPopup.tsx
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: userMessage }],
    context: contextString
  })
});

const data = await response.json();
const assistantMessage = data.content[0].text;
```

Running the Example

```bash
pnpm install
pnpm dev
```

The app will start on http://localhost:3006 (or the next available port).

Features Demonstrated

1. UUICS Context Tracking
   - Automatic scanning of DOM elements
   - Form state tracking
   - Available actions detection

2. Debug Panel
   - Switch between Natural Language, JSON, and OpenAPI formats
   - Real-time context updates
   - Element and action counts

3. Claude AI Chat (UI Demo)
   - Beautiful chat interface
   - API key setup screen
   - Message history
   - CORS limitation explanation with implementation guide
   - Error handling

Architecture

The example shows how to:
- Integrate UUICS with React using the UUICSProvider
- Use the useUICS hook to access context
- Serialize context for AI consumption
- Build a chat interface that can interact with the page
- Handle API limitations and provide user guidance

Note: This is a demonstration of the UI integration. For production use, implement a backend proxy as described above to handle API calls securely.

## Key Files

- `src/App.tsx` - Main application with UUICS provider
- `src/DemoForm.tsx` - Sample form demonstrating UUICS tracking
- `src/ChatPopup.tsx` - Claude AI chat interface
- `src/DebugPanel.tsx` - Context visualization panel

## Learning Points

This example shows:

1. **Provider Setup**: How to configure UUICSProvider at the app root
2. **Hook Usage**: Using `useUICS` to access context and execute actions
3. **State Tracking**: Tracking form state and application data
4. **AI Integration**: Connecting Claude AI with UUICS context
5. **Debug Tools**: Using DebugPanel for development
6. **Action Execution**: Running actions based on AI responses

## Customization

Modify the example for your needs:

```tsx
// Change scan configuration
<UUICSProvider
  config={{
    scan: {
      interval: 1000, // Faster scanning
      rootSelectors: ['#main-content'], // Limit scope
      excludeSelectors: ['.ignore-me'], // Skip elements
    },
    state: {
      enabled: true, // Enable state tracking
      exclude: ['*password*', '*token*'], // Protect sensitive data
    }
  }}
>
```

## Production Deployment

For production:

1. ✅ Implement backend proxy for API calls
2. ✅ Add error boundaries
3. ✅ Implement rate limiting
4. ✅ Add user authentication
5. ✅ Enable HTTPS
6. ✅ Add monitoring/logging
7. ✅ Optimize bundle size

## Performance

This example is optimized for development. For production:

- Set `scan.interval: 0` and scan manually
- Use `rootSelectors` to limit scope
- Enable `performance.enableCache`
- Lazy load the chat popup

## Contributing

Found an issue or want to improve the example? See [Contributing Guide](../../README.md#contributing).

## License

MIT - see [LICENSE](../../LICENSE)
