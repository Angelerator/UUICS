import { useState, useEffect } from 'react';
import { UUICSProvider, useUUICSContext } from '@angelerator/uuics-react';
import ControlPanel from './components/ControlPanel';
import TextInputs from './components/TextInputs';
import SelectionControls from './components/SelectionControls';
import CheckboxesSection from './components/CheckboxesSection';
import RadioButtonsSection from './components/RadioButtonsSection';
import TextAreaSection from './components/TextAreaSection';
import AdvancedFiltering from './components/AdvancedFiltering';
import SpecialElements from './components/SpecialElements';
import ActionButtons from './components/ActionButtons';
import StateTracking from './components/StateTracking';
import OutputSection from './components/OutputSection';
import ChatPopup from './ChatPopup';

function AppContent() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen p-5 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center text-white mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-3 tracking-tight drop-shadow-lg">
            🚀 UUICS Demo
          </h1>
          <p className="text-lg md:text-xl opacity-95 font-light">
            Universal UI Context System - Complete Showcase
          </p>
          <div className="inline-block mt-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium">
            AI-Powered UI Interaction Framework
          </div>
        </div>

        {/* Control Panel */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <ControlPanel />
        </div>

        {/* Form Elements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <TextInputs />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <SelectionControls />
          </div>
        </div>

        {/* Checkboxes and Radio Buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <CheckboxesSection />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <RadioButtonsSection />
          </div>
        </div>

        {/* Text Area */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <TextAreaSection />
        </div>

        {/* Advanced Filtering */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <AdvancedFiltering />
        </div>

        {/* Special Elements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <SpecialElements />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
            <ActionButtons />
          </div>
        </div>

        {/* State Tracking */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <StateTracking />
        </div>

        {/* Output Section */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '1.1s' }}>
          <OutputSection />
        </div>
      </div>

      {/* Chat FAB */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-primary to-secondary text-white rounded-full text-3xl shadow-xl hover:scale-110 hover:rotate-12 transition-all duration-300 z-50"
      >
        🤖
      </button>

      {/* Chat Popup */}
      {isChatOpen && <ChatPopup onClose={() => setIsChatOpen(false)} />}
    </div>
  );
}

function App() {
  return (
    <UUICSProvider
      config={{
        scan: {
          depth: 15,  // Increased from 10 to 15 to reach deeply nested elements
          includeHidden: true,  // Include all elements, even if considered "hidden"
          includeDisabled: false,
          useIdleCallback: false,  // Disable idle callback to prevent performance issues
          excludeSelectors: [
            '.chat-popup',          // Exclude chat popup
          ],
        },
        track: {
          mutations: false,  // Disable automatic mutation tracking to prevent excessive rescans
          changes: false,    // Disable change tracking - use manual scanning instead
          clicks: false,     // Disable click tracking
          submits: false,    // Disable submit tracking
          debounceDelay: 500,  // Increased debounce delay
        },
        state: {
          enabled: true,  // Enable state tracking (serialization is now fixed)
        },
        performance: {
          maxElements: 1000,  // Increased to capture all page elements
        },
      }}
    >
      <AppContent />
    </UUICSProvider>
  );
}

export default App;
