#!/bin/bash

echo "🚗 Starting Fleet Management System..."
echo "====================================="

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed. Running installation first..."
    ./install.sh
fi

# Check if shared package is built
if [ ! -d "shared/dist" ]; then
    echo "🔨 Building shared package..."
    npm run build:shared
fi

echo "🚀 Starting development servers..."
echo "   Backend: http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both servers
npm run dev
