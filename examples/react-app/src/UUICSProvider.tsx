/**
 * UUICS React Integration
 * Provider and hooks for using UUICS in React components
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { UUICSEngine } from '@angelerator/uuics-core';
import type { PageContext, ActionCommand, ActionResult, UUICSConfig } from '@angelerator/uuics-core';

/**
 * Hook to use UUICS in a React component
 */
function useUICS(config?: UUICSConfig) {
  const [context, setContext] = useState<PageContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const engineRef = useRef<UUICSEngine | null>(null);

  useEffect(() => {
    // Create and initialize engine
    const engine = new UUICSEngine(config);
    engineRef.current = engine;

    engine.initialize().then(() => {
      setIsInitialized(true);
      const currentContext = engine.getContext();
      if (currentContext) {
        setContext(currentContext);
      }
    });

    // Subscribe to context updates
    const unsubscribe = engine.subscribe((newContext) => {
      setContext(newContext);
    });

    // Cleanup
    return () => {
      unsubscribe();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Execute action
  const execute = useCallback(async (command: ActionCommand): Promise<ActionResult> => {
    if (!engineRef.current) {
      return {
        success: false,
        message: 'Engine not initialized',
        error: 'UUICS engine is not available',
      };
    }

    return engineRef.current.execute(command);
  }, []);

  // Execute batch
  const executeBatch = useCallback(async (commands: ActionCommand[]): Promise<ActionResult[]> => {
    if (!engineRef.current) {
      return [];
    }

    return engineRef.current.executeBatch(commands);
  }, []);

  // Serialize context
  const serialize = useCallback((format?: 'json' | 'natural' | 'openapi'): string => {
    if (!engineRef.current) {
      return '';
    }

    return engineRef.current.serialize(format);
  }, []);

  // Manual scan
  const scan = useCallback(async (): Promise<PageContext | null> => {
    if (!engineRef.current) {
      return null;
    }

    return engineRef.current.scan();
  }, []);

  return {
    context,
    isInitialized,
    execute,
    executeBatch,
    serialize,
    scan,
    engine: engineRef.current,
  };
}

/**
 * UUICS Context type
 */
type UUICSContextType = ReturnType<typeof useUICS>;

/**
 * UUICS Context
 */
const UUICSContext = createContext<UUICSContextType | null>(null);

/**
 * Provider props
 */
interface UUICSProviderProps {
  children: ReactNode;
  config?: UUICSConfig;
}

/**
 * UUICS Provider component
 */
export function UUICSProvider({ children, config }: UUICSProviderProps) {
  const uuics = useUICS(config);

  return (
    <UUICSContext.Provider value={uuics}>
      {children}
    </UUICSContext.Provider>
  );
}

/**
 * Hook to use UUICS from context
 */
export function useUUICSContext(): UUICSContextType {
  const context = useContext(UUICSContext);

  if (!context) {
    throw new Error('useUUICSContext must be used within a UUICSProvider');
  }

  return context;
}

