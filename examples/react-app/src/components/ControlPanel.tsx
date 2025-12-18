import { useState } from 'react';
import { useUUICSContext } from '../UUICSProvider';
import Card from './Card';

export default function ControlPanel() {
  const { engine } = useUUICSContext();
  const [scanScope, setScanScope] = useState('all');
  const [outputFormat, setOutputFormat] = useState('natural');
  const [output, setOutput] = useState('');

  const handleScan = async () => {
    if (!engine) return;

    let scanConfig = {};
    switch (scanScope) {
      case 'forms':
        scanConfig = { rootSelectors: 'form, .card' };
        break;
      case 'inputs':
        scanConfig = { includeElements: ['input', 'button', 'select', 'textarea'] };
        break;
    }

    await engine.scan(null, scanConfig);
    const result = engine.serialize(outputFormat as any);
    setOutput(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  };

  const handleClear = () => {
    setOutput('');
  };

  return (
    <Card
      icon="⚙️"
      title="Control Panel"
      tag="Interactive"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="scan-scope" className="label">
            Scan Scope
          </label>
          <select
            id="scan-scope"
            value={scanScope}
            onChange={(e) => setScanScope(e.target.value)}
            className="input"
          >
            <option value="all">Entire Page</option>
            <option value="forms">Forms Only</option>
            <option value="inputs">Inputs & Buttons Only</option>
          </select>
        </div>

        <div>
          <label htmlFor="output-format" className="label">
            Output Format
          </label>
          <select
            id="output-format"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
            className="input"
          >
            <option value="natural">Natural Language (AI-Friendly)</option>
            <option value="json">JSON (Structured)</option>
            <option value="openapi">OpenAPI (Function Definitions)</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button onClick={handleScan} className="btn-primary flex-1">
            🔍 Scan Now
          </button>
          <button onClick={handleClear} className="btn-secondary flex-1">
            🧹 Clear
          </button>
        </div>
      </div>

      <div className="info-box mt-5">
        <strong className="text-primary block mb-2">💡 How It Works</strong>
        UUICS scans your UI and generates context that AI models can understand. Try different formats and scopes!
      </div>

      {output && (
        <div className="mt-5 bg-gray-900 text-gray-100 p-4 rounded-lg max-h-80 overflow-auto text-xs font-mono">
          {output}
        </div>
      )}
    </Card>
  );
}

