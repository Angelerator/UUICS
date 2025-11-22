/**
 * UUICS React - React integration for Universal UI Context System
 */

// Hooks
export { useUICS, useUIElement, useUIElements } from './hooks';

// Components
export { UUICSProvider, useUUICSContext, DebugPanel } from './components';

// Re-export core types
export type {
  UIElement,
  ElementType,
  PageContext,
  FormState,
  Action,
  ActionType,
  ActionCommand,
  ActionResult,
  ActionParameters,
  SerializationFormat,
  SerializedContext,
  UUICSConfig,
} from '@uuics/core';

