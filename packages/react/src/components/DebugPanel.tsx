/**
 * Debug Panel component to display UUICS context
 */

import React, { useState } from 'react';
import { useUUICSContext } from './UUICSProvider';

interface DebugPanelProps {
  format?: 'json' | 'natural' | 'openapi';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Debug Panel component
 */
export function DebugPanel({ 
  format = 'natural',
  className = '',
  style = {},
}: DebugPanelProps) {
  const { context, serialize, isInitialized } = useUUICSContext();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'natural' | 'openapi'>(format);

  if (!isInitialized) {
    return (
      <div className={`uuics-debug-panel loading ${className}`} style={style}>
        <div className="uuics-debug-header">
          <h3>UUICS Debug Panel</h3>
        </div>
        <div className="uuics-debug-content">
          Initializing...
        </div>
      </div>
    );
  }

  const serializedContext = serialize(selectedFormat);

  return (
    <div className={`uuics-debug-panel ${className}`} style={style}>
      <div className="uuics-debug-header">
        <h3>UUICS Debug Panel</h3>
        <button onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="uuics-debug-controls">
            <label>
              Format:
              <select 
                value={selectedFormat} 
                onChange={(e) => setSelectedFormat(e.target.value as any)}
              >
                <option value="natural">Natural Language</option>
                <option value="json">JSON</option>
                <option value="openapi">OpenAPI</option>
              </select>
            </label>
            
            {context && (
              <div className="uuics-debug-stats">
                <span>Elements: {context.elements.length}</span>
                <span>Actions: {context.actions.length}</span>
              </div>
            )}
          </div>

          <div className="uuics-debug-content">
            <pre>{serializedContext}</pre>
          </div>
        </>
      )}
    </div>
  );
}

