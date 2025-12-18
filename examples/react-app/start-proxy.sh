#!/bin/bash

# Start Claude API Proxy Server
# This script helps you start the proxy server with your Claude API key

echo "🚀 Starting Claude API Proxy Server"
echo ""

# Check if API key is provided as argument
if [ -n "$1" ]; then
    export CLAUDE_API_KEY="$1"
    echo "✅ Using API key from argument"
elif [ -n "$CLAUDE_API_KEY" ]; then
    echo "✅ Using API key from environment"
else
    echo "❌ No API key provided!"
    echo ""
    echo "Usage:"
    echo "  ./start-proxy.sh YOUR_API_KEY"
    echo ""
    echo "Or set environment variable:"
    echo "  export CLAUDE_API_KEY='your-key-here'"
    echo "  ./start-proxy.sh"
    echo ""
    exit 1
fi

echo "📍 Starting proxy on http://localhost:3100"
echo ""
node proxy-server.cjs

