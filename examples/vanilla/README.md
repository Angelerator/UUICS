# UUICS Vanilla JavaScript Example

Comprehensive demonstration of all UUICS features using vanilla JavaScript.

## Overview

This example showcases every major feature of UUICS in a single interactive page:

- ✅ State Tracking (proxy-based and manual)
- ✅ Scope Control (root and exclude selectors)
- ✅ Special Elements (ARIA, contenteditable, progress, meter, etc.)
- ✅ Dropdown Options Extraction
- ✅ All Serialization Formats (JSON, Natural Language, OpenAPI)
- ✅ Action Execution
- ✅ Live Context Visualization

## Features Demonstrated

### 1. State Tracking

**Proxy-Based Tracking:**
- User state (name, role)
- Credentials (username, password, API key - with exclusion)

**Manual Registration:**
- Click counters
- Timer (elapsed seconds)
- Application info

### 2. Scope Control

- Root selectors (scan specific sections)
- Exclude selectors (skip ads, footers, etc.)
- Global vs per-scan configuration

### 3. Special Elements

- ARIA roles (button, textbox, checkbox, switch)
- Contenteditable divs
- Progress bars and meters
- Datalist autocomplete
- Details/summary disclosure widgets
- Dialog elements
- Select elements with full option metadata

### 4. Serialization Formats

Switch between formats to see how context is presented:

- **JSON**: Structured data for programmatic use
- **Natural Language**: LLM-friendly text format
- **OpenAPI**: Tool calling format for function-calling models

### 5. Live Updates

The context output updates in real-time as you:
- Type in inputs
- Click buttons
- Change selectors
- Modify state values

## Running the Example

```bash
# From project root
cd examples/vanilla

# Install dependencies (if not already done)
pnpm install

# Start dev server
pnpm vite

# Open browser
# Navigate to http://localhost:5173
```

## How It Works

### Initialization

```javascript
const uuics = new UUICSEngine({
  scan: {
    interval: 0, // Manual scanning (on-demand)
    depth: 10,
    includeHidden: false,
  },
  track: {
    mutations: true,
    clicks: true,
    changes: true,
  },
  state: {
    enabled: true,
    exclude: ['*password*', '*key*', '*token*', '*secret*'],
  },
});
```

### State Tracking Setup

```javascript
// Proxy-based (automatic)
const userState = uuics.trackState('user', {
  name: 'John Doe',
  role: 'Administrator',
});

// Manual registration (computed)
uuics.registerState('counters', () => ({
  clicks: clickCount,
  elapsed: Math.floor((Date.now() - startTime) / 1000),
}));
```

### Scanning with Scope Control

```javascript
// Get selectors from UI
const rootSelectors = document.getElementById('rootSelectors').value;
const excludeSelectors = document.getElementById('excludeSelectors').value;

// Scan with configuration
const context = await uuics.scan(undefined, {
  rootSelectors: rootSelectors ? rootSelectors.split(',').map(s => s.trim()) : undefined,
  excludeSelectors: excludeSelectors ? excludeSelectors.split(',').map(s => s.trim()) : undefined,
});
```

### Format Switching

```javascript
const format = document.getElementById('formatSelect').value;
let serialized;

switch (format) {
  case 'json':
    serialized = JSON.stringify(uuics.serialize(context, 'json'), null, 2);
    break;
  case 'natural':
    serialized = uuics.serialize(context, 'natural');
    break;
  case 'openapi':
    serialized = JSON.stringify(uuics.serialize(context, 'openapi'), null, 2);
    break;
}
```

## Code Structure

The example is contained in a single `index.html` file with:

1. **HTML Structure**: Demo forms and UI elements
2. **CSS Styling**: Clean, modern interface
3. **JavaScript Logic**:
   - UUICS initialization
   - State tracking setup
   - Event handlers
   - Scan and display logic
   - Real-time updates

## Key Sections

### State Tracking Demo
- Input fields for proxy-based tracking
- Buttons for manual state updates
- Live display of current state

### Scope Control Demo
- Text inputs for root selectors
- Text inputs for exclude selectors
- Examples and explanations

### Special Elements Demo
- ARIA role examples
- Contenteditable examples
- Progress/meter examples
- Datalist autocomplete
- Details/summary widgets

### Context Output
- Format selector (JSON/Natural/OpenAPI)
- Live context display
- Syntax highlighting
- Auto-refresh on changes

## Learning Points

This example teaches:

1. **Manual Scanning**: When to scan (on-demand vs continuous)
2. **State Management**: Proxy vs manual registration
3. **Performance**: Using scope control to limit scanning
4. **Security**: Excluding sensitive data from context
5. **Format Selection**: Choosing the right format for your AI model
6. **Special Elements**: Supporting modern HTML and ARIA
7. **Real-time Updates**: Reactive context updates

## Customization Ideas

Extend this example:

1. **Add action execution**: Execute actions from AI responses
2. **Add AI integration**: Connect to Claude/GPT
3. **Add recording**: Record and replay interactions
4. **Add validation**: Validate form data before submission
5. **Add workflows**: Multi-step action sequences

## Common Use Cases

### AI Form Filling

```javascript
// Get context
const context = await uuics.scan();

// Send to AI
const aiResponse = await sendToAI(context);

// Execute action
await uuics.execute(aiResponse.command);
```

### Automated Testing

```javascript
// Record actions
const actions = [];
document.addEventListener('click', (e) => {
  actions.push({
    action: 'click',
    target: generateSelector(e.target),
  });
});

// Replay actions
for (const action of actions) {
  await uuics.execute(action);
  await new Promise(r => setTimeout(r, 100));
}
```

### Accessibility Assistant

```javascript
// Scan with accessibility focus
const context = await uuics.scan(undefined, {
  includeDisabled: true,
  includeHidden: true,
});

// Check for issues
const issues = [];
context.elements.forEach(el => {
  if (el.type === 'button' && !el.label) {
    issues.push(`Button without label: ${el.selector}`);
  }
});
```

## Performance Tips

1. **Manual Scanning**: Set `interval: 0` for on-demand scanning
2. **Scope Control**: Use `rootSelectors` to focus on relevant areas
3. **Exclusions**: Skip ads, navigation, footers with `excludeSelectors`
4. **Depth Limiting**: Set appropriate `depth` for your page
5. **Caching**: Keep `enableCache: true` (default)

## Browser DevTools

Open DevTools to see:
- Console logs for scan timing
- Network tab for performance
- Elements tab to inspect structure

## Troubleshooting

**Context is empty:**
- Check root selectors are valid
- Verify elements aren't excluded
- Check depth limit

**State not updating:**
- Verify state tracking is enabled
- Check exclusion patterns
- Call `refreshStateDisplay()` after changes

**Slow performance:**
- Reduce scan depth
- Use more specific root selectors
- Enable caching

## Next Steps

After exploring this example:

1. Try the [React example](../react-app/) for framework integration
2. Read the [Core API docs](../../packages/core/README.md)
3. Explore [model adapters](../../packages/models-claude/README.md)
4. Build your own AI-powered application!

## Contributing

Found a bug or have an improvement? See [Contributing Guide](../../README.md#contributing).

## License

MIT - see [LICENSE](../../LICENSE)

