import { useState } from 'react';
import Card from './Card';
import Prompts from './Prompts';

export default function ActionButtons() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card icon="🎬" title="Action Buttons">
      <div className="space-y-6">
        <div>
          <div className="section-title">Primary Actions</div>
          <div className="flex flex-col gap-3">
            <button id="save-btn" className="btn-primary">💾 Save Changes</button>
            <button id="submit-btn" className="btn-success">✓ Submit Form</button>
            <button id="delete-btn" className="btn-danger">🗑️ Delete Item</button>
            <button id="cancel-btn" className="btn-secondary">✕ Cancel</button>
          </div>
        </div>

        <div>
          <div className="section-title">Toggle Switches</div>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                id="notifications-toggle"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
              <span className="font-medium">🔔 Enable Notifications</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                id="dark-mode-toggle"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
              <span className="font-medium">🌙 Dark Mode</span>
            </label>
          </div>
        </div>

        <div>
          <div className="section-title">Details/Summary</div>
          <details className="bg-gray-50 p-4 rounded-lg">
            <summary className="cursor-pointer font-semibold text-primary hover:underline">
              📖 Click to expand more info
            </summary>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              This is a collapsible section using the details/summary HTML elements. UUICS can detect and interact with these native HTML5 elements!
            </p>
          </details>
        </div>
      </div>

      <Prompts prompts={[
        'Click the save button',
        'Submit the form',
        'Turn off notifications',
        'Enable dark mode',
        'Click cancel',
        'Expand the details section'
      ]} />
    </Card>
  );
}

