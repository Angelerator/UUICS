/**
 * Selector Sanitizer - Clean and validate CSS selectors before use
 * 
 * This utility helps UUICS handle malformed selectors from AI systems
 * or other sources that may include formatting artifacts.
 */

export interface SanitizationResult {
  selector: string;
  original: string;
  modified: boolean;
  warnings: string[];
}

/**
 * Sanitize a CSS selector by removing common formatting issues
 */
export function sanitizeSelector(selector: string): SanitizationResult {
  const original = selector;
  const warnings: string[] = [];
  let cleaned = selector;

  // 1. Trim whitespace
  cleaned = cleaned.trim();

  // 2. Remove leading/trailing em-dashes (– U+2013) and regular dashes
  const dashPattern = /^[–\-\s]+|[–\-\s]+$/g;
  if (dashPattern.test(cleaned)) {
    warnings.push('Removed leading/trailing dashes');
    cleaned = cleaned.replace(dashPattern, '');
  }

  // 3. Remove extra quotes (both regular and smart quotes)
  // Handle patterns like: – "selector" or "selector"
  const quotePattern = /^["'""'']+|["'""'']+$/g;
  if (quotePattern.test(cleaned)) {
    warnings.push('Removed surrounding quotes');
    cleaned = cleaned.replace(quotePattern, '');
  }

  // 4. Handle nested quotes: – \"selector\" → selector
  if (cleaned.includes('\\"') || cleaned.includes("\\'")) {
    warnings.push('Removed escaped quotes');
    cleaned = cleaned.replace(/\\["']/g, '');
  }

  // 5. Collapse multiple spaces
  if (/\s{2,}/.test(cleaned)) {
    warnings.push('Collapsed multiple spaces');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
  }

  // 6. Final trim after all replacements
  cleaned = cleaned.trim();

  return {
    selector: cleaned,
    original,
    modified: cleaned !== original,
    warnings,
  };
}

/**
 * Validate a CSS selector without attempting to query the DOM
 */
export function validateSelector(selector: string): { valid: boolean; error?: string } {
  // Check for empty selector
  if (!selector || selector.trim() === '') {
    return { valid: false, error: 'Selector is empty' };
  }

  // Check for obvious invalid patterns
  const invalidPatterns = [
    { pattern: /^[–\-\s]+$/, error: 'Selector contains only dashes and whitespace' },
    { pattern: /^["'""'']+$/, error: 'Selector contains only quotes' },
    { pattern: /\s–\s/, error: 'Selector contains em-dash surrounded by spaces (likely markdown artifact)' },
    { pattern: /^ACTION:/, error: 'Selector appears to be an action command, not a CSS selector' },
  ];

  for (const { pattern, error } of invalidPatterns) {
    if (pattern.test(selector)) {
      return { valid: false, error };
    }
  }

  // Try to validate with querySelector (without querying DOM)
  // This catches CSS syntax errors
  try {
    // Create a temporary element to test selector validity
    const testDiv = document.createElement('div');
    testDiv.querySelector(selector); // This validates syntax without actually finding anything
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid CSS selector syntax',
    };
  }
}

/**
 * Sanitize and validate a selector, returning a clean version or error
 */
export function cleanAndValidateSelector(selector: string): {
  success: boolean;
  selector?: string;
  error?: string;
  warnings?: string[];
} {
  // First sanitize
  const sanitized = sanitizeSelector(selector);

  // Log sanitization if modifications were made
  if (sanitized.modified && sanitized.warnings.length > 0) {
    console.warn(
      '[UUICS Sanitizer] Cleaned selector:',
      `"${sanitized.original}" → "${sanitized.selector}"`,
      '|',
      sanitized.warnings.join(', ')
    );
  }

  // Then validate
  const validation = validateSelector(sanitized.selector);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid selector: ${validation.error}. Original: "${selector}", Cleaned: "${sanitized.selector}"`,
    };
  }

  return {
    success: true,
    selector: sanitized.selector,
    warnings: sanitized.modified ? sanitized.warnings : undefined,
  };
}

