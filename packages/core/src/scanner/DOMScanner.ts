/**
 * DOM Scanner - Performance-optimized DOM traversal and element detection
 */

import type { UIElement, ElementType, UUICSConfig, SelectOption, SelectMetadata } from '../types';
import { isElementVisible, getElementSelector, getElementBounds, hash, generateId } from '../utils';

/**
 * Scanner configuration
 */
interface ScannerConfig {
  depth: number;
  includeHidden: boolean;
  includeDisabled: boolean;
  includeBounds: boolean;
  rootSelectors?: string[] | string;
  excludeSelectors?: string[] | string;
  includePatterns?: RegExp[];
  excludePatterns?: RegExp[];
  includeElements?: string[];
  excludeElements?: string[];
  filter?: (element: HTMLElement) => boolean;
  maxElements?: number;
}

/**
 * Element cache entry
 */
interface CacheEntry {
  element: UIElement;
  hash: string;
  timestamp: number;
}

/**
 * DOM Scanner class
 */
export class DOMScanner {
  private config: ScannerConfig;
  private cache: WeakMap<HTMLElement, CacheEntry>;
  private elementCount: number = 0;

  constructor(config?: Partial<UUICSConfig>) {
    this.config = {
      depth: config?.scan?.depth ?? 10,
      includeHidden: config?.scan?.includeHidden ?? false,
      includeDisabled: config?.scan?.includeDisabled ?? false,
      includeBounds: config?.serialize?.includeBounds ?? false,
      rootSelectors: this.parseSelectors(config?.scan?.rootSelectors),
      excludeSelectors: this.parseSelectors(config?.scan?.excludeSelectors),
      includePatterns: this.parsePatterns(config?.scan?.includePatterns),
      excludePatterns: this.parsePatterns(config?.scan?.excludePatterns),
      includeElements: this.parseElements(config?.scan?.includeElements),
      excludeElements: this.parseElements(config?.scan?.excludeElements),
      filter: config?.scan?.filter,
      maxElements: config?.performance?.maxElements ?? 1000,
    };
    
    this.cache = new WeakMap();
  }

  /**
   * Parse selector input - accepts string (comma-separated) or array
   */
  private parseSelectors(input?: string | string[]): string[] | undefined {
    if (!input) return undefined;
    
    if (typeof input === 'string') {
      // Split by comma, trim, and filter empty strings
      return input.split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    
    // Already an array - trim each entry and filter empties
    return input.map(s => s.trim()).filter(s => s.length > 0);
  }

  /**
   * Parse regex patterns - accepts single RegExp or array
   */
  private parsePatterns(input?: RegExp | RegExp[]): RegExp[] | undefined {
    if (!input) return undefined;
    return Array.isArray(input) ? input : [input];
  }

  /**
   * Parse element types - accepts string (comma-separated) or array
   */
  private parseElements(input?: string | string[]): string[] | undefined {
    if (!input) return undefined;
    
    if (typeof input === 'string') {
      // Split by comma, trim, lowercase, and filter empty strings
      return input.split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0);
    }
    
    // Already an array - trim, lowercase each entry and filter empties
    return input.map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
  }

  /**
   * Get element info string for regex matching
   * Returns a string containing selector, id, and classes
   */
  private getElementInfo(element: HTMLElement): string {
    const parts: string[] = [];
    
    // Add tag name
    parts.push(element.tagName.toLowerCase());
    
    // Add ID
    if (element.id) {
      parts.push(`#${element.id}`);
    }
    
    // Add classes
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(/\s+/).filter(c => c.length > 0);
      classes.forEach(c => parts.push(`.${c}`));
    }
    
    // Add data attributes
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        parts.push(`[${attr.name}="${attr.value}"]`);
      }
    });
    
    return parts.join(' ');
  }

  /**
   * Scan the DOM and return all interactive elements
   */
  scan(root?: HTMLElement, configOverride?: Partial<ScannerConfig>): UIElement[] {
    const startTime = performance.now();
    this.elementCount = 0;
    
    // Parse selectors and patterns in override config
    const parsedOverride = configOverride ? {
      ...configOverride,
      rootSelectors: configOverride.rootSelectors ? this.parseSelectors(configOverride.rootSelectors) : undefined,
      excludeSelectors: configOverride.excludeSelectors ? this.parseSelectors(configOverride.excludeSelectors) : undefined,
      includePatterns: configOverride.includePatterns ? this.parsePatterns(configOverride.includePatterns) : undefined,
      excludePatterns: configOverride.excludePatterns ? this.parsePatterns(configOverride.excludePatterns) : undefined,
      includeElements: configOverride.includeElements ? this.parseElements(configOverride.includeElements) : undefined,
      excludeElements: configOverride.excludeElements ? this.parseElements(configOverride.excludeElements) : undefined,
    } : undefined;
    
    // Merge config override with instance config
    const scanConfig = parsedOverride ? { ...this.config, ...parsedOverride } : this.config;
    const previousConfig = this.config;
    this.config = scanConfig;
    
    let elements: UIElement[] = [];
    
    // Handle root selectors (multiple roots)
    if (scanConfig.rootSelectors && scanConfig.rootSelectors.length > 0) {
      for (const selector of scanConfig.rootSelectors) {
        const roots = document.querySelectorAll(selector);
        for (const rootElement of Array.from(roots)) {
          if (rootElement instanceof HTMLElement) {
            elements.push(...this.scanRecursive(rootElement, 0));
          }
        }
      }
    } else {
      // Default: scan from provided root or document.body
      const scanRoot = root || document.body;
      elements = this.scanRecursive(scanRoot, 0);
    }
    
    // Restore original config
    this.config = previousConfig;
    
    const duration = performance.now() - startTime;
    
    // Log scan stats in debug mode
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[UUICS Scanner] Scanned ${this.elementCount} elements in ${duration.toFixed(2)}ms`);
    }
    
    return elements;
  }

  /**
   * Recursively scan DOM tree
   */
  private scanRecursive(element: HTMLElement, depth: number): UIElement[] {
    const elements: UIElement[] = [];
    
    // Check depth limit
    if (depth > this.config.depth) {
      return elements;
    }
    
    // Check element count limit
    if (this.elementCount >= this.config.maxElements!) {
      return elements;
    }
    
    // Cache tagName and lazy-build elementInfo for reuse
    const tagName = element.tagName.toLowerCase();
    let elementInfo: string | null = null;
    
    // Check if element matches exclude selectors
    if (this.config.excludeSelectors && this.config.excludeSelectors.length > 0) {
      for (const excludeSelector of this.config.excludeSelectors) {
        if (element.matches(excludeSelector)) {
          return elements;
        }
      }
    }
    
    // Check if element type is excluded
    if (this.config.excludeElements && this.config.excludeElements.includes(tagName)) {
      return elements;
    }
    
    // Check if element matches exclude patterns (lazy build elementInfo only if needed)
    if (this.config.excludePatterns && this.config.excludePatterns.length > 0) {
      elementInfo = this.getElementInfo(element);
      for (const pattern of this.config.excludePatterns) {
        if (pattern.test(elementInfo)) {
          return elements;
        }
      }
    }
    
    // Get children once for reuse (avoid multiple Array.from calls)
    const children = element.children;
    const childrenLength = children.length;
    
    // Check if element type is in include list (if specified)
    if (this.config.includeElements && this.config.includeElements.length > 0) {
      if (!this.config.includeElements.includes(tagName)) {
        // Element type not in include list, skip it but continue scanning children
        for (let i = 0; i < childrenLength; i++) {
          if (this.elementCount >= this.config.maxElements!) break;
          elements.push(...this.scanRecursive(children[i] as HTMLElement, depth + 1));
        }
        return elements;
      }
    }
    
    // Check if element matches include patterns (reuse elementInfo if already built)
    if (this.config.includePatterns && this.config.includePatterns.length > 0) {
      if (!elementInfo) elementInfo = this.getElementInfo(element);
      let matchesInclude = false;
      for (const pattern of this.config.includePatterns) {
        if (pattern.test(elementInfo)) {
          matchesInclude = true;
          break;
        }
      }
      if (!matchesInclude) {
        // Element doesn't match include patterns, skip it but continue scanning children
        for (let i = 0; i < childrenLength; i++) {
          if (this.elementCount >= this.config.maxElements!) break;
          elements.push(...this.scanRecursive(children[i] as HTMLElement, depth + 1));
        }
        return elements;
      }
    }
    
    // Check if element is interactive and passes visibility/filter checks
    let shouldIncludeElement = true;
    
    // Check visibility
    if (!this.config.includeHidden && !isElementVisible(element)) {
      shouldIncludeElement = false;
    }
    
    // Check custom filter
    if (shouldIncludeElement && this.config.filter && !this.config.filter(element)) {
      shouldIncludeElement = false;
    }
    
    // Add element if it passes all checks
    if (shouldIncludeElement) {
    const uiElement = this.analyzeElement(element);
    if (uiElement) {
      elements.push(uiElement);
      this.elementCount++;
      }
    }
    
    // Always scan children (even if parent was excluded) - using direct iteration for performance
    for (let i = 0; i < childrenLength; i++) {
      if (this.elementCount >= this.config.maxElements!) break;
      elements.push(...this.scanRecursive(children[i] as HTMLElement, depth + 1));
    }
    
    return elements;
  }

  /**
   * Analyze a single element and determine if it's interactive
   */
  private analyzeElement(element: HTMLElement): UIElement | null {
    const type = this.getElementType(element);
    
    // Check cache
    const elementHash = this.hashElement(element);
    const cached = this.cache.get(element);
    
    if (cached && cached.hash === elementHash) {
      // Return cached element with updated timestamp
      return {
        ...cached.element,
        metadata: {
          ...cached.element.metadata,
          lastUpdated: Date.now(),
        },
      };
    }
    
    // Build UI element
    const uiElement = this.buildUIElement(element, type);
    
    // Cache the element
    this.cache.set(element, {
      element: uiElement,
      hash: elementHash,
      timestamp: Date.now(),
    });
    
    return uiElement;
  }

  /**
   * Build UIElement object from HTMLElement
   */
  private buildUIElement(element: HTMLElement, type: ElementType): UIElement {
    const tag = element.tagName.toLowerCase();
    const selector = getElementSelector(element);
    const label = this.getElementLabel(element);
    const attributes = this.getRelevantAttributes(element);
    const value = this.getElementValue(element);
    const text = this.getElementText(element);
    const visible = isElementVisible(element);
    const enabled = !this.isDisabled(element);
    
    const uiElement: UIElement = {
      id: element.id || generateId('element'),
      type,
      tag,
      selector,
      label,
      attributes,
      value,
      text,
      visible,
      enabled,
      metadata: {
        hash: this.hashElement(element),
        lastUpdated: Date.now(),
      },
    };
    
    // Extract options for select elements
    if (type === 'select' && element instanceof HTMLSelectElement) {
      const options = this.extractSelectOptions(element);
      const selectMetadata = this.extractSelectMetadata(element, options);
      
      uiElement.options = options;
      uiElement.selectMetadata = selectMetadata;
      
      // Also create child UIElements for each option
      uiElement.children = options.map(opt => this.createOptionElement(opt, element));
      
      // Store in metadata for backward compatibility
      uiElement.metadata!.options = options;
      uiElement.metadata!.selectMetadata = selectMetadata;
    }
    
    // Add bounds if configured
    if (this.config.includeBounds) {
      uiElement.bounds = getElementBounds(element);
    }
    
    return uiElement;
  }

  /**
   * Extract options from a select element
   */
  private extractSelectOptions(selectElement: HTMLSelectElement): SelectOption[] {
    const options: SelectOption[] = [];
    const optionElements = Array.from(selectElement.options);
    
    optionElements.forEach((option, index) => {
      options.push({
        value: option.value,
        label: option.label || option.text,
        selected: option.selected,
        disabled: option.disabled,
        text: option.text,
        index,
      });
    });
    
    return options;
  }

  /**
   * Extract metadata for a select element
   */
  private extractSelectMetadata(selectElement: HTMLSelectElement, options: SelectOption[]): SelectMetadata {
    const selectedValues = options
      .filter(opt => opt.selected)
      .map(opt => opt.value);
    
    return {
      options,
      multiple: selectElement.multiple,
      selectedValues,
      size: selectElement.size > 0 ? selectElement.size : undefined,
    };
  }

  /**
   * Create a UIElement for an option
   */
  private createOptionElement(option: SelectOption, selectElement: HTMLSelectElement): UIElement {
    return {
      id: generateId('option'),
      type: 'other',
      tag: 'option',
      selector: `${getElementSelector(selectElement)} > option:nth-child(${option.index + 1})`,
      label: option.label,
      attributes: {
        value: option.value,
        selected: option.selected,
        disabled: option.disabled,
      },
      value: option.value,
      text: option.text,
      visible: true,
      enabled: !option.disabled,
      metadata: {
        hash: hash(`option-${option.value}-${option.selected}`),
        lastUpdated: Date.now(),
      },
    };
  }

  /**
   * Determine element type
   */
  private getElementType(element: HTMLElement): ElementType {
    const tag = element.tagName.toLowerCase();
    const type = element.getAttribute('type')?.toLowerCase();
    const role = element.getAttribute('role')?.toLowerCase();
    const contentEditable = element.getAttribute('contenteditable');
    
    // ARIA roles take precedence
    if (role) {
      if (role === 'button') return 'button';
      if (role === 'link') return 'link';
      if (role === 'textbox') return 'input';
      if (role === 'checkbox') return 'checkbox';
      if (role === 'radio') return 'radio';
      if (role === 'combobox' || role === 'listbox') return 'select';
    }
    
    // ContentEditable elements (divs used as text inputs)
    if (contentEditable === 'true' || contentEditable === '') {
      return 'input';
    }
    
    // Native form controls
    if (tag === 'button') return 'button';
    if (tag === 'a') return 'link';
    if (tag === 'select') return 'select';
    if (tag === 'textarea') return 'textarea';
    if (tag === 'form') return 'form';
    if (tag === 'datalist') return 'select'; // Treat datalist as select-like
    if (tag === 'output') return 'text'; // Output shows results
    if (tag === 'meter' || tag === 'progress') return 'other'; // Progress indicators
    if (tag === 'details') return 'button'; // Details acts like a toggle
    if (tag === 'dialog') return 'container'; // Dialog is a container
    if (tag === 'fieldset') return 'container'; // Fieldset groups elements
    
    // Input types
    if (tag === 'input') {
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      if (type === 'submit' || type === 'button') return 'button';
      return 'input';
    }
    
    // Interactive elements with click handlers
    if (element.hasAttribute('onclick') || element.hasAttribute('ng-click')) {
      return 'button';
    }
    
    // Containers
    if (this.isContainer(element)) {
      return 'container';
    }
    
    // Text content
    if (this.hasSignificantText(element)) {
      return 'text';
    }
    
    return 'other';
  }

  /**
   * Check if element is a container
   */
  private isContainer(element: HTMLElement): boolean {
    const tag = element.tagName.toLowerCase();
    return ['div', 'section', 'article', 'main', 'aside', 'nav', 'header', 'footer'].includes(tag) &&
      element.children.length > 0;
  }

  /**
   * Check if element has significant text content
   */
  private hasSignificantText(element: HTMLElement): boolean {
    const text = element.textContent?.trim() || '';
    return text.length > 3 && !element.querySelector('input, button, select, textarea, a');
  }

  /**
   * Get human-readable label for element
   */
  private getElementLabel(element: HTMLElement): string {
    // Check for associated label
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const label = element.labels?.[0];
      let labelText = label?.textContent?.trim() || '';
      
      // For special input types, enhance the label
      if (element instanceof HTMLInputElement) {
        const type = element.type;
        // Only enhance if the label is generic (single word like "Date", "Time", etc.)
        if (labelText && labelText.split(' ').length <= 2) {
          switch (type) {
            case 'date':
              labelText = `${labelText} (Date Picker)`;
              break;
            case 'time':
              labelText = `${labelText} (Time Picker)`;
              break;
            case 'color':
              labelText = `${labelText} (Color Picker)`;
              break;
            case 'range':
              labelText = `${labelText} (Slider)`;
              break;
            case 'file':
              labelText = `${labelText} (File Upload)`;
              break;
          }
        }
      }
      
      if (labelText) return labelText;
    }
    
    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    
    // Check aria-labelledby
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement?.textContent) return labelElement.textContent.trim();
    }
    
    // Check placeholder
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder;
    
    // Check name attribute
    const name = element.getAttribute('name');
    if (name) return name;
    
    // Check title
    const title = element.getAttribute('title');
    if (title) return title;
    
    // Use text content for buttons/links
    const tag = element.tagName.toLowerCase();
    if (['button', 'a'].includes(tag)) {
      const text = element.textContent?.trim();
      if (text) return text;
    }
    
    // Fall back to tag name
    return tag;
  }

  /**
   * Get relevant HTML attributes
   */
  private getRelevantAttributes(element: HTMLElement): Record<string, string | boolean | number> {
    const attrs: Record<string, string | boolean | number> = {};
    const relevantAttrs = [
      'type', 'name', 'placeholder', 'required', 'disabled', 'readonly', 
      'maxlength', 'pattern', 'min', 'max', 'step', 'role', 'contenteditable',
      'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-checked',
      'aria-selected', 'aria-expanded', 'aria-pressed', 'open', 'value', 'multiple',
      'data-state' // Radix UI uses this for checked/unchecked state
    ];
    
    for (const attr of relevantAttrs) {
      if (element.hasAttribute(attr)) {
        const value = element.getAttribute(attr);
        
        // Boolean attributes
        if (['required', 'disabled', 'readonly', 'contenteditable', 'multiple', 'open'].includes(attr)) {
          attrs[attr] = value === 'true' || value === '' || value === attr;
        } else if (value !== null) {
          // Try to parse as number
          const numValue = parseFloat(value);
          attrs[attr] = isNaN(numValue) ? value : numValue;
        }
      }
    }
    
    return attrs;
  }

  /**
   * Get element value
   */
  private getElementValue(element: HTMLElement): string | number | boolean | string[] | undefined {
    // ContentEditable elements
    if (element.getAttribute('contenteditable') === 'true' || element.getAttribute('contenteditable') === '') {
      return element.textContent?.trim() || '';
    }
    
    // Native form elements
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        return element.checked;
      }
      if (element.type === 'number') {
        return element.valueAsNumber;
      }
      return element.value;
    }
    
    if (element instanceof HTMLTextAreaElement) {
      return element.value;
    }
    
    if (element instanceof HTMLSelectElement) {
      if (element.multiple) {
        return Array.from(element.selectedOptions).map(opt => opt.value);
      }
      return element.value;
    }
    
    // Progress and meter elements
    if (element instanceof HTMLProgressElement) {
      return element.value;
    }
    
    if (element instanceof HTMLMeterElement) {
      return element.value;
    }
    
    // Output element
    if (element.tagName.toLowerCase() === 'output') {
      return element.textContent?.trim() || '';
    }
    
    // ARIA roles with values
    const role = element.getAttribute('role');
    if (role === 'textbox' || role === 'searchbox') {
      return element.textContent?.trim() || '';
    }
    
    if (role === 'checkbox' || role === 'radio' || role === 'switch') {
      // Check aria-checked first
      const ariaChecked = element.getAttribute('aria-checked');
      if (ariaChecked) return ariaChecked === 'true';
      
      // Check data-state for Radix UI components
      const dataState = element.getAttribute('data-state');
      if (dataState) return dataState === 'checked' || dataState === 'on';
      
      return false;
    }
    
    return undefined;
  }

  /**
   * Get element text content
   */
  private getElementText(element: HTMLElement): string | undefined {
    const text = element.textContent?.trim();
    return text && text.length > 0 ? text : undefined;
  }

  /**
   * Check if element is disabled
   */
  private isDisabled(element: HTMLElement): boolean {
    return element.hasAttribute('disabled') || 
           element.getAttribute('aria-disabled') === 'true' ||
           (element as HTMLInputElement).disabled;
  }

  /**
   * Generate hash for element state (for change detection)
   */
  private hashElement(element: HTMLElement): string {
    const parts = [
      element.tagName,
      element.id,
      element.className,
      element.getAttribute('name') || '',
      this.getElementValue(element)?.toString() || '',
      element.textContent?.trim() || '',
    ];
    
    return hash(parts.join('|'));
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache = new WeakMap();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ScannerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

