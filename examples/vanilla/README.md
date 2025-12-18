# UUICS Vanilla JavaScript Example

A comprehensive demonstration of UUICS using vanilla JavaScript. This example showcases all core features without any framework dependencies.

## 🎯 What This Example Shows

- **Direct Engine Usage**: Using UUICSEngine without frameworks
- **DOM Scanning**: How elements are detected and categorized
- **Context Serialization**: All three output formats (JSON, Natural, OpenAPI)
- **Action Execution**: Executing actions on page elements
- **State Tracking**: Both proxy-based and manual state registration
- **Scope Control**: Include/exclude selectors for targeted scanning
- **Special Elements**: ARIA roles, contenteditable, progress, meter, etc.

## 🚀 Quick Start

```bash
# From the repository root
pnpm install
pnpm build

# Navigate to this example
cd examples/vanilla

# Start the development server
pnpm dev
# Opens at http://localhost:5173
```

## 📂 Project Structure

```
vanilla/
├── index.html        # Complete single-file example
├── package.json
└── vite.config.js
```

The entire example is contained in a single `index.html` file for simplicity.

## 🔧 How It Works

### 1. Initialize UUICS

```javascript
import { UUICSEngine } from '@angelerator/uuics-core';

const uuics = new UUICSEngine({
  scan: {
    interval: 0,  // Manual scanning
    depth: 15
  },
  track: {
    mutations: true,
    clicks: true,
    changes: true
  },
  state: {
    enabled: true,
    exclude: ['*password*', '*token*', '*key*']
  }
});

await uuics.initialize();
```

### 2. Scan the Page

```javascript
// Full page scan
const context = await uuics.scan();

// Scoped scan
const scopedContext = await uuics.scan(null, {
  rootSelectors: ['#main-form'],
  excludeSelectors: ['.tooltip']
});
```

### 3. Serialize Context

```javascript
// Natural language (best for AI)
const natural = uuics.serialize('natural');

// JSON (structured data)
const json = uuics.serialize('json');

// OpenAPI (function calling)
const openapi = uuics.serialize('openapi');
```

### 4. Execute Actions

```javascript
// Click a button
await uuics.execute({
  action: 'click',
  target: '#submit-btn'
});

// Set input value
await uuics.execute({
  action: 'setValue',
  target: '#email',
  parameters: { value: 'user@example.com' }
});

// Select dropdown option
await uuics.execute({
  action: 'select',
  target: '#country',
  parameters: { value: 'us' }
});

// Multi-select
await uuics.execute({
  action: 'select',
  target: '#skills',
  parameters: { value: ['js', 'python', 'rust'] }
});

// Check/uncheck
await uuics.execute({ action: 'check', target: '#newsletter' });
await uuics.execute({ action: 'uncheck', target: '#marketing' });
```

### 5. Track State

```javascript
// Proxy-based tracking (automatic updates)
const appState = uuics.trackState('app', {
  user: { name: 'John', role: 'admin' },
  settings: { theme: 'dark' }
});

// Changes are automatically tracked
appState.user.name = 'Jane';
appState.settings.theme = 'light';

// Manual registration (computed values)
let clickCount = 0;
uuics.registerState('metrics', () => ({
  clicks: clickCount,
  timestamp: Date.now()
}));

// Increment on clicks
document.addEventListener('click', () => clickCount++);
```

## 🎨 UI Sections in the Example

### Standard Form Elements
- Text inputs (name, email, phone)
- Number input with constraints
- URL input
- Textarea for long text

### Selection Controls
- Single-select dropdown (country)
- Role dropdown with options
- Multi-select dropdown (skills)

### Checkboxes & Radio Buttons
- Interest checkboxes (coding, design, data, mobile)
- Preference checkboxes (newsletter, notifications, marketing)
- Experience level radio buttons
- Work mode radio buttons

### Special HTML Elements
- Progress bar
- Meter element
- Input with datalist (autocomplete)
- Contenteditable div
- Details/summary accordion
- Dialog modal

### ARIA Roles
- Custom button (`role="button"`)
- Custom checkbox (`role="checkbox"`)
- Custom switch (`role="switch"`)
- Custom textbox (`role="textbox"`)

### Action Buttons
- Save, Submit, Delete, Cancel buttons
- Each with different styling

## 📊 Output Formats

### Natural Language Output

```
# Page Context

Page: UUICS Vanilla Example
URL: http://localhost:5173/

## Summary
Total Actionable Elements: 35
Available Actions: 52

## Interactive Elements

### Inputs (8)
- **Full Name (#name)** → `#name`
- **Email Address (#email)** → `#email`
...

### Selects (3)
- **Country (#country)** [OPTIONS: "USA" (value: us), "UK" (value: uk)...] → `#country`
...

### Buttons (4)
- **💾 Save Changes (#save-btn)** → `#save-btn`
...

## Application State

### app
{
  "user": { "name": "John", "role": "admin" },
  "settings": { "theme": "dark" }
}
```

### JSON Output

```json
{
  "id": "context-abc123",
  "timestamp": 1702900000000,
  "url": "http://localhost:5173/",
  "title": "UUICS Vanilla Example",
  "elements": [
    {
      "type": "input",
      "selector": "#name",
      "label": "Full Name",
      "value": "",
      "visible": true,
      "enabled": true
    }
  ],
  "actions": [
    { "type": "setValue", "target": "#name", "description": "Set value Full Name" }
  ],
  "state": {
    "app": { "user": { "name": "John" } }
  }
}
```

### OpenAPI Output

```json
{
  "openapi": "3.1.0",
  "info": { "title": "UI Context", "version": "1.0.0" },
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "ui_setValue",
        "description": "Set value in an input field",
        "parameters": {
          "type": "object",
          "properties": {
            "target": {
              "type": "string",
              "enum": ["#name", "#email", "#phone"]
            },
            "value": { "type": "string" }
          },
          "required": ["target", "value"]
        }
      }
    }
  ]
}
```

## 🤖 Claude Integration

The example includes an integrated Claude chat. To use it:

1. Start the Claude CLI proxy (from the react-app example):
   ```bash
   cd ../react-app
   node claude-cli-proxy.cjs
   ```

2. Click the 🤖 button in the example
3. Start chatting with Claude about the page

The Claude adapter is inlined directly in the HTML for simplicity.

## 🔬 Experimenting

### Console Access

The UUICS engine is available globally:

```javascript
// In browser console:
window.uuics

// Scan the page
await uuics.scan()

// Get context
uuics.getContext()

// Execute action
await uuics.execute({ action: 'click', target: '#save-btn' })

// Serialize
uuics.serialize('natural')
```

### Testing Scope Control

```javascript
// Scan only the form section
await uuics.scan(null, {
  rootSelectors: ['#main-form']
});

// Exclude certain elements
await uuics.scan(null, {
  excludeSelectors: ['.skip-this', '#advertisement']
});
```

### Testing State Tracking

```javascript
// Track a new object
const cart = uuics.trackState('cart', {
  items: [],
  total: 0
});

// Modify it
cart.items.push({ id: 1, name: 'Product' });
cart.total = 29.99;

// Check in context
const ctx = await uuics.scan();
console.log(ctx.state.cart);
```

## 🐛 Debugging Tips

### Element Not Found
```javascript
// Check if element exists
const el = uuics.findElement('#my-selector');
console.log(el);  // null if not found
```

### Action Failed
```javascript
const result = await uuics.execute({ action: 'click', target: '#btn' });
if (!result.success) {
  console.error(result.error);
}
```

### State Not Appearing
```javascript
// Check tracked state names
console.log(uuics.getTrackedStateNames());

// Verify state is enabled in config
console.log(uuics.config.state.enabled);
```

## 📝 Code Walkthrough

The `index.html` file is organized into sections:

1. **Styles** (lines 1-500): Tailwind-like utility classes
2. **HTML Structure** (lines 500-1200): Demo form elements
3. **JavaScript** (lines 1200-end):
   - UUICS initialization
   - Event handlers for buttons
   - State tracking setup
   - Claude adapter (inlined)
   - Chat functionality

## 🔗 Related

- [Main README](../../README.md) - Project overview
- [Core Package](../../packages/core/README.md) - API documentation
- [React Example](../react-app/README.md) - React integration

## 📄 License

MIT - Part of the UUICS project.
