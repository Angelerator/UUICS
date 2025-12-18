# @angelerator/uuics-core

[![npm version](https://img.shields.io/npm/v/@angelerator/uuics-core.svg)](https://www.npmjs.com/package/@angelerator/uuics-core)
[![npm downloads](https://img.shields.io/npm/dm/@angelerator/uuics-core.svg)](https://www.npmjs.com/package/@angelerator/uuics-core)

The core engine for **Universal UI Context System (UUICS)** - a performance-optimized system for AI agents to understand and interact with web interfaces.

## 📦 Installation

```bash
npm install @angelerator/uuics-core

# or
pnpm add @angelerator/uuics-core

# or
yarn add @angelerator/uuics-core
```

## 🚀 Quick Start

```javascript
import { UUICSEngine } from '@angelerator/uuics-core';

// Create and initialize
const uuics = new UUICSEngine();
await uuics.initialize();

// Scan the page
const context = await uuics.scan();
console.log(`Found ${context.elements.length} elements`);

// Get AI-friendly context
const text = uuics.serialize('natural');
console.log(text);

// Execute an action
await uuics.execute({
  action: 'setValue',
  target: '#email',
  parameters: { value: 'user@example.com' }
});
```

## ✨ Features

| Feature | Description |
|---------|-------------|
| **DOM Scanning** | Recursive traversal with intelligent element detection |
| **Context Serialization** | JSON, Natural Language, and OpenAPI formats |
| **Action Execution** | Click, type, select, check, and custom actions |
| **State Tracking** | Track JavaScript variables alongside DOM state |
| **Mutation Tracking** | Debounced observer for DOM changes |
| **Performance** | Smart caching, idle callbacks, element limits |

## 📖 API Reference

### UUICSEngine

The main class that orchestrates all functionality.

#### Constructor

```typescript
new UUICSEngine(config?: UUICSConfig)
```

#### Methods

##### Core Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `initialize()` | `Promise<void>` | Initialize the engine |
| `scan(root?, config?)` | `Promise<PageContext>` | Scan DOM and update context |
| `getContext()` | `PageContext \| null` | Get current context |
| `serialize(format?)` | `string` | Serialize to json/natural/openapi |
| `subscribe(cb)` | `() => void` | Subscribe to updates, returns unsubscribe |
| `destroy()` | `void` | Cleanup and destroy |

##### Action Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `execute(command)` | `Promise<ActionResult>` | Execute single action |
| `executeBatch(commands)` | `Promise<ActionResult[]>` | Execute multiple actions |

##### State Tracking

| Method | Returns | Description |
|--------|---------|-------------|
| `trackState(name, obj)` | `T` | Track object with proxy |
| `registerState(name, getter)` | `void` | Register computed state |
| `untrackState(name)` | `void` | Stop tracking object |
| `unregisterState(name)` | `void` | Remove registered state |
| `getTrackedStateNames()` | `string[]` | List tracked states |

##### Utility Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `findElement(selector)` | `UIElement \| null` | Find element by selector |
| `findElements(type)` | `UIElement[]` | Find elements by type |
| `updateConfig(config)` | `void` | Update configuration |
| `clearCache()` | `void` | Clear element cache |

### Configuration

```typescript
interface UUICSConfig {
  scan?: {
    interval?: number;        // Auto-scan interval (0 = manual)
    depth?: number;           // Max DOM depth (default: 10)
    includeHidden?: boolean;  // Include hidden elements
    includeDisabled?: boolean; // Include disabled elements
    rootSelectors?: string[]; // Only scan these areas
    excludeSelectors?: string[]; // Skip these areas
    useIdleCallback?: boolean; // Use requestIdleCallback
  };
  
  track?: {
    mutations?: boolean;      // Track DOM mutations
    clicks?: boolean;         // Track clicks
    changes?: boolean;        // Track input changes
    submits?: boolean;        // Track form submissions
    debounceDelay?: number;   // Debounce delay (ms)
  };
  
  state?: {
    enabled?: boolean;        // Enable state tracking
    exclude?: string[];       // Patterns to exclude (e.g., '*password*')
  };
  
  performance?: {
    enableCache?: boolean;    // Enable element caching
    cacheTTL?: number;        // Cache TTL (ms)
    maxElements?: number;     // Max elements to scan
  };
  
  debug?: {
    enabled?: boolean;        // Enable debug logging
    level?: 'error' | 'warn' | 'info' | 'debug';
  };
}
```

### Action Types

```typescript
type ActionType = 
  | 'click'     // Click element
  | 'setValue'  // Set input/textarea value
  | 'select'    // Select dropdown option(s)
  | 'check'     // Check checkbox
  | 'uncheck'   // Uncheck checkbox
  | 'submit'    // Submit form
  | 'focus'     // Focus element
  | 'scroll'    // Scroll to element
  | 'hover'     // Hover over element
  | 'custom';   // Execute custom script

interface ActionCommand {
  action: ActionType;
  target: string;           // CSS selector
  parameters?: {
    value?: any;            // For setValue, select
  };
  script?: string;          // For custom action
}

interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
}
```

### Types

```typescript
interface UIElement {
  id: string;
  type: ElementType;
  tag: string;
  selector: string;
  label: string;
  value?: any;
  text?: string;
  visible: boolean;
  enabled: boolean;
  attributes: Record<string, any>;
  selectMetadata?: {        // For select elements
    options: Array<{
      value: string;
      label: string;
      selected: boolean;
      disabled: boolean;
    }>;
    multiple: boolean;
    selectedValues: string[];
  };
}

interface PageContext {
  id: string;
  timestamp: number;
  url: string;
  title: string;
  elements: UIElement[];
  actions: Action[];
  state?: Record<string, any>;
  metadata: {
    elementCount: number;
    scanDuration: number;
    scanDepth: number;
    partial: boolean;
  };
}
```

## 🎨 Serialization Formats

### Natural Language

Best for AI models that work with natural language:

```javascript
const text = uuics.serialize('natural');
```

Output:
```
# Page Context

Page: My App
URL: https://example.com

## Interactive Elements

### Inputs (3)
- **Email** → `#email`
- **Password** → `#password`

### Buttons (2)
- **Submit** → `#submit-btn`

## Application State
- user: { name: "John" }
```

### JSON

Structured data for programmatic use:

```javascript
const json = uuics.serialize('json');
```

### OpenAPI

For LLMs with function calling:

```javascript
const openapi = uuics.serialize('openapi');
```

## 🔧 Advanced Usage

### State Tracking

```javascript
// Automatic tracking with Proxy
const user = uuics.trackState('user', {
  name: 'John',
  preferences: { theme: 'dark' }
});

user.name = 'Jane';  // Automatically tracked!

// Computed values
uuics.registerState('stats', () => ({
  elementCount: document.querySelectorAll('*').length,
  timestamp: Date.now()
}));
```

### Sensitive Data Protection

```javascript
const uuics = new UUICSEngine({
  state: {
    enabled: true,
    exclude: ['*password*', '*token*', '*secret*', '*key*', '*auth*']
  }
});

const auth = uuics.trackState('auth', {
  username: 'john',      // ✅ Included
  password: 'secret123', // ❌ Shows as '[EXCLUDED]'
  apiKey: 'sk-abc'       // ❌ Shows as '[EXCLUDED]'
});
```

### Scope Control

```javascript
// Scan only specific areas
await uuics.scan(null, {
  rootSelectors: ['#main-content', '#sidebar'],
  excludeSelectors: ['.advertisement', 'footer', 'nav']
});
```

### Batch Actions

```javascript
const results = await uuics.executeBatch([
  { action: 'click', target: '#menu' },
  { action: 'click', target: '#settings' },
  { action: 'setValue', target: '#theme', parameters: { value: 'dark' } },
  { action: 'click', target: '#save' }
]);

const allSucceeded = results.every(r => r.success);
```

### Custom Actions

```javascript
await uuics.execute({
  action: 'custom',
  target: '#my-element',
  script: `
    element.scrollIntoView({ behavior: 'smooth' });
    element.classList.add('highlighted');
  `
});
```

### Context Subscription

```javascript
const unsubscribe = uuics.subscribe((context) => {
  console.log('Page updated!');
  console.log('Elements:', context.elements.length);
  console.log('Actions:', context.actions.length);
});

// Later...
unsubscribe();
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      UUICSEngine                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ DOMScanner  │  │StateTracker │  │ MutationTracker     │  │
│  │             │  │             │  │                     │  │
│  │ - Traverse  │  │ - Proxy     │  │ - MutationObserver  │  │
│  │ - Detect    │  │ - Register  │  │ - Event listeners   │  │
│  │ - Classify  │  │ - Exclude   │  │ - Debouncing        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          ▼                                   │
│              ┌─────────────────────┐                         │
│              │ ContextAggregator   │                         │
│              │                     │                         │
│              │ - Merge elements    │                         │
│              │ - Generate actions  │                         │
│              │ - Include state     │                         │
│              └─────────────────────┘                         │
│                          │                                   │
│         ┌────────────────┼────────────────┐                  │
│         ▼                ▼                ▼                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐      │
│  │ Serializer  │  │ (Storage)   │  │ ActionExecutor  │      │
│  │             │  │             │  │                 │      │
│  │ - JSON      │  │ - Cache     │  │ - Validate      │      │
│  │ - Natural   │  │ - History   │  │ - Execute       │      │
│  │ - OpenAPI   │  │             │  │ - Report        │      │
│  └─────────────┘  └─────────────┘  └─────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## ⚡ Performance Tips

1. **Use manual scanning**: Set `scan.interval: 0` and call `scan()` when needed
2. **Limit depth**: Set `scan.depth` to 10-15 for most pages
3. **Enable caching**: Keep `performance.enableCache: true`
4. **Scope scans**: Use `rootSelectors` to scan only relevant areas
5. **Exclude noise**: Use `excludeSelectors` to skip ads, modals, etc.
6. **Set max elements**: Use `performance.maxElements` to prevent runaway scans

## 🌐 Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 13+)

Requires: ES6+, Proxy, MutationObserver

## 📝 TypeScript

Full TypeScript support with exported types:

```typescript
import { 
  UUICSEngine,
  type UUICSConfig,
  type PageContext,
  type UIElement,
  type ActionCommand,
  type ActionResult,
  type ElementType,
  type ActionType
} from '@angelerator/uuics-core';
```

## 🔗 Links

- **GitHub**: [Angelerator/UUICS](https://github.com/Angelerator/UUICS)
- **NPM**: [@angelerator/uuics-core](https://www.npmjs.com/package/@angelerator/uuics-core)
- **Examples**: [examples/](../../examples/)

## 📄 License

MIT
