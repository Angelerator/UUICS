# UUICS React Example

A complete React application demonstrating UUICS integration with Claude AI. This example shows how to build an AI-powered web assistant that can understand and interact with your UI.

## 🎯 What This Example Shows

- **React Integration**: Using UUICS with React context and hooks
- **Claude AI Chat**: Real-time conversation with Claude about the page
- **Action Execution**: Claude can click buttons, fill forms, select options
- **State Tracking**: Application state exposed to AI context
- **Multiple UI Components**: Forms, dropdowns, checkboxes, and more

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Claude Code subscription (for `claude login`)

### Setup

```bash
# From the repository root
pnpm install
pnpm build

# Navigate to this example
cd examples/react-app
```

### Running the Example

**Terminal 1 - Start the React app:**
```bash
pnpm dev
# Opens at http://localhost:5173 (or next available port)
```

**Terminal 2 - Start the Claude proxy:**
```bash
node claude-cli-proxy.cjs
# Proxy runs at http://localhost:3100
```

> **Note**: The Claude proxy uses your Claude Code subscription. Make sure you've run `claude login` at least once.

### Using the App

1. Open the app in your browser
2. Click the 🤖 button in the bottom-right corner
3. Click "Start Chatting"
4. Try commands like:
   - "Fill the name field with John Doe"
   - "Select France as the country"
   - "Check all the interest checkboxes"
   - "What options are available for the role dropdown?"

## 📂 Project Structure

```
react-app/
├── src/
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   ├── index.css            # Tailwind styles
│   │
│   ├── UUICSProvider.tsx    # React context & hooks for UUICS
│   ├── ClaudeAdapter.ts     # Claude AI integration
│   ├── ChatPopup.tsx        # Chat UI component
│   │
│   └── components/          # Demo UI components
│       ├── TextInputs.tsx
│       ├── SelectionControls.tsx
│       ├── CheckboxesSection.tsx
│       ├── RadioButtonsSection.tsx
│       ├── ActionButtons.tsx
│       ├── StateTracking.tsx
│       ├── OutputSection.tsx
│       └── ...
│
├── claude-cli-proxy.cjs     # Proxy server for Claude CLI
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 🔧 Key Components

### UUICSProvider.tsx

Provides UUICS context to the React component tree:

```tsx
import { UUICSProvider, useUUICSContext } from './UUICSProvider';

// Wrap your app
function App() {
  return (
    <UUICSProvider config={{ scan: { interval: 0 } }}>
      <MyComponent />
    </UUICSProvider>
  );
}

// Use in components
function MyComponent() {
  const { engine, context, scan, execute, serialize } = useUUICSContext();
  
  const handleScan = async () => {
    await scan();
    console.log('Elements:', context?.elements.length);
  };
  
  return <button onClick={handleScan}>Scan Page</button>;
}
```

### ClaudeAdapter.ts

Handles Claude AI integration:

```typescript
import { ClaudeAdapter } from './ClaudeAdapter';

const adapter = new ClaudeAdapter({
  apiKey: 'proxy-handles-key',
  proxyUrl: 'http://localhost:3100'
});

// Format context for Claude
const systemPrompt = adapter.formatContext(pageContext, serializedContext);

// Send message and get response
const response = await adapter.chat(userMessage, pageContext, serializedContext);

// Parse actions from response
const actions = adapter.parseResponse(response);
// Returns: [{ action: 'setValue', target: '#name', parameters: { value: 'John' } }]
```

### ChatPopup.tsx

The chat interface that ties everything together:

1. Scans the page when user sends a message
2. Serializes context to natural language
3. Sends to Claude via the adapter
4. Parses response for action commands
5. Executes actions on the page

## 🔌 Claude CLI Proxy

The `claude-cli-proxy.cjs` server:

- Runs on port 3100
- Uses your Claude Code subscription (no API key needed)
- Accepts requests from the React app
- Forwards to Claude CLI and returns responses

### How It Works

```
React App (Browser)
       │
       ▼ POST /api/chat
┌──────────────────┐
│ claude-cli-proxy │ ◀── Uses `claude` CLI
└──────────────────┘
       │
       ▼
   Claude API
```

### Alternative: Direct API Key

If you prefer using an API key directly, modify `ChatPopup.tsx`:

```typescript
const adapter = new ClaudeAdapter({
  apiKey: 'sk-ant-your-key-here',
  // Remove proxyUrl to call API directly
});
```

## 🎨 UI Features Demonstrated

### Form Elements
- Text inputs with labels
- Email, phone, number inputs
- Textareas for long text
- Date and time pickers
- Color picker
- Range slider

### Selection Controls
- Single-select dropdowns
- Multi-select dropdowns
- Radio button groups

### Toggles
- Checkboxes with labels
- Toggle switches

### Buttons
- Primary/secondary buttons
- Action buttons (save, submit, delete)

### State Tracking
- Proxy-based state tracking
- Manual state registration
- Real-time state display

## 🔄 How the AI Interaction Works

```
1. User: "Set the name to John"
   
2. App scans the page:
   - Finds #name input
   - Serializes to: "Name (#name) → `#name`"
   
3. Sends to Claude:
   - System: Context about page elements
   - User: "Set the name to John"
   
4. Claude responds:
   "I'll set the name field to John."
   ```json
   { "action": "setValue", "target": "#name", "parameters": { "value": "John" } }
   ```
   
5. App parses JSON and executes:
   await engine.execute({ action: 'setValue', target: '#name', parameters: { value: 'John' } });
   
6. Input field now contains "John"
```

## 🛠️ Customization

### Modifying the Claude Prompt

Edit `ClaudeAdapter.ts` to customize how Claude understands your page:

```typescript
formatContext(_context: PageContext, naturalLanguage: string): string {
  return `Your custom system prompt here...
  
  Page Context:
  ${naturalLanguage}
  
  Your custom instructions...`;
}
```

### Adding New Actions

The engine supports custom actions:

```typescript
await engine.execute({
  action: 'custom',
  target: '#element',
  script: 'element.scrollIntoView({ behavior: "smooth" })'
});
```

### Changing the Scan Configuration

Modify the provider config in `App.tsx`:

```tsx
<UUICSProvider config={{
  scan: {
    interval: 2000,  // Auto-scan every 2 seconds
    excludeSelectors: ['.ignore-me'],
    depth: 15
  },
  state: {
    enabled: true,
    exclude: ['*password*']
  }
}}>
```

## 🐛 Troubleshooting

### "Cannot connect to proxy server"

Make sure the Claude proxy is running:
```bash
node claude-cli-proxy.cjs
```

### "Claude CLI not found"

Install Claude Code and login:
```bash
# Install Claude Code from https://claude.ai/download
claude login
```

### Actions not working

Check the browser console for:
- Element selector issues
- Permission errors
- Network failures

## 📝 Example Conversations

**Form Filling:**
> "Fill out the form with name John Doe, email john@example.com, and select United States as the country"

**Information Queries:**
> "What options are available in the skills dropdown?"

**Multiple Actions:**
> "Check all the interest checkboxes and set experience to Advanced"

**State Inspection:**
> "What is the current user state?"

## 📄 License

MIT - Part of the UUICS project.
