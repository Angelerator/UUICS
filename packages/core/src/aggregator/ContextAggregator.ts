/**
 * Context Aggregator - Aggregates UI elements into structured context with actions
 */

import type { UIElement, PageContext, Action, ActionType, FormState } from '../types';
import { generateId } from '../utils';

/**
 * Context Aggregator class
 */
export class ContextAggregator {
  /**
   * Aggregate UI elements into a complete page context
   */
  aggregate(
    elements: UIElement[],
    metadata: {
      scanDuration: number;
      scanDepth: number;
      partial: boolean;
    }
  ): PageContext {
    const context: PageContext = {
      id: generateId('context'),
      timestamp: Date.now(),
      url: window.location.href,
      title: document.title,
      elements,
      actions: this.generateActions(elements),
      forms: this.extractForms(elements),
      metadata: {
        elementCount: elements.length,
        scanDepth: metadata.scanDepth,
        scanDuration: metadata.scanDuration,
        partial: metadata.partial,
      },
    };

    return context;
  }

  /**
   * Generate available actions from elements
   */
  private generateActions(elements: UIElement[]): Action[] {
    const actions: Action[] = [];

    for (const element of elements) {
      // Skip disabled or invisible elements
      if (!element.enabled || !element.visible) {
        continue;
      }

      // Generate appropriate actions based on element type
      const elementActions = this.getActionsForElement(element);
      actions.push(...elementActions);
    }

    return actions;
  }

  /**
   * Get actions for a specific element
   */
  private getActionsForElement(element: UIElement): Action[] {
    const actions: Action[] = [];

    switch (element.type) {
      case 'button':
      case 'link':
        actions.push(this.createAction('click', element, 'Click'));
        break;

      case 'input':
      case 'textarea':
        actions.push(this.createAction('setValue', element, 'Set value', {
          value: {
            type: 'string',
            description: 'The value to set',
            required: true,
          },
        }));
        actions.push(this.createAction('focus', element, 'Focus'));
        break;

      case 'checkbox':
        actions.push(this.createAction('check', element, 'Check'));
        actions.push(this.createAction('uncheck', element, 'Uncheck'));
        break;

      case 'radio':
        actions.push(this.createAction('select', element, 'Select'));
        break;

      case 'select':
        actions.push(this.createAction('select', element, 'Select option', {
          value: {
            type: 'string',
            description: 'Option value to select',
            required: true,
          },
        }));
        break;

      case 'form':
        actions.push(this.createAction('submit', element, 'Submit form'));
        break;
    }

    return actions;
  }

  /**
   * Create an action object
   */
  private createAction(
    type: ActionType,
    element: UIElement,
    actionLabel: string,
    parameters?: Action['parameters']
  ): Action {
    const description = `${actionLabel} ${element.label || element.selector}`;

    return {
      id: generateId('action'),
      type,
      description,
      target: element.selector,
      parameters,
      available: element.enabled && element.visible,
    };
  }

  /**
   * Extract form states from elements
   */
  private extractForms(elements: UIElement[]): FormState[] {
    const forms: FormState[] = [];
    const formElements = elements.filter(el => el.type === 'form');

    for (const formElement of formElements) {
      // Find all form controls within this form
      const formControls = elements.filter(el => {
        // Check if element selector starts with form selector
        return el.selector.startsWith(formElement.selector) && 
               ['input', 'textarea', 'select', 'checkbox', 'radio'].includes(el.type);
      });

      // Build form state
      const fields: Record<string, unknown> = {};
      const errors: Record<string, string> = {};
      let valid = true;

      for (const control of formControls) {
        const fieldName = control.attributes.name as string || control.id;
        fields[fieldName] = control.value;

        // Check required fields
        if (control.attributes.required && !control.value) {
          errors[fieldName] = 'This field is required';
          valid = false;
        }

        // Check pattern validation
        if (control.type === 'input' && control.attributes.pattern && control.value) {
          try {
            const pattern = new RegExp(control.attributes.pattern as string);
            if (!pattern.test(String(control.value))) {
              errors[fieldName] = 'Invalid format';
              valid = false;
            }
          } catch (e) {
            // Invalid regex pattern, skip validation
          }
        }
      }

      forms.push({
        id: formElement.id,
        selector: formElement.selector,
        fields,
        valid,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
      });
    }

    return forms;
  }

  /**
   * Generate action registry (for documentation/introspection)
   */
  generateActionRegistry(context: PageContext): Record<string, Action[]> {
    const registry: Record<string, Action[]> = {};

    for (const action of context.actions) {
      if (!registry[action.type]) {
        registry[action.type] = [];
      }
      registry[action.type].push(action);
    }

    return registry;
  }

  /**
   * Find actions by type
   */
  findActionsByType(context: PageContext, type: ActionType): Action[] {
    return context.actions.filter(action => action.type === type);
  }

  /**
   * Find action by target
   */
  findActionByTarget(context: PageContext, target: string): Action | undefined {
    return context.actions.find(action => action.target === target);
  }

  /**
   * Get suggested actions (most common/important actions)
   */
  getSuggestedActions(context: PageContext, limit = 5): Action[] {
    // Priority order for action types
    const priority: ActionType[] = ['submit', 'click', 'setValue', 'select', 'check'];
    
    const suggested: Action[] = [];
    
    for (const type of priority) {
      const actionsOfType = this.findActionsByType(context, type);
      suggested.push(...actionsOfType);
      
      if (suggested.length >= limit) {
        break;
      }
    }
    
    return suggested.slice(0, limit);
  }
}

