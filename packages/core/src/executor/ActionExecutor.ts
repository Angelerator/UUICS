/**
 * Action Executor - Execute UI actions with validation and error handling
 */

import type { ActionCommand, ActionResult, PageContext } from '../types';
import { cleanAndValidateSelector } from '../utils/selectorSanitizer';

/**
 * Action Executor class
 */
export class ActionExecutor {
  /**
   * Execute an action command
   */
  async execute(command: ActionCommand, _context?: PageContext): Promise<ActionResult> {
    try {
      // Validate command
      const validation = this.validateCommand(command);
      if (!validation.valid) {
        return {
          success: false,
          message: 'Command validation failed',
          error: validation.error,
        };
      }

      // Validate and sanitize selector first
      const selectorValidation = cleanAndValidateSelector(command.target);
      if (!selectorValidation.success) {
        return {
          success: false,
          message: 'Invalid selector',
          error: selectorValidation.error,
        };
      }

      // Find target element using sanitized selector
      const element = this.findElement(command.target);
      if (!element) {
        return {
          success: false,
          message: 'Target element not found',
          error: `No element matching selector: ${selectorValidation.selector} (original: ${command.target})`,
        };
      }

      // Execute the action
      const result = await this.executeAction(command, element);
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Action execution failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Validate action command
   */
  private validateCommand(command: ActionCommand): { valid: boolean; error?: string } {
    if (!command.action) {
      return { valid: false, error: 'Action type is required' };
    }

    if (!command.target && !command.script) {
      return { valid: false, error: 'Target selector or script is required' };
    }

    return { valid: true };
  }

  /**
   * Find element by selector (with automatic sanitization)
   */
  private findElement(selector: string): HTMLElement | null {
    // Sanitize and validate selector first
    const cleaned = cleanAndValidateSelector(selector);
    
    if (!cleaned.success) {
      console.error('[UUICS Executor]', cleaned.error);
      return null;
    }

    // Log if sanitization made changes
    if (cleaned.warnings && cleaned.warnings.length > 0) {
      console.warn('[UUICS Executor] Auto-sanitized selector:', {
        original: selector,
        cleaned: cleaned.selector,
        changes: cleaned.warnings,
      });
    }

    try {
      return document.querySelector(cleaned.selector!);
    } catch (error) {
      // This should rarely happen now since we pre-validate
      console.error('[UUICS Executor] Unexpected querySelector error:', cleaned.selector, error);
      return null;
    }
  }

  /**
   * Execute action on element
   */
  private async executeAction(
    command: ActionCommand,
    element: HTMLElement
  ): Promise<ActionResult> {
    // Custom script execution
    if (command.script) {
      return this.executeCustomScript(command.script, element);
    }

    // Standard action execution
    switch (command.action) {
      case 'click':
        return this.executeClick(element);
      
      case 'setValue':
        return this.executeSetValue(element, command.parameters?.value);
      
      case 'submit':
        return this.executeSubmit(element);
      
      case 'select':
        return this.executeSelect(element, command.parameters?.value);
      
      case 'check':
        return this.executeCheck(element, true);
      
      case 'uncheck':
        return this.executeCheck(element, false);
      
      case 'focus':
        return this.executeFocus(element);
      
      case 'scroll':
        return this.executeScroll(element);
      
      case 'hover':
        return this.executeHover(element);
      
      default:
        return {
          success: false,
          message: 'Unknown action type',
          error: `Action type '${command.action}' is not supported`,
        };
    }
  }

  /**
   * Execute click action
   */
  private async executeClick(element: HTMLElement): Promise<ActionResult> {
    try {
      // Check if element is disabled
      if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
        if (element.disabled) {
          return {
            success: false,
            message: 'Click failed: element is disabled',
            error: 'Target element is disabled and cannot be clicked',
          };
        }
      }
      
      // Check if element has aria-disabled
      if (element.getAttribute('aria-disabled') === 'true') {
        return {
          success: false,
          message: 'Click failed: element is disabled (aria-disabled)',
          error: 'Target element has aria-disabled="true"',
        };
      }
      
      element.click();
      
      // Wait for React/framework state to settle after click
      // This is crucial for UI that updates state on click
      await this.waitForStateSettle();
      
      return {
        success: true,
        message: 'Click executed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Click failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute setValue action
   */
  private async executeSetValue(element: HTMLElement, value: unknown): Promise<ActionResult> {
    try {
      if (!value && value !== '' && value !== 0) {
        return {
          success: false,
          message: 'Value is required',
          error: 'No value provided for setValue action',
        };
      }

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        // Use native setter to bypass React's control - this is crucial for controlled components
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
          'value'
        )?.set;
        
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(element, String(value));
        } else {
        element.value = String(value);
        }
        
        // Trigger React's synthetic events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Wait for React state to settle
        await this.waitForStateSettle();
        
        return {
          success: true,
          message: 'Value set successfully',
          data: { value },
        };
      }

      return {
        success: false,
        message: 'Element is not a text input',
        error: 'Target element does not support setValue',
      };
    } catch (error) {
      return {
        success: false,
        message: 'setValue failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute submit action
   */
  private async executeSubmit(element: HTMLElement): Promise<ActionResult> {
    try {
      if (element instanceof HTMLFormElement) {
        // Find submit button in the form and click it
        // This ensures React's onSubmit handler runs and can preventDefault
        const submitButton = element.querySelector('button[type="submit"]') as HTMLButtonElement;
        
        if (submitButton) {
          // Click the submit button - React will handle it
          submitButton.click();
          
          // Wait for React state to settle
          await this.waitForStateSettle();
          
          return {
            success: true,
            message: 'Form submitted successfully',
          };
        }
        
        // Fallback: dispatch submit event (allows preventDefault)
        const submitEvent = new Event('submit', {
          bubbles: true,
          cancelable: true,
        });
        
        const dispatched = element.dispatchEvent(submitEvent);
        
        // Only actually submit if not prevented
        if (dispatched) {
          // React/handlers didn't preventDefault, so we submit
          element.submit();
        }
        
        // Wait for React state to settle
        await this.waitForStateSettle();
        
        return {
          success: true,
          message: 'Form submitted successfully',
        };
      }

      return {
        success: false,
        message: 'Element is not a form',
        error: 'Target element is not a form element',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Submit failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute select action
   */
  private async executeSelect(element: HTMLElement, value: unknown): Promise<ActionResult> {
    try {
      if (element instanceof HTMLSelectElement) {
        // Handle multi-select
        if (element.multiple && Array.isArray(value)) {
          // Clear all selections first
          for (let i = 0; i < element.options.length; i++) {
            element.options[i].selected = false;
          }
          
          // Select the specified options
          const selectedValues: string[] = [];
          for (const val of value) {
            const stringVal = String(val);
            for (let i = 0; i < element.options.length; i++) {
              if (element.options[i].value === stringVal) {
                element.options[i].selected = true;
                selectedValues.push(stringVal);
              }
            }
          }
          
          // Dispatch events that React listens to
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Wait for React state to settle
          await this.waitForStateSettle();
          
          return {
            success: true,
            message: `Multiple options selected successfully`,
            data: { values: selectedValues },
          };
        }
        
        // Handle single-select
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLSelectElement.prototype,
          'value'
        )?.set;
        
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(element, String(value));
        } else {
          element.value = String(value);
        }
        
        // Dispatch multiple events that React listens to
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Wait for React state to settle
        await this.waitForStateSettle();
        
        return {
          success: true,
          message: 'Option selected successfully',
          data: { value },
        };
      }

      if (element instanceof HTMLInputElement && element.type === 'radio') {
        element.checked = true;
        
        // Trigger change event
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Wait for React state to settle
        await this.waitForStateSettle();
        
        return {
          success: true,
          message: 'Radio button selected',
        };
      }

      return {
        success: false,
        message: 'Element is not selectable',
        error: 'Target element does not support select action',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Select failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute check/uncheck action
   */
  private async executeCheck(element: HTMLElement, checked: boolean): Promise<ActionResult> {
    try {
      if (element instanceof HTMLInputElement && 
          (element.type === 'checkbox' || element.type === 'radio')) {
        element.checked = checked;
        
        // Trigger change event
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Wait for React state to settle
        await this.waitForStateSettle();
        
        return {
          success: true,
          message: `Checkbox ${checked ? 'checked' : 'unchecked'} successfully`,
          data: { checked },
        };
      }

      return {
        success: false,
        message: 'Element is not a checkbox',
        error: 'Target element is not a checkbox or radio button',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Check/uncheck failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute focus action
   */
  private executeFocus(element: HTMLElement): ActionResult {
    try {
      element.focus();
      
      return {
        success: true,
        message: 'Element focused successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Focus failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute scroll action
   */
  private executeScroll(element: HTMLElement): ActionResult {
    try {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      return {
        success: true,
        message: 'Scrolled to element successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Scroll failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute hover action
   */
  private executeHover(element: HTMLElement): ActionResult {
    try {
      const mouseEnterEvent = new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      
      const mouseOverEvent = new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      
      element.dispatchEvent(mouseEnterEvent);
      element.dispatchEvent(mouseOverEvent);
      
      return {
        success: true,
        message: 'Hover executed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Hover failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute custom script
   */
  private executeCustomScript(script: string, element: HTMLElement): ActionResult {
    try {
      // Create a function from the script
      const func = new Function('element', script);
      const result = func(element);
      
      return {
        success: true,
        message: 'Custom script executed successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Custom script execution failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Batch execute multiple commands
   */
  async executeBatch(commands: ActionCommand[], _context?: PageContext): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    
    for (const command of commands) {
      const result = await this.execute(command, _context);
      results.push(result);
      
      // Stop on first failure
      if (!result.success) {
        break;
      }
      
      // Add small delay between actions for stability
      await this.delay(50);
    }
    
    return results;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for React/framework state changes to settle after an action
   * Uses a combination of techniques to ensure state updates are processed:
   * 1. requestAnimationFrame - waits for next paint
   * 2. MutationObserver - detects DOM changes
   * 3. setTimeout - fallback timeout
   */
  private waitForStateSettle(): Promise<void> {
    return new Promise((resolve) => {
      // First, wait for requestAnimationFrame (browser paint)
      requestAnimationFrame(() => {
        // Then wait for microtasks to flush (Promise.resolve)
        Promise.resolve().then(() => {
          // Use MutationObserver to detect DOM changes
          let settled = false;
          let timeoutId: ReturnType<typeof setTimeout>;
          
          const observer = new MutationObserver(() => {
            // DOM changed, reset the settle timer
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              if (!settled) {
                settled = true;
                observer.disconnect();
                resolve();
              }
            }, 100); // Wait 100ms after last mutation
          });
          
          // Observe the entire document for changes
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
          });
          
          // Fallback: resolve after 300ms even if no mutations detected
          // This handles cases where the click doesn't cause DOM changes
          setTimeout(() => {
            if (!settled) {
              settled = true;
              observer.disconnect();
              resolve();
            }
          }, 300);
        });
      });
    });
  }
}

