/**
 * Utility functions for UUICS
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
} {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
      lastArgs = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
      lastArgs = null;
    }
  };

  debounced.flush = () => {
    if (timeout && lastArgs) {
      clearTimeout(timeout);
      func(...lastArgs);
      timeout = null;
      lastArgs = null;
    }
  };

  return debounced;
}

/**
 * Generate a simple hash from a string
 */
export function hash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'uuics'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  
  if (style.display === 'none') return false;
  if (style.visibility === 'hidden') return false;
  if (parseFloat(style.opacity) === 0) return false;
  
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  
  return true;
}

/**
 * Get a unique CSS selector for an element (optimized for brevity)
 */
export function getElementSelector(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();
  
  // 1. If element has an ID, use it
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }
  
  // 2. Try name attribute for form elements
  if (element.getAttribute('name')) {
    const name = element.getAttribute('name')!;
    const selector = `${tag}[name="${CSS.escape(name)}"]`;
    // Verify it's unique
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }
  
  // 3. Try aria-label (stable and semantic)
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    const selector = `${tag}[aria-label="${CSS.escape(ariaLabel)}"]`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }
  
  // 4. Try title attribute
  const title = element.getAttribute('title');
  if (title) {
    const selector = `${tag}[title="${CSS.escape(title)}"]`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }
  
  // 5. Try type + unique class combination (excluding special characters)
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ').filter(c => c.trim());
    
    // Try just the first SAFE class (no special characters that break selectors)
    for (const cls of classes) {
      // Skip classes that contain : / \ or are Tailwind utility classes
      if (cls.includes(':') || cls.includes('/') || cls.includes('\\')) {
        continue;
      }
      // Skip common Tailwind utility prefixes
      if (cls.match(/^(flex|grid|p-|m-|text-|bg-|border-|rounded-|w-|h-|min-|max-|gap-|space-|items-|justify-|animate-|hover-|focus-|active-|dark-|sm-|md-|lg-|xl-)/)) {
        continue;
      }
      const selector = `${tag}.${CSS.escape(cls)}`;
      const matches = document.querySelectorAll(selector);
      if (matches.length === 1) {
        return selector;
      }
    }
  }
  
  // 6. Try data attributes (prefer data-testid)
  const dataTestId = element.getAttribute('data-testid');
  if (dataTestId) {
    const selector = `[data-testid="${CSS.escape(dataTestId)}"]`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }
  
  // 7. Try other data attributes
  const dataAttrs = Array.from(element.attributes).filter(attr => 
    attr.name.startsWith('data-') && attr.name !== 'data-testid'
  );
  for (const attr of dataAttrs) {
    const selector = `${tag}[${attr.name}="${CSS.escape(attr.value)}"]`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }
  
  // 8. Try role attribute (semantic)
  const role = element.getAttribute('role');
  if (role && role !== 'generic' && role !== 'presentation') {
    const selector = `${tag}[role="${role}"]`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }
  
  // 5. Build shortest possible path using landmarks
  const path: string[] = [];
  let current: HTMLElement | null = element;
  let depth = 0;
  const maxDepth = 5; // Limit path length
  
  while (current && current !== document.body && depth < maxDepth) {
    let selector = current.tagName.toLowerCase();
    
    // Add ID if present (stop here, we have a good anchor)
    if (current.id) {
      path.unshift(`#${CSS.escape(current.id)}`);
      break;
    }
    
    // Try to find a unique identifying feature
    let unique = false;
    
    // Check for unique name
    const name = current.getAttribute('name');
    if (name) {
      selector += `[name="${CSS.escape(name)}"]`;
      unique = true;
    }
    
    // Add position only if needed
    if (!unique && current.parentElement) {
      const siblings = Array.from(current.parentElement.children);
      const sameTagSiblings = siblings.filter(s => 
        s.tagName === current!.tagName &&
        (!name || s.getAttribute('name') === name)
      );
      
      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    
    path.unshift(selector);
    current = current.parentElement;
    depth++;
    
    // If we found a good anchor point, we can stop
    if (unique) {
      // Test if current path is unique
      const testSelector = path.join(' > ');
      if (document.querySelectorAll(testSelector).length === 1) {
        break;
      }
    }
  }
  
  return path.join(' > ');
}

/**
 * Execute a function in the next idle period
 */
export function runInIdle(callback: () => void): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback);
  } else {
    setTimeout(callback, 0);
  }
}

/**
 * Safely get element bounds
 */
export function getElementBounds(element: HTMLElement) {
  try {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  } catch {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
  }
}

/**
 * Find an element by its visible text content
 * Useful as a fallback when CSS selectors fail
 */
export function findElementByText(
  text: string,
  options?: {
    tag?: string;
    exact?: boolean;
    parent?: HTMLElement;
  }
): HTMLElement | null {
  const { tag, exact = false, parent = document.body } = options || {};
  const searchText = text.toLowerCase().trim();
  
  // Build selector
  const selector = tag || '*';
  const elements = parent.querySelectorAll(selector);
  
  for (const el of elements) {
    const elText = (el.textContent || '').toLowerCase().trim();
    
    if (exact) {
      if (elText === searchText) {
        return el as HTMLElement;
      }
    } else {
      // Partial match - element text contains search text or vice versa
      if (elText.includes(searchText) || searchText.includes(elText.split(' ')[0])) {
        // Prefer exact matches for buttons (avoid matching parent containers)
        if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button') {
          return el as HTMLElement;
        }
      }
    }
  }
  
  // Second pass: try to find closest interactive element
  for (const el of elements) {
    const elText = (el.textContent || '').toLowerCase().trim();
    
    if (elText.includes(searchText)) {
      // Find nearest interactive parent
      let current: HTMLElement | null = el as HTMLElement;
      while (current && current !== parent) {
        if (
          current.tagName === 'BUTTON' ||
          current.tagName === 'A' ||
          current.getAttribute('role') === 'button' ||
          current.onclick
        ) {
          return current;
        }
        current = current.parentElement;
      }
    }
  }
  
  return null;
}

/**
 * Check if a CSS selector is valid and matches elements
 */
export function isValidSelector(selector: string): boolean {
  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

