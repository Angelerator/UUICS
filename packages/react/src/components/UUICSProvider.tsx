/**
 * UUICS Context Provider for React
 */

import { createContext, useContext, ReactNode } from 'react';
import type { UUICSConfig } from '@uuics/core';
import { useUICS } from '../hooks/useUICS';

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

