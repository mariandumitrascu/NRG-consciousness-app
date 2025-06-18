#!/bin/bash

# RNG Consciousness App - Production Build & Run Script
# This script builds the app and runs it in production mode

echo "🔧 RNG Consciousness App - Production Build & Run"
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

# Additional cleanup for any electron processes
echo "🧹 Cleaning up any existing Electron processes..."
pkill -f "electron" 2>/dev/null || true
sleep 2

echo ""
echo "🏗️  Building application for production..."
echo "=========================================="

# Build the application
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    echo "🚀 Launching RNG Consciousness App (Production Mode)..."
    echo "======================================================"

    # Launch the built application directly with electron
    npx electron dist/main/main.js
else
    echo ""
    echo "❌ Build failed! Please check the errors above."
    echo "💡 Try running 'npm install' if you have missing dependencies."
    exit 1
fi

echo ""
echo "🎉 Application finished running!"