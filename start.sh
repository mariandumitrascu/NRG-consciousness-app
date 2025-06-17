#!/bin/bash

# RNG Consciousness App - Clean Start Script
# This script kills any existing processes on development ports, builds the app, and launches it

echo "🔧 RNG Consciousness App - Clean Start"
echo "======================================"

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
echo "🏗️  Building application..."
echo "=========================="

# Build the application
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    echo "🚀 Launching RNG Consciousness App..."
    echo "===================================="

    # Launch the built application
    # For development, we'll use the dev command since that's what launches Electron
    # The build creates the dist files, and dev:main uses those files
    npm run dev:main
else
    echo ""
    echo "❌ Build failed! Please check the errors above."
    echo "💡 Try running 'npm install' if you have missing dependencies."
    exit 1
fi

echo ""
echo "🎉 Application should now be running!"
echo "🔧 If you need to stop the app, press Ctrl+C or close the Electron window."