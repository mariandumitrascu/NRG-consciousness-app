#!/bin/bash

# RNG Consciousness App - Web Application Start Script
# This script builds and serves the web application in browser

echo "🌐 RNG Consciousness App - Web Application Start"
echo "==============================================="

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
echo "🧹 Cleaning up web server ports..."
kill_port 3000
kill_port 3001
kill_port 3002
kill_port 4173
kill_port 5173

echo ""
echo "🏗️  Building web application..."
echo "==============================="

# Build the renderer (web) part only
npm run build:renderer

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Web build completed successfully!"
    echo ""
    echo "🌐 Starting web server..."
    echo "========================="

    # Serve the built web application using Vite's preview
    echo "🚀 Launching web app at http://localhost:4173"
    echo "💡 Press Ctrl+C to stop the server"
    echo ""

    npx vite preview --port 4173 --host
else
    echo ""
    echo "❌ Build failed! Please check the errors above."
    echo "💡 Try running 'npm install' if you have missing dependencies."
    exit 1
fi