# @uuics/core

Core runtime engine for Universal UI Context System (UUICS).

## Features

- **DOM Scanning**: Performance-optimized recursive DOM traversal with caching
- **Mutation Tracking**: Debounced mutation observer and event tracking
- **Context Aggregation**: Intelligent aggregation of UI elements into structured context
- **Serialization**: Multiple output formats (JSON, Natural Language, OpenAPI)
- **Action Execution**: Safe execution of UI actions with validation and error handling

## Installation

```bash
npm install @uuics/core
```

## Basic Usage

```javascript
import { UUICSEngine } from '@uuics/core';

const uuics = new UUICSEngine({
  scan: { interval: 2000 },
  track: { mutations: true },
});

await uuics.initialize();
const context = uuics.getContext();
```

## API Documentation

### UUICSEngine

Main engine class that orchestrates all components.

#### Constructor

```typescript
new UUICSEngine(config?: UUICSConfig)
```

#### Methods

**initialize(): Promise<void>**

Initialize the engine and perform initial scan.

**scan(root?: HTMLElement): Promise<PageContext>**

Scan the DOM and update context.

**getContext(): PageContext | null**

Get the current page context.

**subscribe(callback: (context: PageContext) => void): () => void**

Subscribe to context updates. Returns unsubscribe function.

**serialize(format?: 'json' | 'natural' | 'openapi'): string**

Serialize context to specified format.

**execute(command: ActionCommand): Promise<ActionResult>**

Execute a single action command.

**executeBatch(commands: ActionCommand[]): Promise<ActionResult[]>**

Execute multiple action commands in sequence.

**findElement(selector: string): UIElement | null**

Find an element by CSS selector.

**findElements(type: string): UIElement[]**

Find all elements of a specific type.

**updateConfig(config: Partial<UUICSConfig>): void**

Update engine configuration.

**clearCache(): void**

Clear element cache.

**destroy(): void**

Cleanup and destroy the engine.

### Types

#### UIElement

```typescript
interface UIElement {
  id: string;
  type: ElementType;
  tag: string;
  selector: string;
  label: string;
  attributes: Record<string, any>;
  value?: any;
  text?: string;
  visible: boolean;
  enabled: boolean;
  children?: UIElement[];
  bounds?: { x: number; y: number; width: number; height: number };
}
```

#### PageContext

```typescript
interface PageContext {
  id: string;
  timestamp: number;
  url: string;
  title: string;
  elements: UIElement[];
  actions: Action[];
  forms?: FormState[];
  metadata: {
    elementCount: number;
    scanDuration: number;
    scanDepth: number;
    partial: boolean;
  };
}
```

#### ActionCommand

```typescript
interface ActionCommand {
  action: ActionType;
  target: string;
  parameters?: Record<string, unknown>;
  script?: string;
}
```

#### ActionResult

```typescript
interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
  data?: unknown;
  context?: PageContext;
}
```

## Advanced Usage

### Custom Element Filter

```javascript
const uuics = new UUICSEngine({
  scan: {
    filter: (element) => {
      // Only scan elements with data-trackable attribute
      return element.hasAttribute('data-trackable');
    },
  },
});
```

### Manual Scanning

```javascript
const uuics = new UUICSEngine({
  scan: { interval: 0 }, // Disable auto-scan
});

await uuics.initialize();

// Scan manually when needed
await uuics.scan();
```

### Event Subscription

```javascript
const unsubscribe = uuics.subscribe((context) => {
  console.log('Context updated:', context);
  console.log('Elements:', context.elements.length);
  console.log('Actions:', context.actions.length);
});

// Unsubscribe when done
unsubscribe();
```

## Performance Tips

1. **Limit Scan Depth**: Set `scan.depth` to a reasonable value (default: 10)
2. **Use Auto-Scan Wisely**: Set appropriate interval or disable for manual control
3. **Enable Caching**: Keep `performance.enableCache` enabled (default: true)
4. **Filter Elements**: Use `scan.filter` to skip irrelevant elements
5. **Limit Max Elements**: Set `performance.maxElements` to prevent memory issues

## Components

UUICS Core consists of several modular components that can be used independently:

- `DOMScanner`: DOM traversal and element detection
- `MutationTracker`: Mutation observation and event tracking
- `ContextAggregator`: Context aggregation and action generation
- `Serializer`: Context serialization to various formats
- `ActionExecutor`: Action validation and execution

```javascript
import {
  DOMScanner,
  MutationTracker,
  ContextAggregator,
  Serializer,
  ActionExecutor,
} from '@uuics/core';

// Use components independently
const scanner = new DOMScanner(config);
const elements = scanner.scan();
```

## State Tracking

Track JavaScript application state and expose it to AI models.

### Proxy-Based Tracking

```javascript
// Automatically track object changes
const userState = uuics.trackState('user', {
  name: 'John',
  preferences: { theme: 'dark' }
});

userState.name = 'Jane'; // Automatically tracked
```

### Manual Registration

```javascript
let clickCount = 0;

// Register getter for computed values
uuics.registerState('metrics', () => ({
  clicks: clickCount,
  timestamp: Date.now()
}));
```

### Sensitive Data Exclusion

```javascript
const uuics = new UUICSEngine({
  state: {
    enabled: true,
    exclude: ['*password*', '*token*', '*key*']
  }
});

const auth = uuics.trackState('auth', {
  username: 'john',
  password: 'secret', // Will be '[EXCLUDED]' in context
  apiKey: 'sk-123' // Will be '[EXCLUDED]' in context
});
```

## Scope Control

Limit scanning to specific DOM areas for better performance.

```javascript
// Scan only specific areas
const context = await uuics.scan(undefined, {
  rootSelectors: ['#main-content', '.sidebar'],
  excludeSelectors: ['.ads', 'footer']
});
```

## Error Handling

```javascript
try {
  const result = await uuics.execute({
    action: 'click',
    target: '#submit-btn'
  });
  
  if (result.success) {
    console.log('Action completed:', result.message);
  } else {
    console.error('Action failed:', result.error);
  }
} catch (error) {
  console.error('Execution error:', error);
}
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 13+)
- Opera: ✅ Full support

Requires ES6+ and modern browser features (Proxy, MutationObserver, requestIdleCallback).

## TypeScript Support

UUICS is written in TypeScript and provides comprehensive type definitions.

```typescript
import type {
  UUICSConfig,
  PageContext,
  UIElement,
  ActionCommand,
  ActionResult
} from '@uuics/core';
```

## Troubleshooting

### High memory usage
- Reduce `scan.depth` (default: 10)
- Set `performance.maxElements` (default: 1000)
- Use `excludeSelectors` to skip large sections

### Slow scanning
- Enable `performance.enableCache` (default: true)
- Use `scan.useIdleCallback` (default: true)
- Set appropriate `scan.interval` or use manual scanning

### Missing elements
- Check `scan.includeHidden` and `scan.includeDisabled`
- Verify elements are within `scan.depth`
- Check `excludeSelectors` aren't too broad

### Actions not executing
- Verify element exists: `uuics.findElement(selector)`
- Check element is enabled: `element.enabled === true`
- Ensure selector is correct and unique

## Related Projects

- [Playwright](https://playwright.dev/) - E2E testing framework
- [Puppeteer](https://pptr.dev/) - Chrome automation
- [Selenium](https://www.selenium.dev/) - Browser automation
- [Anthropic Claude](https://www.anthropic.com/claude) - AI model
- [OpenAI GPT](https://openai.com/) - AI model

## Contributing

Contributions welcome! See the main [README](../../README.md) for guidelines.

## License

MIT - see [LICENSE](../../LICENSE) file for details.

## Support

- Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/uuics/issues)
- Docs: [Main README](../../README.md)
- Examples: [examples/](../../examples/)
