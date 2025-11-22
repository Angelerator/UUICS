import { useState } from 'react';
import Card from './Card';
import Prompts from './Prompts';

export default function SpecialElements() {
  const [volume, setVolume] = useState(50);

  return (
    <Card icon="✨" title="Special Elements">
      <div className="space-y-6">
        <div>
          <div className="section-title">Progress & Meter</div>
          <label className="label">Upload Progress</label>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: '65%' }} />
          </div>
          <p className="text-sm text-gray-600 mt-1">65% Complete</p>
        </div>

        <div>
          <div className="section-title">Date & Time</div>
          <div className="space-y-4">
            <div>
              <label htmlFor="date" className="label">Date</label>
              <input type="date" id="date" className="input" />
            </div>
            <div>
              <label htmlFor="time" className="label">Time</label>
              <input type="time" id="time" className="input" />
            </div>
          </div>
        </div>

        <div>
          <div className="section-title">Range Slider</div>
          <label htmlFor="volume" className="label">
            Volume: <output id="volume-value">{volume}</output>
          </label>
          <input
            type="range"
            id="volume"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <div className="section-title">Color Picker</div>
          <label htmlFor="color" className="label">Choose Color</label>
          <input type="color" id="color" defaultValue="#667eea" className="w-full h-12 rounded-lg cursor-pointer" />
        </div>
      </div>

      <Prompts prompts={[
        'Set the date to tomorrow',
        'Change volume to 75',
        "What's the current color value?",
        'Set time to 3:30 PM'
      ]} />
    </Card>
  );
}

