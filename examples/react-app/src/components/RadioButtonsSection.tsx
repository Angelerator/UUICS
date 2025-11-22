import Card from './Card';
import Prompts from './Prompts';

export default function RadioButtonsSection() {
  return (
    <Card icon="🔘" title="Radio Buttons">
      <div className="space-y-6">
        <div>
          <div className="section-title">Experience Level</div>
          <div className="space-y-2">
            {[
              { id: 'exp-beginner', value: 'beginner', label: '🌱 Beginner (0-1 years)' },
              { id: 'exp-intermediate', value: 'intermediate', label: '🌿 Intermediate (2-4 years)', checked: true },
              { id: 'exp-advanced', value: 'advanced', label: '🌳 Advanced (5-9 years)' },
              { id: 'exp-expert', value: 'expert', label: '🏆 Expert (10+ years)' },
            ].map(item => (
              <label key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input type="radio" id={item.id} name="experience" value={item.value} defaultChecked={item.checked} className="w-5 h-5 accent-primary cursor-pointer" />
                <span className="font-medium">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title">Preferred Work Mode</div>
          <div className="space-y-2">
            {[
              { id: 'mode-remote', value: 'remote', label: '🏠 Remote', checked: true },
              { id: 'mode-office', value: 'office', label: '🏢 Office' },
              { id: 'mode-hybrid', value: 'hybrid', label: '🔄 Hybrid' },
            ].map(item => (
              <label key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input type="radio" id={item.id} name="workmode" value={item.value} defaultChecked={item.checked} className="w-5 h-5 accent-primary cursor-pointer" />
                <span className="font-medium">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <Prompts prompts={[
        'Select expert as experience level',
        'Choose hybrid work mode',
        'What experience level is selected?',
        'Switch to beginner experience',
        'Select office work mode'
      ]} />
    </Card>
  );
}

