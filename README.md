# UUICS (Universal UI Context System)

A performance-optimized, framework-agnostic system for AI agents to understand and interact with web interfaces.

## Features

### Core Capabilities

- **Framework Agnostic**: Works with vanilla JS, React, Vue, and any other framework
- **Model Agnostic**: Provides structured context that works with any LLM (Claude, GPT, etc.)
- **Performance Optimized**: Smart caching, debounced mutations, idle callbacks
- **Type Safe**: Full TypeScript support with comprehensive type definitions
- **Modular**: Use only what you need - core, React hooks, or specific model adapters

### Advanced Features

- **State Tracking**: Track JavaScript variables and application state with proxy-based or manual registration
- **Scope Control**: Scan specific DOM subtrees with include/exclude selectors
- **Special Elements**: Full support for ARIA roles, contenteditable, progress, meter, datalist, and more
- **Action Chaining**: Execute sequential or conditional action workflows
- **Sensitive Data Protection**: Pattern-based exclusion filters for passwords, tokens, and secrets
- **Multiple Output Formats**: JSON, Natural Language, and OpenAPI tool definitions

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    UNIVERSAL UI CONTEXT SYSTEM                           │
├─────────────────────────────────────────────────────────────────────────┤
│  DOM Scanner + State Tracker → Mutation Tracker → Context Aggregator     │
│       ↓              ↓                  ↓                    ↓            │
│  Element        JS Variables      Change Events      Structured Context  │
│  Detection      & App State                                 ↓            │
│                                                       Serializer          │
│                                                  (JSON/Natural/OpenAPI)   │
│                                                           ↓               │
│                                                    To AI Model            │
│                                                           ↓               │
│                                                   Action Commands         │
│                                                           ↓               │
│                                                   Action Executor         │
│                                                    (Batch Support)        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Packages

### Core Packages

- **@uuics/core**: Core runtime engine (DOM scanning, tracking, serialization, execution)
- **@uuics/react**: React hooks and components

### Model Adapters (Examples)

- **@uuics/models-claude**: Claude AI integration example
- **@uuics/models-openai**: OpenAI GPT integration example

## Installation

```bash
# Using pnpm
pnpm install @uuics/core

# With React
pnpm install @uuics/core @uuics/react

# Using npm
npm install @uuics/core

# Using yarn
yarn add @uuics/core
```

## Quick Start

### Vanilla JavaScript

```javascript
import { UUICSEngine } from "@uuics/core";

// Create engine with state tracking
const uuics = new UUICSEngine({
  scan: {
    interval: 0, // Manual scanning (recommended for AI integration)
    depth: 10,
    rootSelectors: ["#main-content"], // Scan specific areas
    excludeSelectors: [".ads", "footer"], // Skip certain elements
  },
  track: {
    mutations: true,
    clicks: true,
    changes: true,
  },
  state: {
    enabled: true, // Enable state tracking
    exclude: ["*password*", "*token*", "*key*"], // Protect sensitive data
  },
});

// Track application state
const user = uuics.trackState("user", { name: "John", role: "admin" });

// Register computed state
uuics.registerState("appInfo", () => ({
  timestamp: Date.now(),
  version: "1.0.0",
}));

// Scan and get context
const context = await uuics.scan();

// Serialize for AI (includes state)
const naturalLanguage = uuics.serialize(context, "natural");
console.log(naturalLanguage);

// Execute single action
await uuics.execute({
  action: "setValue",
  target: "#name-input",
  parameters: { value: "John Doe" },
});

// Execute action chain
await uuics.executeBatch([
  { action: "click", target: "#menu" },
  { action: "click", target: "#profile" },
  { action: "setValue", target: "#bio", parameters: { value: "Developer" } },
]);
```

### React

```tsx
import { UUICSProvider, useUICS, DebugPanel } from "@uuics/react";

function App() {
  return (
    <UUICSProvider config={{ scan: { interval: 2000 } }}>
      <MyComponent />
      <DebugPanel />
    </UUICSProvider>
  );
}

function MyComponent() {
  const { context, execute, serialize } = useUICS();

  const handleAIAction = async () => {
    const contextString = serialize("natural");
    // Send to AI, get action command
    const command = { action: "click", target: "#submit-btn" };
    await execute(command);
  };

  return <div>Elements: {context?.elements.length}</div>;
}
```

## Configuration

```typescript
const config: UUICSConfig = {
  scan: {
    interval: 0, // Auto-scan interval (0 = manual)
    depth: 10, // Max DOM depth
    includeHidden: false, // Include hidden elements
    includeDisabled: false, // Include disabled elements
    rootSelectors: ["#app", ".main"], // Scan only specific areas
    excludeSelectors: [".ads", "nav"], // Skip certain elements
    useIdleCallback: true, // Use requestIdleCallback
  },
  track: {
    mutations: true, // Track DOM mutations
    clicks: true, // Track click events
    changes: true, // Track input changes
    submits: true, // Track form submissions
    debounceDelay: 100, // Debounce delay (ms)
  },
  serialize: {
    format: "json", // Default format
    includeMetadata: true, // Include scan metadata
    pretty: false, // Pretty-print JSON
    includeBounds: false, // Include element bounds
  },
  performance: {
    enableCache: true, // Enable element caching
    cacheTTL: 5000, // Cache TTL (ms)
    maxElements: 1000, // Max elements to scan
    useWorker: false, // Use Web Worker
  },
  debug: {
    enabled: false, // Enable debug logging
    level: "info", // Log level
  },
  state: {
    enabled: true, // Enable state tracking
    exclude: ["*password*", "*token*", "*key*"], // Exclude patterns
    track: { user: { name: "John" } }, // Auto-track objects
    capture: () => ({ custom: "data" }), // Custom capture function
  },
};
```

## API Reference

### UUICSEngine

#### Core Methods

- `initialize(): Promise<void>` - Initialize the engine
- `scan(root?: HTMLElement, configOverride?: Partial<ScanConfig>): Promise<PageContext>` - Scan DOM and update context
- `getContext(): PageContext | null` - Get current context
- `subscribe(callback: (context: PageContext) => void): () => void` - Subscribe to updates
- `serialize(context: PageContext, format?: 'json' | 'natural' | 'openapi'): string | object` - Serialize context

#### Action Methods

- `execute(command: ActionCommand): Promise<ActionResult>` - Execute single action
- `executeBatch(commands: ActionCommand[]): Promise<ActionResult[]>` - Execute multiple actions sequentially

#### State Tracking Methods

- `trackState<T>(name: string, obj: T): T` - Track object with proxy (automatic)
- `registerState(name: string, getter: () => any): void` - Register state getter (manual)
- `untrackState(name: string): void` - Remove tracked object
- `unregisterState(name: string): void` - Remove registered getter
- `getTrackedStateNames(): string[]` - Get list of tracked state names

#### Utility Methods

- `findElement(selector: string): UIElement | null` - Find element by selector
- `findElements(type: string): UIElement[]` - Find elements by type
- `updateConfig(config: Partial<UUICSConfig>): void` - Update configuration
- `clearCache(): void` - Clear element cache
- `destroy(): void` - Cleanup and destroy

### Action Commands

```typescript
interface ActionCommand {
  action:
    | "click"
    | "setValue"
    | "submit"
    | "select"
    | "check"
    | "uncheck"
    | "focus"
    | "scroll"
    | "hover"
    | "custom";
  target: string; // CSS selector
  parameters?: {
    value?: any; // For setValue, select
  };
  script?: string; // For custom actions
}
```

## Serialization Formats

### JSON

Structured data format with all context information:

```json
{
  "id": "context-123",
  "timestamp": 1234567890,
  "url": "https://example.com",
  "title": "Example Page",
  "elements": [...],
  "actions": [...],
  "forms": [...]
}
```

### Natural Language

LLM-friendly text format:

```
# Page Context

Page: Example Page
URL: https://example.com
Timestamp: 2024-01-01T00:00:00.000Z

## Summary

Total Elements: 25
Available Actions: 12

## Interactive Elements

### Buttons (5)

- **Submit Form** → `#submit-btn`
- **Clear** → `#clear-btn`
...
```

### OpenAPI

Tool calling format for function-calling LLMs:

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "UI Context: Example Page",
    "version": "1.0.0"
  },
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "ui_click",
        "description": "Perform click action on a UI element",
        "parameters": {
          "type": "object",
          "properties": {
            "target": {
              "type": "string",
              "enum": ["#submit-btn", "#clear-btn"]
            }
          }
        }
      }
    }
  ],
  "context": {
    "state": {
      "user": { "name": "John", "role": "admin" },
      "counters": { "clicks": 42 }
    }
  }
}
```

## State Tracking

Track JavaScript variables and application state to provide complete context to AI models.

### Proxy-Based Tracking (Automatic)

```javascript
// Track an object - changes are automatically captured
const userState = uuics.trackState("user", {
  name: "John Doe",
  email: "john@example.com",
  preferences: { theme: "dark" },
});

// Use like a normal object
userState.name = "Jane Doe";
userState.preferences.theme = "light";

// State is included in the next scan
const context = await uuics.scan();
console.log(context.state.user);
// { name: 'Jane Doe', email: 'john@example.com', preferences: { theme: 'light' } }
```

### Manual Registration (Computed Values)

```javascript
let clickCount = 0;
let startTime = Date.now();

// Register getter functions evaluated on-demand
uuics.registerState("counters", () => ({
  clicks: clickCount,
  elapsed: Date.now() - startTime,
}));

uuics.registerState("computed", () => ({
  averageClickRate: clickCount / ((Date.now() - startTime) / 1000),
}));

// State is evaluated during scan
const context = await uuics.scan();
console.log(context.state.counters); // { clicks: 42, elapsed: 15234 }
```

### Sensitive Data Protection

```javascript
const uuics = new UUICSEngine({
  state: {
    enabled: true,
    exclude: [
      "*password*", // Matches: password, userPassword, etc.
      "*token*", // Matches: authToken, apiToken, etc.
      "*key*", // Matches: apiKey, secretKey, etc.
    ],
  },
});

const auth = uuics.trackState("auth", {
  username: "john",
  password: "secret123", // Will be excluded
  apiKey: "sk-abc123", // Will be excluded
  publicData: "safe info", // Will be included
});

const context = await uuics.scan();
console.log(context.state.auth);
// { username: 'john', password: '[EXCLUDED]', apiKey: '[EXCLUDED]', publicData: 'safe info' }
```

## Scope Control

Control which parts of the DOM are scanned for optimal performance and relevance.

### Root Selectors (Include)

```javascript
// Scan only specific areas
const context = await uuics.scan(undefined, {
  rootSelectors: ["#main-content", ".sidebar"],
});

// Or configure globally
const uuics = new UUICSEngine({
  scan: {
    rootSelectors: ["#app", "main"],
  },
});
```

### Exclude Selectors

```javascript
// Skip ads, navigation, footer, etc.
const context = await uuics.scan(undefined, {
  excludeSelectors: [".ads", "nav", "footer", "#cookie-banner"],
});

// Combine with root selectors
const context = await uuics.scan(undefined, {
  rootSelectors: ["#main-form"],
  excludeSelectors: [".help-text", ".tooltip"],
});
```

## Special Elements Support

UUICS comprehensively supports modern HTML elements and ARIA roles:

### ARIA Roles

```html
<!-- Automatically detected and typed correctly -->
<div role="button">Custom Button</div>
<div role="textbox" contenteditable>Custom Input</div>
<div role="checkbox" aria-checked="true">Custom Checkbox</div>
<div role="switch" aria-checked="false">Toggle</div>
```

### Special HTML Elements

```html
<!-- Progress and Meter -->
<progress value="70" max="100">70%</progress>
<meter value="0.7" min="0" max="1">70%</meter>

<!-- Datalist (Autocomplete) -->
<input list="browsers" />
<datalist id="browsers">
  <option value="Chrome"></option>
  <option value="Firefox"></option>
</datalist>

<!-- Contenteditable -->
<div contenteditable="true">Editable content</div>

<!-- Details/Summary -->
<details>
  <summary>Click to expand</summary>
  <p>Hidden content</p>
</details>

<!-- Dialog -->
<dialog open>
  <p>Modal content</p>
</dialog>
```

### Dropdown Options

Select elements include complete option metadata:

```javascript
const context = await uuics.scan();
const selectElement = context.elements.find((el) => el.type === "select");

console.log(selectElement.selectMetadata);
// {
//   options: [
//     { value: 'us', label: 'United States', selected: false, disabled: false },
//     { value: 'uk', label: 'United Kingdom', selected: true, disabled: false }
//   ],
//   multiple: false,
//   selectedValues: ['uk']
// }
```

## Action Chaining

Execute complex workflows with sequential or conditional actions.

### Batch Execution

```javascript
// Execute actions sequentially with automatic error handling
const results = await uuics.executeBatch([
  { action: "click", target: "#login-button" },
  { action: "setValue", target: "#username", parameters: { value: "john" } },
  { action: "setValue", target: "#password", parameters: { value: "secret" } },
  { action: "submit", target: "#login-form" },
]);

// Check results
results.forEach((result, i) => {
  console.log(`Step ${i + 1}: ${result.success ? "✓" : "✗"}`);
});
```

### Conditional Chains

```javascript
// Manual chaining with custom logic
let result = await uuics.execute({ action: "click", target: "#menu" });

if (result.success) {
  result = await uuics.execute({ action: "click", target: "#submenu" });
}

if (result.success) {
  await uuics.execute({
    action: "setValue",
    target: "#search",
    parameters: { value: "query" },
  });
}
```

### State-Aware Workflows

```javascript
// Track workflow progress
const workflow = uuics.trackState("workflow", {
  step: 0,
  completed: [],
});

async function executeStep(step, action) {
  workflow.step = step;
  const result = await uuics.execute(action);
  if (result.success) workflow.completed.push(step);
  return result;
}

await executeStep(1, { action: "click", target: "#step1" });
await executeStep(2, {
  action: "fill",
  target: "#data",
  parameters: { value: "info" },
});

// State is included in context
const context = await uuics.scan();
console.log(context.state.workflow); // { step: 2, completed: [1, 2] }
```

## Performance

UUICS is designed for performance-critical applications:

- **Smart Caching**: Elements are cached and only re-scanned on changes
- **Debounced Mutations**: Change events are batched to avoid excessive scanning
- **Idle Callbacks**: Non-urgent scans use `requestIdleCallback`
- **Depth Limiting**: Configurable max depth to limit recursion
- **Element Limits**: Configurable max elements to prevent memory issues
- **Lazy Serialization**: Context is only serialized when requested

## Examples

See the `examples/` directory for complete examples:

- `examples/vanilla/` - Comprehensive demo with all features:
  - State tracking (proxy-based and manual registration)
  - Scope control (root and exclude selectors)
  - Special elements (ARIA roles, contenteditable, progress, meter, etc.)
  - Dropdown options extraction
  - All serialization formats
  - Live context visualization
- `examples/react-app/` - React application with hooks and components

### Running Examples

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run vanilla example
cd examples/vanilla
pnpm vite

# Run React example
cd examples/react-app
pnpm dev
```

Access at:

- Vanilla: `http://localhost:5173`
- React: `http://localhost:5174`

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run development mode
pnpm dev

# Run type checking
pnpm typecheck

# Clean build artifacts
pnpm clean
```

## Use Cases

UUICS is designed for:

- **AI-Powered Testing**: Automated testing with natural language instructions
- **Intelligent Automation**: Smart bots that understand page context
- **Accessibility Tools**: AI assistants for users with disabilities
- **Form Auto-Fill**: Context-aware form completion
- **Quality Assurance**: Automated UI validation and testing
- **Browser Extensions**: AI-powered browser tools and assistants
- **RPA (Robotic Process Automation)**: Intelligent workflow automation

## License

MIT

## Publishing to NPM

This monorepo contains multiple packages that can be published to NPM. To publish:

1. Update versions in all package.json files
2. Build all packages: `pnpm build`
3. Publish in order:

```bash
cd packages/core && npm publish --access public
cd ../react && npm publish --access public
cd ../models-claude && npm publish --access public
cd ../models-openai && npm publish --access public
```

For detailed publishing instructions, see the repository setup guide.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with conventional commits: `git commit -m 'feat: add amazing feature'`
5. Push to your fork: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Guidelines

- Write TypeScript with full type safety
- Add tests for new features
- Update documentation for API changes
- Follow existing code style
- Keep commits atomic and well-described

## Support

For issues, questions, or feature requests:

- **Issues**: Open an issue on [GitHub Issues](https://github.com/Angelerator/uuics/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/Angelerator/uuics/discussions)
- **Security**: Report security issues via email to security@example.com

## Acknowledgments

UUICS is built for performance-critical applications and designed to work seamlessly with modern AI models including Claude, GPT-4, and other LLMs that support function calling and tool use.
