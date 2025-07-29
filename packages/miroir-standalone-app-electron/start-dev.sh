#!/bin/bash

# Miroir Standalone App Electron - Development Startup Script

echo "Starting Miroir Standalone App Electron in Development Mode..."
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: This script must be run from the miroir-standalone-app-electron package directory"
    exit 1
fi

# Check if miroir-standalone-app dev server is running
echo "Checking if miroir-standalone-app dev server is running..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✓ Dev server is running on http://localhost:5173"
else
    echo "✗ Dev server is not running!"
    echo "Please start the miroir-standalone-app dev server first:"
    echo "  cd ../miroir-standalone-app"
    echo "  npm run dev"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Build and run Electron
echo "Building Electron application..."
npm run build-electron

if [ $? -eq 0 ]; then
    echo "✓ Build successful, starting Electron..."
    npm run electron-dev
else
    echo "✗ Build failed"
    exit 1
fi
