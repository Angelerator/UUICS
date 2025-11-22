/**
 * Hook to access a specific UI element
 */

import { useMemo } from 'react';
import type { UIElement } from '@uuics/core';
import { useUICS } from './useUICS';

/**
 * Hook to find and track a specific UI element
 */
export function useUIElement(selector: string): UIElement | null {
  const { context } = useUICS();

  const element = useMemo(() => {
    if (!context) {
      return null;
    }

    return context.elements.find(el => el.selector === selector) ?? null;
  }, [context, selector]);

  return element;
}

/**
 * Hook to find elements by type
 */
export function useUIElements(type: string): UIElement[] {
  const { context } = useUICS();

  const elements = useMemo(() => {
    if (!context) {
      return [];
    }

    return context.elements.filter(el => el.type === type);
  }, [context, type]);

  return elements;
}

