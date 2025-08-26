#!/bin/bash

echo "🚗 Fleet Management System - Installation Script"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

echo ""
echo "📦 Installing dependencies..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Build shared package first
echo "Building shared package..."
npm run build:shared

# Install and build server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

# Install and build client dependencies
echo "Installing client dependencies..."
cd client
npm install
cd ..

echo ""
echo "🔧 Setting up environment..."

# Copy environment file
if [ ! -f "server/.env" ]; then
    echo "Creating server environment file..."
    cp server/env.example server/.env
    echo "⚠️  Please edit server/.env with your configuration"
else
    echo "✅ Server environment file already exists"
fi

echo ""
echo "🚀 Installation complete!"
echo ""
echo "To start the development servers:"
echo "  npm run dev"
echo ""
echo "This will start:"
echo "  - Backend server on http://localhost:3001"
echo "  - Frontend app on http://localhost:3000"
echo ""
echo "Other useful commands:"
echo "  npm run build          - Build all packages for production"
echo "  npm run test           - Run tests"
echo "  npm run lint           - Run linting"
echo "  npm run format         - Format code with Prettier"
echo ""
echo "📚 For more information, see README.md"
echo ""
echo "Happy coding! 🎉"
