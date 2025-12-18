#!/bin/bash

# Comprehensive startup script for UUICS React Example with Claude AI

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║      UUICS React Example with Claude AI Proxy            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Load .env file if it exists
if [ -f .env ]; then
    echo "✅ Loading configuration from .env file"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found"
    echo "   Create .env file from .env.example:"
    echo "   cp .env.example .env"
    echo "   Then add your Claude API key"
    echo ""
fi

# Check for API key
if [ -z "$CLAUDE_API_KEY" ]; then
    echo "❌ CLAUDE_API_KEY not set!"
    echo ""
    echo "Please either:"
    echo "  1. Create a .env file with CLAUDE_API_KEY=your-key"
    echo "  2. Export it: export CLAUDE_API_KEY='your-key'"
    echo "  3. Pass it as argument: $0 YOUR_KEY"
    echo ""
    echo "Get your key from: https://console.anthropic.com/settings/keys"
    exit 1
fi

# Override with argument if provided
if [ -n "$1" ]; then
    export CLAUDE_API_KEY="$1"
    echo "✅ Using API key from command line argument"
fi

echo "🔑 API Key configured (${CLAUDE_API_KEY:0:20}...)"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $PROXY_PID 2>/dev/null
    kill $VITE_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start proxy server in background
echo "📡 Starting Claude API proxy on http://localhost:3100"
node proxy-server.cjs &
PROXY_PID=$!

# Wait for proxy to be ready
sleep 2

# Check if proxy started successfully
if ! kill -0 $PROXY_PID 2>/dev/null; then
    echo "❌ Failed to start proxy server"
    exit 1
fi

echo "✅ Proxy server running (PID: $PROXY_PID)"
echo ""
echo "🌐 React app is already running on http://localhost:5183/"
echo "   (Started in a different terminal)"
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                     READY TO USE                          ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  1. Open: http://localhost:5183/                         ║"
echo "║  2. Click the 🤖 button in bottom right                   ║"
echo "║  3. Click 'Start Chatting'                                ║"
echo "║  4. Ask Claude to interact with the page!                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop the proxy server"
echo ""

# Wait for proxy process
wait $PROXY_PID

