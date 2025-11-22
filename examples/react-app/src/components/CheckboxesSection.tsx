import Card from './Card';
import Prompts from './Prompts';

export default function CheckboxesSection() {
  return (
    <Card icon="☑️" title="Checkboxes">
      <div className="space-y-6">
        <div>
          <div className="section-title">Interests</div>
          <div className="space-y-2">
            {[
              { id: 'interest-coding', label: '💻 Coding & Development' },
              { id: 'interest-design', label: '🎨 UI/UX Design' },
              { id: 'interest-data', label: '📊 Data Science' },
              { id: 'interest-mobile', label: '📱 Mobile Development' },
            ].map(item => (
              <label key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input type="checkbox" id={item.id} className="w-5 h-5 accent-primary cursor-pointer" />
                <span className="font-medium">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title">Preferences</div>
          <div className="space-y-2">
            {[
              { id: 'pref-newsletter', label: '📧 Subscribe to newsletter', checked: true },
              { id: 'pref-notifications', label: '🔔 Enable notifications' },
              { id: 'pref-marketing', label: '📢 Marketing emails' },
            ].map(item => (
              <label key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input type="checkbox" id={item.id} defaultChecked={item.checked} className="w-5 h-5 accent-primary cursor-pointer" />
                <span className="font-medium">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <Prompts prompts={[
        'Check coding and design interests',
        'Uncheck the newsletter subscription',
        'Enable all notifications',
        'What interests are currently selected?',
        'Check all preferences'
      ]} />
    </Card>
  );
}

