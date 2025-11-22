import { useState } from 'react';
import { useUUICSContext } from '@angelerator/react';
import { ClaudeAdapter } from '@angelerator/models-claude';

interface ChatPopupProps {
  onClose: () => void;
}

export default function ChatPopup({ onClose }: ChatPopupProps) {
  const { engine } = useUUICSContext();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: '👋 Hi! I can help you interact with this page. Try asking me to fill out forms or click buttons!' }
  ]);
  const [input, setInput] = useState('');
  const [chatActive, setChatActive] = useState(false);

  const adapter = new ClaudeAdapter({
    apiKey: 'proxy-handles-key',
    proxyUrl: 'http://localhost:3100'
  });

  const handleStart = () => {
    setChatActive(true);
  };

  const handleSend = async () => {
    if (!input.trim() || !engine) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Add a "thinking" message
    setMessages(prev => [...prev, { role: 'assistant', content: '🤔 Thinking...' }]);

    try {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 WORKFLOW START');
      console.log('='.repeat(60));
      
      // Step 1: Scan page
      console.log('\n📍 STEP 1: Scanning DOM');
      console.log('⏱️  Started at:', new Date().toISOString());
      const scanStart = performance.now();
      
      await engine.scan(null, { includeHidden: true });
      
      const scanEnd = performance.now();
      console.log('✅ Scan complete in', (scanEnd - scanStart).toFixed(2), 'ms');
      
      // Step 2: Get context
      console.log('\n📍 STEP 2: Getting page context');
      const pageContext = engine.getContext();
      console.log('📊 Found:', pageContext?.elements.length, 'elements');
      console.log('📊 Actions:', pageContext?.actions.length, 'available actions');
      
      // Step 3: Serialize context
      console.log('\n📍 STEP 3: Serializing context');
      const serializeStart = performance.now();
      
        const serialized = engine.serialize('natural');
      const contextString = typeof serialized === 'string' ? serialized : serialized.content;
      
      const serializeEnd = performance.now();
      console.log('✅ Serialized in', (serializeEnd - serializeStart).toFixed(2), 'ms');
      console.log('📏 Context size:', contextString.length, 'characters');

      // Remove "thinking" message before adding response
      setMessages(prev => prev.slice(0, -1));

      // Step 4: Send to Claude
      console.log('\n📍 STEP 4: Sending to Claude API');
      console.log('💬 User message:', userMessage);
      console.log('⏱️  API call started at:', new Date().toISOString());
      const apiStart = performance.now();

      const response = await adapter.chat(userMessage, pageContext, contextString);
      
      const apiEnd = performance.now();
      console.log('✅ Response received in', (apiEnd - apiStart).toFixed(2), 'ms');
      console.log('📝 Response length:', response.length, 'characters');

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);

      // Step 5: Parse actions
      console.log('\n📍 STEP 5: Parsing actions from response');
      const actions = adapter.parseResponse(response);
      console.log('🎬 Found', actions.length, 'action(s) to execute');
      
      if (actions.length > 0) {
        actions.forEach((action, index) => {
          console.log(`   ${index + 1}. ${action.action} → ${action.target}`);
        });
        
        // Step 6: Execute actions
        console.log('\n📍 STEP 6: Executing actions');
        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          console.log(`\n   ⚡ Action ${i + 1}/${actions.length}:`, {
            type: action.action,
            target: action.target,
            parameters: action.parameters
          });
          
          try {
            const execStart = performance.now();
            const result = await engine.execute(action);
            const execEnd = performance.now();
            
            if (result.success) {
              console.log(`   ✅ SUCCESS in ${(execEnd - execStart).toFixed(2)}ms:`, result.message);
              if (result.data) {
                console.log('   📊 Data:', result.data);
              }
            } else {
              console.log(`   ❌ FAILED:`, result.error);
            }
          } catch (error) {
            console.error(`   💥 EXCEPTION:`, error);
          }
        }
      } else {
        console.log('ℹ️  No actions to execute (informational response only)');
      }
      
      // Workflow complete
      const totalTime = performance.now() - scanStart;
      console.log('\n' + '='.repeat(60));
      console.log('✅ WORKFLOW COMPLETE');
      console.log('⏱️  Total time:', totalTime.toFixed(2), 'ms');
      console.log('='.repeat(60) + '\n');
      
    } catch (error: any) {
      console.error('\n' + '='.repeat(60));
      console.error('💥 WORKFLOW FAILED');
      console.error('='.repeat(60));
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      console.error('='.repeat(60) + '\n');
      
      // Remove "thinking" message
      setMessages(prev => prev.slice(0, -1));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Error: ' + (error.message || 'Failed to connect. Is the proxy server running?')
      }]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary text-white p-5 rounded-t-xl flex items-center justify-between">
          <h3 className="text-xl font-bold">🤖 Claude AI Chat</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {!chatActive ? (
            <div>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-5">
                <strong className="text-yellow-700 block mb-2">⚙️ Setup Required</strong>
                <p className="text-sm text-yellow-600 mb-3">
                  To use Claude AI, you need to run the proxy server. Copy proxy-server.cjs from examples/react-app, set your API key, and run:
                </p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono">
                  cd examples/react-app<br />
                  export CLAUDE_API_KEY="your-key"<br />
                  node proxy-server.cjs
                </div>
              </div>
              <button onClick={handleStart} className="btn-primary w-full">
                Start Chatting
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white ml-auto rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 mr-auto rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        {chatActive && (
          <div className="p-5 border-t border-gray-200 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
            />
            <button onClick={handleSend} className="btn-primary rounded-full">
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
