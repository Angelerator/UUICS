import { useState, useEffect } from 'react';
import { useUUICSContext } from '../UUICSProvider';
import Card from './Card';

export default function OutputSection() {
  const { engine, context } = useUUICSContext();
  const [output, setOutput] = useState<{
    natural?: string;
    structured?: string;
    elements?: number;
  }>({});

  useEffect(() => {
    if (!engine || !context) return;

    try {
      const naturalResult = engine.serialize('natural');
      const jsonResult = engine.serialize('json');
      
      const natural = typeof naturalResult === 'string' ? naturalResult : naturalResult.content;
      const structured = JSON.stringify(typeof jsonResult === 'string' ? JSON.parse(jsonResult) : jsonResult.content, null, 2);
      const elements = context.elements?.length || 0;

      setOutput({ natural, structured, elements });
    } catch (error) {
      console.error('Failed to serialize context:', error);
    }
  }, [engine, context]);

  const hasOutput = output.natural && output.natural.length > 0;

  return (
    <Card icon="📤" title="Context Output">
      {!hasOutput ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-4 opacity-30">📊</div>
          <p className="text-lg font-semibold mb-2">No scan performed yet</p>
          <p className="text-sm">Click "Scan Now" in the Control Panel to generate context</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-primary">{output.elements || 0}</div>
              <div className="text-xs text-gray-600 mt-1">Elements Found</div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-primary">{output.natural?.split('\n').length || 0}</div>
              <div className="text-xs text-gray-600 mt-1">Lines (Natural)</div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-primary">{Math.round((output.structured?.length || 0) / 1024)}KB</div>
              <div className="text-xs text-gray-600 mt-1">Structured Size</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="space-y-4">
            <details open className="group">
              <summary className="cursor-pointer font-semibold text-primary hover:text-secondary transition-colors flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">▶</span>
                Natural Language Format
              </summary>
              <div className="mt-3 bg-gray-50 p-4 rounded-lg max-h-[300px] overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap text-gray-700">{output.natural}</pre>
              </div>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-semibold text-primary hover:text-secondary transition-colors flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">▶</span>
                Structured JSON Format
              </summary>
              <div className="mt-3 bg-gray-900 p-4 rounded-lg max-h-[300px] overflow-y-auto">
                <pre className="text-xs font-mono text-green-400">{output.structured}</pre>
              </div>
            </details>
          </div>
        </div>
      )}
    </Card>
  );
}

