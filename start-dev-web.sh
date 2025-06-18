#!/bin/bash

# RNG Consciousness App - Development Web Server
# This script starts the development web server with hot reload

echo "🌐 RNG Consciousness App - Development Web Server"
echo "================================================="

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    echo "🔍 Checking for processes on port $port..."

    # Find process ID using port
    local pid=$(lsof -ti:$port 2>/dev/null)

    if [ ! -z "$pid" ]; then
        echo "⚡ Killing process $pid on port $port"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    else
        echo "✅ Port $port is free"
    fi
}

# Kill processes on common development ports
echo "🧹 Cleaning up development ports..."
kill_port 3000
kill_port 3001
kill_port 3002
kill_port 5173

echo ""
echo "🚀 Starting development web server..."
echo "===================================="
echo "💡 Hot reload enabled - changes will update automatically"
echo "💡 Press Ctrl+C to stop the server"
echo ""

# Start the development server (renderer only)
npm run dev:renderer