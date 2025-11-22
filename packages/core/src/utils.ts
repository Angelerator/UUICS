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
  // 1. If element has an ID, use it
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }
  
  // 2. Try name attribute for form elements
  if (element.getAttribute('name')) {
    const name = element.getAttribute('name')!;
    const tag = element.tagName.toLowerCase();
    const selector = `${tag}[name="${CSS.escape(name)}"]`;
    // Verify it's unique
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }
  
  // 3. Try type + unique class combination
  const tag = element.tagName.toLowerCase();
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ').filter(c => c.trim());
    
    // Try just the first meaningful class (not utility classes)
    for (const cls of classes) {
      if (!cls.match(/^(flex|grid|p-|m-|text-|bg-|border-|rounded-|w-|h-|min-|max-|gap-|space-|items-|justify-|animate-)/)) {
        const selector = `${tag}.${CSS.escape(cls)}`;
        const matches = document.querySelectorAll(selector);
        if (matches.length === 1) {
          return selector;
        }
      }
    }
  }
  
  // 4. Try data attributes
  const dataAttrs = Array.from(element.attributes).filter(attr => attr.name.startsWith('data-'));
  for (const attr of dataAttrs) {
    const selector = `${tag}[${attr.name}="${CSS.escape(attr.value)}"]`;
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

