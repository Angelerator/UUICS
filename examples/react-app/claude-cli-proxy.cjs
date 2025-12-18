/**
 * Claude CLI Proxy Server
 * Uses Claude Code CLI authentication (claude login) instead of API keys
 * 
 * Usage:
 *   1. Run: claude login (if not already logged in)
 *   2. Run: node claude-cli-proxy.cjs
 *   3. The proxy will run on http://localhost:3100
 */

const http = require('http');
const { spawn } = require('child_process');

const PORT = 3100;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only allow POST to /api/chat
  if (req.method !== 'POST' || req.url !== '/api/chat') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Collect request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const requestData = JSON.parse(body);
      
      // Build the prompt for Claude CLI
      const systemPrompt = requestData.system || '';
      const userMessage = requestData.messages?.[0]?.content || '';
      
      // Combine system prompt and user message
      const fullPrompt = `${systemPrompt}\n\n---\n\nUser: ${userMessage}`;
      
      console.log('\n📤 Sending request to Claude CLI...');
      console.log('📝 Message preview:', userMessage.substring(0, 100) + '...');

      // Use Claude CLI with --print flag for non-interactive output
      const claude = spawn('claude', [
        '--print',           // Print response and exit
        '--dangerously-skip-permissions',  // Skip permission prompts
      ], {
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      claude.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      claude.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Send the prompt to stdin
      claude.stdin.write(fullPrompt);
      claude.stdin.end();

      claude.on('close', (code) => {
        if (code === 0) {
          console.log('📥 Received response from Claude CLI');
          
          // Format response like Anthropic API
          const response = {
            content: [{
              type: 'text',
              text: stdout.trim()
            }]
          };
          
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify(response));
        } else {
          console.error('❌ Claude CLI error:', stderr);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Claude CLI error',
            details: stderr || 'Unknown error'
          }));
        }
      });

      claude.on('error', (error) => {
        console.error('❌ Failed to spawn Claude CLI:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Failed to run Claude CLI',
          details: error.message 
        }));
      });

    } catch (error) {
      console.error('❌ Error processing request:', error.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Invalid request',
        details: error.message 
      }));
    }
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     🚀 Claude CLI Proxy Server Started                    ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║                                                           ║');
  console.log(`║  📍 Running on: http://localhost:${PORT}                    ║`);
  console.log('║  🔐 Using: Claude Code subscription (claude login)        ║');
  console.log('║                                                           ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║  📱 Open the React app and click 🤖 to chat!              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('⏹️  Press Ctrl+C to stop\n');
});

