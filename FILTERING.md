# Advanced Filtering in UUICS

UUICS provides powerful filtering capabilities to control which elements are scanned and included in the UI context. This helps reduce noise, improve performance, and focus on relevant elements for AI interaction.

## Table of Contents

1. [Element Type Filtering](#element-type-filtering)
2. [Regex Pattern Filtering](#regex-pattern-filtering)
3. [CSS Selector Filtering](#css-selector-filtering)
4. [Custom Filter Functions](#custom-filter-functions)
5. [Combining Filters](#combining-filters)
6. [Performance Considerations](#performance-considerations)

---

## Element Type Filtering

Control which HTML element types are included or excluded from scanning.

### Include Specific Element Types

Only scan specific HTML element types:

```typescript
import { UUICSEngine } from '@uuics/core';

const uuics = new UUICSEngine({
  scan: {
    // Only scan input, button, and select elements
    includeElements: ['input', 'button', 'select']
  }
});
```

You can also use comma-separated strings:

```typescript
const uuics = new UUICSEngine({
  scan: {
    includeElements: 'input,button,select,textarea'
  }
});
```

### Exclude Specific Element Types

Exclude certain element types from scanning:

```typescript
const uuics = new UUICSEngine({
  scan: {
    // Exclude script, style, and noscript elements
    excludeElements: ['script', 'style', 'noscript']
  }
});
```

### Use Cases

- Focus on form elements: `includeElements: ['input', 'select', 'textarea', 'button']`
- Exclude non-interactive elements: `excludeElements: ['script', 'style', 'link', 'meta']`
- Scan only buttons: `includeElements: 'button'`

---

## Regex Pattern Filtering

Use regular expressions to match against element selectors, IDs, classes, and data attributes.

### Include Pattern

Include only elements that match specific regex patterns:

```typescript
const uuics = new UUICSEngine({
  scan: {
    // Include only elements with 'admin' in their ID, class, or selector
    includePatterns: /admin/i
  }
});
```

Multiple patterns:

```typescript
const uuics = new UUICSEngine({
  scan: {
    // Include elements matching any of these patterns
    includePatterns: [
      /admin/i,           // Contains 'admin'
      /user-input/i,      // Contains 'user-input'
      /data-category/     // Has data-category attribute
    ]
  }
});
```

### Exclude Pattern

Exclude elements that match specific regex patterns:

```typescript
const uuics = new UUICSEngine({
  scan: {
    // Exclude elements with 'temp', 'test', or 'debug' in their attributes
    excludePatterns: [/temp/i, /test/i, /debug/i]
  }
});
```

### Pattern Matching Details

Patterns are tested against a string containing:
- Element tag name (e.g., `input`)
- Element ID (e.g., `#username`)
- Element classes (e.g., `.form-field .required`)
- Data attributes (e.g., `[data-category="user"]`)

Example element representation:
```
input #username .form-field .required [data-category="user"]
```

### Use Cases

- Include only admin controls: `includePatterns: /admin/i`
- Exclude temporary/test fields: `excludePatterns: [/temp/i, /test/i]`
- Match specific data attributes: `includePatterns: /data-category="action"/`
- Include fields by naming convention: `includePatterns: /user-|customer-|order-/`

---

## CSS Selector Filtering

Use CSS selectors for precise element targeting.

### Root Selectors

Limit scanning to specific containers:

```typescript
const uuics = new UUICSEngine({
  scan: {
    // Only scan within the main form
    rootSelectors: '#main-form'
  }
});
```

Multiple root selectors:

```typescript
const uuics = new UUICSEngine({
  scan: {
    // Scan multiple specific areas
    rootSelectors: ['#form1', '#form2', '.modal-content']
  }
});
```

Comma-separated string format:

```typescript
const uuics = new UUICSEngine({
  scan: {
    rootSelectors: '#form1, #form2, .modal-content'
  }
});
```

### Exclude Selectors

Exclude specific elements or containers:

```typescript
const uuics = new UUICSEngine({
  scan: {
    // Exclude navigation and footer elements
    excludeSelectors: ['.navigation', '.footer', '#ads']
  }
});
```

### Dynamic Scanning

Override selectors at scan time:

```typescript
// Scan only a specific section
await uuics.scan(null, {
  rootSelectors: '#checkout-form'
});

// Exclude certain sections
await uuics.scan(null, {
  excludeSelectors: '.advertisement, .sidebar'
});
```

### Use Cases

- Focus on forms: `rootSelectors: 'form'`
- Exclude navigation: `excludeSelectors: ['nav', 'header', 'footer']`
- Scan modals only: `rootSelectors: '.modal.active'`
- Skip advertisements: `excludeSelectors: '.ad, .advertisement, [data-ad]'`

---

## Custom Filter Functions

Implement custom filtering logic with JavaScript functions:

```typescript
const uuics = new UUICSEngine({
  scan: {
    filter: (element: HTMLElement) => {
      // Include only visible and enabled elements
      if (element.hasAttribute('disabled')) return false;
      if (getComputedStyle(element).display === 'none') return false;
      
      // Custom business logic
      if (element.hasAttribute('data-internal')) return false;
      
      return true;
    }
  }
});
```

### Advanced Custom Filter Examples

Filter by computed styles:

```typescript
filter: (element) => {
  const style = getComputedStyle(element);
  return style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
}
```

Filter by parent hierarchy:

```typescript
filter: (element) => {
  // Exclude elements inside .temp containers
  return !element.closest('.temp');
}
```

Filter by attributes:

```typescript
filter: (element) => {
  // Include only elements with required attribute
  return element.hasAttribute('required');
}
```

### Use Cases

- Complex visibility checks
- Business rule validation
- Dynamic filtering based on application state
- Performance optimization (skip expensive elements)

---

## Combining Filters

All filter types can be used together. Filters are applied in this order:

1. **excludeSelectors** - CSS selector exclusions
2. **excludeElements** - Element type exclusions  
3. **excludePatterns** - Regex pattern exclusions
4. **includeElements** - Element type inclusions
5. **includePatterns** - Regex pattern inclusions
6. **visibility checks** - Hidden element filtering
7. **filter function** - Custom filter logic

### Example: Comprehensive Filtering

```typescript
const uuics = new UUICSEngine({
  scan: {
    // Only scan within the main content
    rootSelectors: '#main-content',
    
    // Exclude navigation and ads
    excludeSelectors: ['nav', '.advertisement'],
    
    // Skip script and style tags
    excludeElements: ['script', 'style', 'link'],
    
    // Exclude test/debug elements
    excludePatterns: [/test/i, /debug/i],
    
    // Include only interactive elements
    includeElements: ['input', 'button', 'select', 'textarea', 'a'],
    
    // Focus on user-facing elements
    includePatterns: /user-|form-|action-/,
    
    // Custom logic
    filter: (element) => {
      // Skip disabled elements
      if (element.hasAttribute('disabled')) return false;
      
      // Skip elements marked as internal
      if (element.dataset.internal === 'true') return false;
      
      return true;
    }
  }
});
```

### Example: Focus on Admin Controls

```typescript
const uuics = new UUICSEngine({
  scan: {
    // Only scan admin panel
    rootSelectors: '#admin-panel',
    
    // Include admin-related elements
    includePatterns: /admin/i,
    
    // Exclude read-only displays
    excludeSelectors: '.read-only, .display-only'
  }
});
```

### Example: Form-Only Scanning

```typescript
const uuics = new UUICSEngine({
  scan: {
    // Only form elements
    includeElements: ['input', 'select', 'textarea', 'button'],
    
    // Exclude hidden fields
    filter: (element) => {
      if (element instanceof HTMLInputElement) {
        return element.type !== 'hidden';
      }
      return true;
    }
  }
});
```

---

## Performance Considerations

### Impact on Scan Performance

Filtering improves performance by:
- Reducing the number of elements to analyze
- Decreasing context size sent to AI models
- Speeding up serialization

### Best Practices

1. **Use CSS selectors first**: They're the fastest filtering method
   ```typescript
   rootSelectors: '#target-area'  // Fast
   ```

2. **Element type filtering**: Second fastest option
   ```typescript
   includeElements: ['input', 'button']  // Fast
   ```

3. **Regex patterns**: Moderate performance impact
   ```typescript
   includePatterns: /admin/i  // Moderate
   ```

4. **Custom functions**: Most flexible but slowest
   ```typescript
   filter: (el) => { /* complex logic */ }  // Slower
   ```

### Optimization Tips

Prefer specific filters over broad ones:

```typescript
// Good: Specific and fast
rootSelectors: '#checkout-form'

// Less optimal: Scanning everything then filtering
filter: (el) => el.closest('#checkout-form')
```

Use element type filtering when possible:

```typescript
// Good: Fast element type check
includeElements: ['input', 'button']

// Less optimal: Regex for element types
includePatterns: /^(input|button)$/
```

Combine filters to reduce set early:

```typescript
scan: {
  rootSelectors: '#main',        // Reduce scope first
  excludeElements: ['script'],   // Then filter by type
  includePatterns: /user-/       // Finally apply patterns
}
```

### Measuring Performance

```typescript
const startTime = performance.now();
const context = await uuics.scan();
const duration = performance.now() - startTime;

console.log(`Scan took ${duration}ms`);
console.log(`Found ${context.elements.length} elements`);
```

---

## React Integration

Filtering works the same in React:

```tsx
import { UUICSProvider } from '@uuics/react';

function App() {
  return (
    <UUICSProvider
      config={{
        scan: {
          rootSelectors: '#app-content',
          excludeSelectors: ['.navigation', '.footer'],
          includeElements: ['input', 'button', 'select']
        }
      }}
    >
      <YourApp />
    </UUICSProvider>
  );
}
```

---

## Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
<body>
  <div id="app">
    <form id="user-form">
      <input id="username" type="text" placeholder="Username">
      <input id="password" type="password" placeholder="Password">
      <button type="submit">Login</button>
    </form>
    <div class="ads">Advertisement</div>
  </div>

  <script type="module">
    import { UUICSEngine } from '@uuics/core';

    const uuics = new UUICSEngine({
      scan: {
        // Only scan the form
        rootSelectors: '#user-form',
        
        // Exclude ads
        excludeSelectors: '.ads',
        
        // Only interactive elements
        includeElements: ['input', 'button']
      }
    });

    await uuics.initialize();
    const context = await uuics.scan();
    
    console.log(context); // Contains only form elements
  </script>
</body>
</html>
```

---

## Summary

UUICS filtering provides multiple layers of control:

- **Element Types**: Fast filtering by HTML tag
- **CSS Selectors**: Precise targeting of containers
- **Regex Patterns**: Flexible matching against element attributes
- **Custom Functions**: Maximum flexibility for complex logic

Choose the right filtering method based on your needs, and combine them for powerful, precise control over what AI sees in your UI.

