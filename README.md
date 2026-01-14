# UUICS (Universal UI Context System)

[![npm version](https://img.shields.io/npm/v/@angelerator/uuics-core.svg)](https://www.npmjs.com/package/@angelerator/uuics-core)
[![npm downloads](https://img.shields.io/npm/dm/@angelerator/uuics-core.svg)](https://www.npmjs.com/package/@angelerator/uuics-core)
[![license](https://img.shields.io/npm/l/@angelerator/uuics-core.svg)](https://github.com/Angelerator/UUICS/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Angelerator/UUICS.svg?style=social)](https://github.com/Angelerator/UUICS)

**A performance-optimized, framework-agnostic system for AI agents to understand and interact with web interfaces.**

UUICS bridges the gap between AI models and web UIs by providing structured context about page elements and enabling AI-driven interactions through a simple action execution system.

## 🎯 What is UUICS?

UUICS scans your web page, extracts all interactive elements (buttons, inputs, dropdowns, etc.), and provides this information in AI-friendly formats. When an AI decides to take action, UUICS executes it safely on the page.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HOW UUICS WORKS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Your Web Page          UUICS Engine            AI Model                    │
│   ┌──────────┐          ┌──────────┐          ┌──────────┐                  │
│   │ Buttons  │ ──scan──▶│ Context  │ ──send──▶│ Analyze  │                  │
│   │ Inputs   │          │ Builder  │          │ & Decide │                  │
│   │ Forms    │          └──────────┘          └──────────┘                  │
│   │ Dropdowns│                                     │                        │
│   └──────────┘                                     │                        │
│        ▲                                           │                        │
│        │               ┌──────────┐                │                        │
│        └──execute──────│ Action   │◀───command─────┘                        │
│                        │ Executor │                                          │
│                        └──────────┘                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## ✨ Features

### Core Capabilities
- **🔍 DOM Scanning**: Automatically detects all interactive elements
- **📝 Context Serialization**: JSON, Natural Language, or OpenAPI formats
- **⚡ Action Execution**: Click, type, select, check, hover, and more
- **🔄 State Tracking**: Track JavaScript variables alongside DOM state
- **🛡️ Sensitive Data Protection**: Automatically exclude passwords and tokens
- **🔌 MCP Support**: Native Model Context Protocol integration for Claude

### Framework Support
- **Vanilla JavaScript**: Direct engine usage
- **React**: Provider pattern with hooks (see examples)
- **Vue, Angular, etc.**: Engine works with any framework

### AI Model Support
- **Claude**: Full support with MCP tool calling + natural language context
- **GPT-4/OpenAI**: Function calling with OpenAPI format
- **Any LLM**: JSON format works universally

## 📦 Installation

```bash
npm install @angelerator/uuics-core
```

## 🚀 Quick Start

### Basic Usage

```javascript
import { UUICSEngine } from '@angelerator/uuics-core';

// Create engine
const uuics = new UUICSEngine({
  scan: { interval: 0 },  // Manual scanning
  track: { mutations: true, clicks: true }
});

// Initialize
await uuics.initialize();

// Scan the page
const context = await uuics.scan();

// Get AI-friendly context
const naturalLanguage = uuics.serialize('natural');
console.log(naturalLanguage);
// Output:
// # Page Context
// ## Interactive Elements
// ### Buttons (3)
// - **Submit** → `#submit-btn`
// - **Cancel** → `#cancel-btn`
// ...

// Execute an action from AI response
await uuics.execute({
  action: 'setValue',
  target: '#email',
  parameters: { value: 'user@example.com' }
});
```

### With Claude AI

```javascript
import { UUICSEngine } from '@angelerator/uuics-core';

const uuics = new UUICSEngine();
await uuics.initialize();

// Get page context
await uuics.scan();
const context = uuics.serialize('natural');

// Send to Claude (using your preferred method)
const response = await claude.messages.create({
  model: 'claude-sonnet-4-20250514',
  system: `You are a web automation assistant. Here's the page context:\n${context}`,
  messages: [{ role: 'user', content: 'Fill in the email field with test@example.com' }]
});

// Parse and execute Claude's action
const action = parseActionFromResponse(response);
await uuics.execute(action);
```

### With MCP (Model Context Protocol) 🆕

UUICS includes native MCP support for Claude's tool calling capabilities:

```javascript
import { 
  UUICSEngine, 
  MCPToolsGenerator, 
  MCPToolHandler 
} from '@angelerator/uuics-core';

// Initialize UUICS
const engine = new UUICSEngine();
await engine.initialize();
await engine.scan();

// Generate MCP tools from current page context
const generator = new MCPToolsGenerator();
const tools = generator.generateTools(engine.getContext());

// Send tools to Claude
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  tools: tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  })),
  messages: [{ role: 'user', content: 'Click the submit button' }]
});

// Handle tool calls from Claude
const handler = new MCPToolHandler(engine);
for (const block of response.content) {
  if (block.type === 'tool_use') {
    const result = await handler.handleToolCall({
      name: block.name,
      input: block.input,
      id: block.id,
    });
    console.log('Tool result:', result);
  }
}
```

## 📖 API Reference

### UUICSEngine

The main class for interacting with UUICS.

#### Constructor

```typescript
new UUICSEngine(config?: UUICSConfig)
```

#### Core Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize the engine |
| `scan(root?, config?)` | Scan DOM and update context |
| `getContext()` | Get current page context |
| `serialize(format?)` | Serialize context (json/natural/openapi) |
| `subscribe(callback)` | Subscribe to context updates |

#### Action Methods

| Method | Description |
|--------|-------------|
| `execute(command)` | Execute a single action |
| `executeBatch(commands)` | Execute multiple actions sequentially |

#### State Tracking

| Method | Description |
|--------|-------------|
| `trackState(name, obj)` | Track object with auto-updates |
| `registerState(name, getter)` | Register computed state |
| `untrackState(name)` | Stop tracking an object |

### Action Types

```typescript
type ActionType = 
  | 'click'      // Click an element
  | 'setValue'   // Set input/textarea value
  | 'select'     // Select dropdown option(s)
  | 'check'      // Check a checkbox
  | 'uncheck'    // Uncheck a checkbox
  | 'submit'     // Submit a form
  | 'focus'      // Focus an element
  | 'scroll'     // Scroll to element
  | 'hover'      // Hover over element
  | 'custom';    // Execute custom script
```

## 🔌 MCP (Model Context Protocol) Support

UUICS provides native MCP integration for Claude and other MCP-compatible AI models.

### MCP Classes

| Class | Description |
|-------|-------------|
| `MCPToolsGenerator` | Generates MCP tool definitions from page context |
| `MCPToolHandler` | Handles MCP tool calls and executes UI actions |

### MCP Core Tools (16 Total)

| Tool | Category | Description |
|------|----------|-------------|
| `ui_scan` | context | Scan page to discover interactive elements |
| `ui_get_context` | context | Get current context without re-scanning |
| `ui_get_element` | context | Get details about a specific element |
| `ui_get_state` | context | Query tracked JavaScript application state |
| `ui_click` | interaction | Click on an element |
| `ui_type` | interaction | Type text into an input field |
| `ui_select` | interaction | Select an option from dropdown |
| `ui_check` | interaction | Check a checkbox |
| `ui_uncheck` | interaction | Uncheck a checkbox |
| `ui_submit` | interaction | Submit a form |
| `ui_scroll` | interaction | Scroll to bring element into view |
| `ui_focus` | interaction | Set focus on an element |
| `ui_hover` | interaction | Hover over element (dropdowns/tooltips) |
| `ui_wait_for` | utility | Wait for element or condition |
| `ui_screenshot` | debug | Capture element/page for visual debugging |
| `ui_execute_batch` | interaction | Execute multiple actions in sequence |

### MCP Configuration

```typescript
import { MCPToolsGenerator, MCPToolHandler } from '@angelerator/uuics-core';

const generator = new MCPToolsGenerator({
  includeCoreTools: true,       // Include all 16 core tools
  generateDynamicTools: true,   // Generate element-specific tools
  maxDynamicTools: 50,          // Limit dynamic tools
  toolPrefix: 'ui_',            // Tool name prefix
  elementTypes: ['button', 'input', 'select', 'checkbox', 'link'],
  customTools: [],              // Add your own tools
});

// Generate tools for current page state
const tools = generator.generateTools(engine.getContext());

// Create handler to execute tool calls
const handler = new MCPToolHandler(engine);
```

### Dynamic Tools

MCP automatically generates element-specific tools based on the current page:

```
# For a page with:
# - Submit button (#submit-btn)
# - Email input (#email)
# - Country dropdown (#country)

Generated dynamic tools:
- ui_click_submit        → Clicks the Submit button
- ui_set_email           → Sets the Email input value
- ui_select_country      → Selects a Country option
```

### ui_wait_for Conditions

| Condition | Description |
|-----------|-------------|
| `visible` | Element is visible in viewport |
| `hidden` | Element is hidden or removed |
| `exists` | Element exists in DOM |
| `not_exists` | Element does not exist |
| `enabled` | Form element is enabled |
| `disabled` | Form element is disabled |

```typescript
// Wait for loading spinner to disappear
await handler.handleToolCall({
  name: 'ui_wait_for',
  input: {
    selector: '.loading-spinner',
    condition: 'hidden',
    timeout: 10000,
  }
});
```

### ui_screenshot Usage

```typescript
// Capture element bounds
const result = await handler.handleToolCall({
  name: 'ui_screenshot',
  input: {
    selector: '#main-form',
    format: 'png',
    scale: 2,
  }
});
// Returns: { dataUrl: 'data:image/png;base64,...', width, height }
```

### ui_get_state Usage

```typescript
// Query tracked application state
const result = await handler.handleToolCall({
  name: 'ui_get_state',
  input: {
    key: 'user',              // Optional: specific key
    include_metadata: true,   // Include timestamp
  }
});
// Returns: { key: 'user', value: {...}, timestamp: 1234567890 }
```

### Configuration

```typescript
const config: UUICSConfig = {
  scan: {
    interval: 0,              // Auto-scan interval (0 = manual)
    depth: 10,                // Max DOM depth
    includeHidden: false,     // Include hidden elements
    rootSelectors: ['#app'],  // Scan specific areas only
    excludeSelectors: ['.ads'] // Skip certain elements
  },
  track: {
    mutations: true,          // Track DOM mutations
    clicks: true,             // Track click events
    changes: true,            // Track input changes
    debounceDelay: 100        // Debounce delay (ms)
  },
  state: {
    enabled: true,            // Enable state tracking
    exclude: ['*password*']   // Exclude sensitive fields
  },
  performance: {
    enableCache: true,        // Cache scanned elements
    maxElements: 1000         // Max elements to scan
  }
};
```

## 🎨 Serialization Formats

### Natural Language (AI-Friendly)

```
# Page Context

Page: My Application
URL: https://example.com

## Interactive Elements

### Inputs (3)
- **Email** → `#email` 
- **Password** → `#password`
- **Name** → `#name`

### Buttons (2)
- **Submit** → `#submit-btn`
- **Cancel** → `#cancel-btn`

### Selects (1)
- **Country** [OPTIONS: "USA" (value: us), "UK" (value: uk)] → `#country`

## Application State
- user: { name: "John", loggedIn: true }
```

### JSON (Structured)

```json
{
  "url": "https://example.com",
  "title": "My Application",
  "elements": [
    {
      "type": "input",
      "selector": "#email",
      "label": "Email",
      "value": ""
    }
  ],
  "actions": [
    { "type": "setValue", "target": "#email" },
    { "type": "click", "target": "#submit-btn" }
  ],
  "state": {
    "user": { "name": "John" }
  }
}
```

### OpenAPI (Function Calling)

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "ui_click",
        "parameters": {
          "properties": {
            "target": { "enum": ["#submit-btn", "#cancel-btn"] }
          }
        }
      }
    }
  ]
}
```

## 📂 Project Structure

```
uuics/
├── packages/
│   └── core/                 # @angelerator/uuics-core
│       ├── src/
│       │   ├── scanner/      # DOM scanning
│       │   ├── tracker/      # Mutation & state tracking
│       │   ├── aggregator/   # Context aggregation
│       │   ├── serializer/   # Output formatting
│       │   ├── executor/     # Action execution
│       │   ├── mcp/          # MCP (Model Context Protocol) support
│       │   │   ├── types.ts
│       │   │   ├── MCPToolsGenerator.ts
│       │   │   ├── MCPToolHandler.ts
│       │   │   └── index.ts
│       │   └── UUICSEngine.ts
│       └── package.json
│
└── examples/
    ├── react-app/            # React + Claude integration
    │   ├── src/
    │   │   ├── UUICSProvider.tsx  # React context
    │   │   ├── ClaudeAdapter.ts   # Claude integration
    │   │   └── ...
    │   └── claude-cli-proxy.cjs   # Proxy for Claude Code
    │
    └── vanilla/              # Vanilla JavaScript example
        └── index.html
```

## 🏃 Running Examples

### Prerequisites

```bash
# Clone the repository
git clone https://github.com/Angelerator/UUICS.git
cd UUICS

# Install dependencies
pnpm install

# Build packages
pnpm build
```

### React Example with Claude

```bash
# Terminal 1: Start the React app
cd examples/react-app
pnpm dev
# Opens at http://localhost:5173

# Terminal 2: Start Claude proxy (uses Claude Code subscription)
cd examples/react-app
node claude-cli-proxy.cjs
# Proxy runs at http://localhost:3100
```

Then open the app and click the 🤖 button to chat with Claude!

### Vanilla Example

```bash
cd examples/vanilla
pnpm dev
# Opens at http://localhost:5173
```

## 🔧 Advanced Usage

### State Tracking

```javascript
// Track objects with automatic change detection
const user = uuics.trackState('user', {
  name: 'John',
  preferences: { theme: 'dark' }
});

user.name = 'Jane';  // Automatically tracked!

// Register computed values
uuics.registerState('metrics', () => ({
  pageViews: analytics.getPageViews(),
  sessionDuration: Date.now() - startTime
}));
```

### Scope Control

```javascript
// Scan only specific areas
await uuics.scan(null, {
  rootSelectors: ['#main-form', '#sidebar'],
  excludeSelectors: ['.advertisement', 'footer']
});
```

### Sensitive Data Protection

```javascript
const uuics = new UUICSEngine({
  state: {
    enabled: true,
    exclude: ['*password*', '*token*', '*secret*', '*key*']
  }
});

// Sensitive fields automatically excluded from context
const auth = uuics.trackState('auth', {
  username: 'john',      // ✅ Included
  password: 'secret123', // ❌ Excluded as '[EXCLUDED]'
  apiKey: 'sk-abc123'    // ❌ Excluded as '[EXCLUDED]'
});
```

### Action Chaining

```javascript
// Execute multiple actions in sequence
const results = await uuics.executeBatch([
  { action: 'click', target: '#menu-button' },
  { action: 'click', target: '#settings' },
  { action: 'setValue', target: '#theme', parameters: { value: 'dark' } },
  { action: 'click', target: '#save' }
]);

results.forEach((r, i) => {
  console.log(`Step ${i + 1}: ${r.success ? '✓' : '✗'} ${r.message}`);
});
```

## 🤖 Use Cases

- **AI-Powered Testing**: Automated testing with natural language
- **Intelligent Automation**: Smart bots that understand page context  
- **Accessibility Tools**: AI assistants for users with disabilities
- **Form Auto-Fill**: Context-aware form completion
- **Browser Extensions**: AI-powered browser tools
- **RPA**: Intelligent workflow automation

## 🔄 Migrating from Previous Versions

If you were using the separate packages (`@angelerator/uuics-react`, `@angelerator/uuics-models-claude`, `@angelerator/uuics-models-openai`), these have been deprecated. The React integration and model adapters are now provided as examples that you can copy into your project.

See the `examples/react-app/` directory for:
- `UUICSProvider.tsx` - React context and hooks
- `ClaudeAdapter.ts` - Claude integration

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT - see [LICENSE](LICENSE) for details.

## 🔗 Links

- **NPM**: [@angelerator/uuics-core](https://www.npmjs.com/package/@angelerator/uuics-core)
- **GitHub**: [Angelerator/UUICS](https://github.com/Angelerator/UUICS)
- **Issues**: [GitHub Issues](https://github.com/Angelerator/UUICS/issues)
