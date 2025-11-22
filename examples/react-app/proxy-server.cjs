/**
 * Simple proxy server for Claude API
 * This allows the React app to communicate with Claude API without CORS issues
 * 
 * Usage:
 *   1. Set your API key: export CLAUDE_API_KEY="sk-ant-..."
 *   2. Run: node proxy-server.js
 *   3. The proxy will run on http://localhost:3100
 */

const http = require('http');
const https = require('https');

const PORT = 3100;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

if (!CLAUDE_API_KEY) {
  console.error('❌ Error: CLAUDE_API_KEY environment variable is not set');
  console.error('   Set it with: export CLAUDE_API_KEY="sk-ant-..."');
  process.exit(1);
}

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
      
      // Prepare the request to Claude API
      const claudeRequest = JSON.stringify({
        model: requestData.model || 'claude-sonnet-4-20250514',
        max_tokens: requestData.max_tokens || 2048,
        system: requestData.system,
        messages: requestData.messages
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(claudeRequest)
        }
      };

      console.log(`📤 Forwarding request to Claude API...`);

      // Forward request to Claude API
      const claudeReq = https.request(options, (claudeRes) => {
        let responseBody = '';

        claudeRes.on('data', (chunk) => {
          responseBody += chunk;
        });

        claudeRes.on('end', () => {
          console.log(`📥 Received response from Claude API (status: ${claudeRes.statusCode})`);
          
          res.writeHead(claudeRes.statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(responseBody);
        });
      });

      claudeReq.on('error', (error) => {
        console.error('❌ Error calling Claude API:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Failed to call Claude API',
          details: error.message 
        }));
      });

      claudeReq.write(claudeRequest);
      claudeReq.end();

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
  console.log('🚀 Claude API Proxy Server Started');
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log(`🔑 Using API key: ${CLAUDE_API_KEY.substring(0, 20)}...`);
  console.log('\n💡 To use with the React app:');
  console.log('   1. Make sure this server is running');
  console.log('   2. Open http://localhost:3006 in your browser');
  console.log('   3. Click the 🤖 button to open chat');
  console.log('   4. Enter any text as API key (it will use the server key)');
  console.log('\n⏹️  Press Ctrl+C to stop\n');
});

