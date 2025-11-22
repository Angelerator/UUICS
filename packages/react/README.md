# @angelerator/react

React integration for Universal UI Context System (UUICS).

## Features

- **React Hooks**: `useUICS`, `useUIElement`, `useUIElements`
- **Context Provider**: `UUICSProvider` for app-wide access
- **Debug Panel**: Visual component for debugging context
- **TypeScript**: Full type safety with TypeScript

## Installation

```bash
npm install @angelerator/core @angelerator/react
```

## Basic Usage

### Provider Setup

Wrap your app with `UUICSProvider`:

```tsx
import { UUICSProvider } from '@angelerator/react';

function App() {
  return (
    <UUICSProvider
      config={{
        scan: { interval: 2000 },
        track: { mutations: true },
      }}
    >
      <YourApp />
    </UUICSProvider>
  );
}
```

### Using Hooks

#### useUICS

Main hook for accessing UUICS functionality:

```tsx
import { useUICS } from '@angelerator/react';

function MyComponent() {
  const { context, execute, serialize, scan } = useUICS();

  const handleAction = async () => {
    await execute({
      action: 'click',
      target: '#submit-btn',
    });
  };

  return (
    <div>
      <p>Elements: {context?.elements.length}</p>
      <button onClick={handleAction}>Execute Action</button>
    </div>
  );
}
```

#### useUIElement

Hook to track a specific element:

```tsx
import { useUIElement } from '@angelerator/react';

function ElementTracker() {
  const submitButton = useUIElement('#submit-btn');

  return (
    <div>
      {submitButton ? (
        <>
          <p>Button found: {submitButton.label}</p>
          <p>Enabled: {submitButton.enabled ? 'Yes' : 'No'}</p>
        </>
      ) : (
        <p>Button not found</p>
      )}
    </div>
  );
}
```

#### useUIElements

Hook to find elements by type:

```tsx
import { useUIElements } from '@angelerator/react';

function ButtonList() {
  const buttons = useUIElements('button');

  return (
    <ul>
      {buttons.map((btn) => (
        <li key={btn.id}>{btn.label}</li>
      ))}
    </ul>
  );
}
```

### Debug Panel

Visual component for debugging UUICS context:

```tsx
import { DebugPanel } from '@angelerator/react';

function App() {
  return (
    <UUICSProvider>
      <YourApp />
      <DebugPanel format="natural" />
    </UUICSProvider>
  );
}
```

## API Reference

### UUICSProvider

```tsx
interface UUICSProviderProps {
  children: ReactNode;
  config?: UUICSConfig;
}
```

Provides UUICS context to child components.

### useUICS

```typescript
function useUICS(): {
  context: PageContext | null;
  isInitialized: boolean;
  execute: (command: ActionCommand) => Promise<ActionResult>;
  executeBatch: (commands: ActionCommand[]) => Promise<ActionResult[]>;
  serialize: (format?: 'json' | 'natural' | 'openapi') => string;
  scan: () => Promise<PageContext | null>;
  engine: UUICSEngine | null;
}
```

Main hook for UUICS functionality.

### useUUICSContext

```typescript
function useUUICSContext(): ReturnType<typeof useUICS>
```

Access UUICS context from anywhere in the tree. Must be used within `UUICSProvider`.

### useUIElement

```typescript
function useUIElement(selector: string): UIElement | null
```

Find and track a specific element by selector.

### useUIElements

```typescript
function useUIElements(type: string): UIElement[]
```

Find all elements of a specific type.

### DebugPanel

```tsx
interface DebugPanelProps {
  format?: 'json' | 'natural' | 'openapi';
  className?: string;
  style?: React.CSSProperties;
}
```

Visual debug panel component.

## Examples

### AI Integration Example

```tsx
import { useUICS } from '@angelerator/react';
import { ClaudeAdapter } from '@angelerator/models-claude';

function AIAssistant() {
  const { context, execute, serialize } = useUICS();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');

  const adapter = new ClaudeAdapter({ apiKey: 'your-api-key' });

  const handleSubmit = async () => {
    if (!context) return;

    // Serialize context for AI
    const contextString = serialize('natural');

    // Send to Claude
    const aiResponse = await adapter.chat(prompt, context, contextString);
    setResponse(aiResponse);

    // Parse and execute action
    const command = adapter.parseResponse(aiResponse);
    if (command) {
      await execute(command);
    }
  };

  return (
    <div>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button onClick={handleSubmit}>Send to AI</button>
      {response && <pre>{response}</pre>}
    </div>
  );
}
```

### Form Auto-fill Example

```tsx
import { useUICS } from '@angelerator/react';

function AutoFillButton() {
  const { execute, context } = useUICS();

  const autoFill = async () => {
    const formData = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'developer',
    };

    const commands = Object.entries(formData).map(([field, value]) => ({
      action: 'setValue' as const,
      target: `#${field}`,
      parameters: { value },
    }));

    await executeBatch(commands);
  };

  return <button onClick={autoFill}>Auto-fill Form</button>;
}
```

## Styling Debug Panel

The Debug Panel comes with default styles. You can customize it:

```css
.uuics-debug-panel {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
}

.uuics-debug-content {
  max-height: 600px;
  overflow: auto;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}
```

Or pass custom styles:

```tsx
<DebugPanel
  style={{
    position: 'fixed',
    bottom: 20,
    right: 20,
    width: 400,
    maxHeight: 500,
  }}
/>
```

## Performance Considerations

1. **Provider Placement**: Place `UUICSProvider` as high as needed but not higher
2. **Memoization**: UUICS hooks use `useMemo` for optimal re-renders
3. **Subscription**: Hooks automatically cleanup on unmount
4. **Element Finding**: `useUIElement` and `useUIElements` are memoized

## Advanced Patterns

### Conditional Actions

```tsx
function ConditionalWorkflow() {
  const { execute, context } = useUICS();
  
  const runWorkflow = async () => {
    // Step 1: Click menu
    const result1 = await execute({ action: 'click', target: '#menu' });
    
    if (result1.success) {
      // Step 2: Only if step 1 succeeded
      const result2 = await execute({ action: 'click', target: '#submenu' });
      
      if (result2.success) {
        // Step 3: Only if step 2 succeeded
        await execute({
          action: 'setValue',
          target: '#search',
          parameters: { value: 'query' }
        });
      }
    }
  };
  
  return <button onClick={runWorkflow}>Run Workflow</button>;
}
```

### State Tracking

```tsx
function StateTrackingExample() {
  const { engine } = useUICS();
  const [userState, setUserState] = useState({ name: '', role: '' });
  
  useEffect(() => {
    if (engine) {
      // Track state with proxy
      const tracked = engine.trackState('user', userState);
      
      // Register computed state
      engine.registerState('appInfo', () => ({
        timestamp: Date.now(),
        pageTitle: document.title
      }));
      
      return () => {
        engine.untrackState('user');
        engine.unregisterState('appInfo');
      };
    }
  }, [engine]);
  
  return <div>State tracking enabled</div>;
}
```

### Custom Scan Configuration

```tsx
function CustomScanComponent() {
  const { engine } = useUICS();
  
  const scanFormOnly = async () => {
    if (engine) {
      const context = await engine.scan(undefined, {
        rootSelectors: ['#my-form'],
        excludeSelectors: ['.help-text']
      });
      console.log('Form elements:', context.elements);
    }
  };
  
  return <button onClick={scanFormOnly}>Scan Form</button>;
}
```

### Error Boundaries

```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class UUICSErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UUICS Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong with UUICS</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <UUICSErrorBoundary>
      <UUICSProvider>
        <YourApp />
      </UUICSProvider>
    </UUICSErrorBoundary>
  );
}
```

## TypeScript

Full TypeScript support with type inference:

```tsx
import type { PageContext, UIElement, ActionCommand } from '@angelerator/core';
import { useUICS } from '@angelerator/react';

function TypedComponent() {
  const { context, execute } = useUICS();
  
  // Type-safe action execution
  const command: ActionCommand = {
    action: 'click',
    target: '#btn'
  };
  
  // Type-safe element access
  const button: UIElement | undefined = context?.elements.find(
    el => el.type === 'button'
  );
  
  return <div>{button?.label}</div>;
}
```

## Server-Side Rendering (SSR)

UUICS is browser-only. For Next.js or SSR frameworks:

```tsx
'use client'; // Next.js 13+ App Router

import dynamic from 'next/dynamic';

// Dynamic import with no SSR
const UUICSProvider = dynamic(
  () => import('@angelerator/react').then(mod => mod.UUICSProvider),
  { ssr: false }
);

export default function App() {
  return (
    <UUICSProvider>
      <YourApp />
    </UUICSProvider>
  );
}
```

## Testing

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { UUICSProvider, useUICS } from '@angelerator/react';
import { describe, it, expect } from 'vitest';

function TestComponent() {
  const { context, execute } = useUICS();
  
  return (
    <div>
      <span data-testid="count">{context?.elements.length || 0}</span>
      <button
        data-testid="action-btn"
        onClick={() => execute({ action: 'click', target: '#test' })}
      >
        Execute
      </button>
    </div>
  );
}

describe('UUICS React Integration', () => {
  it('provides context to components', async () => {
    render(
      <UUICSProvider config={{ scan: { interval: 0 } }}>
        <TestComponent />
      </UUICSProvider>
    );
    
    await waitFor(() => {
      const count = screen.getByTestId('count');
      expect(count.textContent).not.toBe('0');
    });
  });
});
```

## Troubleshooting

### Hook Returns Null Context

```tsx
// ❌ BAD - Hook called before provider initialized
function MyComponent() {
  const { context } = useUICS();
  console.log(context.elements); // Error: context is null
}

// ✅ GOOD - Check for null
function MyComponent() {
  const { context } = useUICS();
  
  if (!context) return <div>Loading...</div>;
  
  return <div>{context.elements.length} elements</div>;
}
```

### Memory Leaks

```tsx
// ✅ Hooks auto-cleanup, but manual subscriptions need cleanup
useEffect(() => {
  const unsubscribe = engine?.subscribe((context) => {
    console.log('Updated:', context);
  });
  
  return unsubscribe; // Cleanup on unmount
}, [engine]);
```

### Re-renders

```tsx
// Reduce re-renders by selecting only what you need
function OptimizedComponent() {
  const { context } = useUICS();
  
  // Memoize expensive computations
  const buttonCount = useMemo(
    () => context?.elements.filter(el => el.type === 'button').length || 0,
    [context?.elements]
  );
  
  return <div>{buttonCount} buttons</div>;
}
```

## Browser Compatibility

- React 18+ (for useId, automatic batching)
- Modern browsers (same as @angelerator/core)
- No IE11 support

## Migration from v0.x

```tsx
// v0.x
import { UUICSContext } from '@angelerator/react';
const context = useContext(UUICSContext);

// v1.x
import { useUICS } from '@angelerator/react';
const { context } = useUICS(); // More features, better DX
```

## Related Packages

- [@angelerator/core](../core/README.md) - Core engine
- [@angelerator/models-claude](../models-claude/README.md) - Claude adapter
- [@angelerator/models-openai](../models-openai/README.md) - OpenAI adapter

## Contributing

See main [README](../../README.md#contributing) for contribution guidelines.

## License

MIT - see [LICENSE](../../LICENSE) file for details.

## Support

- Issues: [GitHub Issues](https://github.com/Angelerator/uuics/issues)
- Examples: [examples/react-app/](../../examples/react-app/)
- Main Docs: [README](../../README.md)
