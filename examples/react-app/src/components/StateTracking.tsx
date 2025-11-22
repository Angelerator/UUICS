import { useState, useEffect } from 'react';
import { useUUICSContext } from '@uuics/react';
import Card from './Card';
import Prompts from './Prompts';

export default function StateTracking() {
  const { engine } = useUUICSContext();
  const [name, setName] = useState('John Doe');
  const [role, setRole] = useState('user');
  const [clicks, setClicks] = useState(0);
  const [timer, setTimer] = useState(0);
  const [stateDisplay, setStateDisplay] = useState('');

  useEffect(() => {
    if (engine) {
      const appState = engine.trackState('app', {
        user: {
          name: 'John Doe',
          role: 'user',
          isActive: true
        },
        counters: {
          clicks: 0,
          timer: 0
        }
      });

      const interval = setInterval(() => {
        setTimer(prev => {
          const newTimer = prev + 1;
          appState.counters.timer = newTimer;
          return newTimer;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [engine]);

  const updateState = () => {
    if (engine) {
      const state = engine.getState('app');
      if (state) {
        state.user.name = name;
        state.user.role = role;
        alert('State updated!');
      }
    }
  };

  const incrementClicks = () => {
    setClicks(prev => {
      const newClicks = prev + 1;
      if (engine) {
        const state = engine.getState('app');
        if (state) {
          state.counters.clicks = newClicks;
        }
      }
      return newClicks;
    });
  };

  const refreshState = () => {
    if (engine) {
      const state = engine.getState('app');
      setStateDisplay(JSON.stringify(state, null, 2));
    }
  };

  return (
    <Card icon="🔄" title="State Tracking Demo" tag="Advanced">
      <div className="info-box bg-green-50 border-green-500">
        <strong className="text-green-600 block mb-2">🎯 What is State Tracking?</strong>
        UUICS can track JavaScript variables and application state, making them available to AI models. This allows AI to understand not just the UI, but also the application's current state!
      </div>

      <div className="space-y-6">
        <div>
          <div className="section-title">Tracked User State</div>
          <div className="space-y-4">
            <div>
              <label htmlFor="tracked-name" className="label">Name</label>
              <input
                type="text"
                id="tracked-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="tracked-role" className="label">Role</label>
              <select
                id="tracked-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input"
              >
                <option value="guest">Guest</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button onClick={updateState} className="btn-primary w-full">
              Update State
            </button>
          </div>
        </div>

        <div>
          <div className="section-title">Live Counters</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-4xl font-bold text-primary mb-2">{clicks}</div>
              <div className="text-sm text-gray-600 mb-3">Clicks</div>
              <button onClick={incrementClicks} className="btn-primary w-full text-sm">
                +1
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-4xl font-bold text-secondary mb-2">{timer}</div>
              <div className="text-sm text-gray-600 mb-3">Seconds</div>
              <small className="text-xs text-gray-500">Auto-incrementing</small>
            </div>
          </div>
        </div>

        <div>
          <div className="section-title">Current Application State</div>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-48 overflow-auto text-xs font-mono">
            {stateDisplay || JSON.stringify({ user: { name, role, isActive: true }, counters: { clicks, timer } }, null, 2)}
          </div>
          <button onClick={refreshState} className="btn-outline w-full mt-3">
            🔄 Refresh State
          </button>
        </div>
      </div>

      <Prompts prompts={[
        'Change the tracked name to "Sarah"',
        'Select admin as the role',
        "What's the current click count?",
        'Click the increment button 5 times',
        'Show me the application state',
        'Update the state with the current values'
      ]} />
    </Card>
  );
}

