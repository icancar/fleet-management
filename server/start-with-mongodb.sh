#!/bin/bash

echo "🚀 Starting Fleet Management Server with MongoDB..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "📊 Starting MongoDB..."
    
    # Try different ways to start MongoDB based on the system
    if command -v brew &> /dev/null; then
        # macOS with Homebrew
        brew services start mongodb-community
    elif command -v systemctl &> /dev/null; then
        # Linux with systemd
        sudo systemctl start mongod
    else
        echo "❌ Please start MongoDB manually and try again"
        echo "   macOS: brew services start mongodb-community"
        echo "   Linux: sudo systemctl start mongod"
        echo "   Windows: net start MongoDB"
        exit 1
    fi
    
    # Wait a moment for MongoDB to start
    sleep 3
else
    echo "✅ MongoDB is already running"
fi

# Check if MongoDB is accessible
if mongosh --eval "db.runCommand('ping')" --quiet; then
    echo "✅ MongoDB connection successful"
else
    echo "❌ MongoDB connection failed. Please check if MongoDB is running."
    exit 1
fi

# Start the server
echo "🚗 Starting Fleet Management Server..."
npm run dev
