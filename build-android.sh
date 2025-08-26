#!/bin/bash

echo "🤖 Building Android APK..."
echo "=========================="

# Check if we're in the right directory
if [ ! -d "android" ]; then
    echo "❌ Android directory not found. Please run this from the project root."
    exit 1
fi

cd android

# Check if Android SDK is available
if ! command -v sdkmanager &> /dev/null; then
    echo "❌ Android SDK not found. Installing command line tools..."
    
    # Create Android SDK directory
    mkdir -p $HOME/Library/Android/sdk
    
    # Download command line tools
    echo "📥 Downloading Android command line tools..."
    curl -o cmdline-tools.zip "https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip"
    
    # Extract to Android SDK
    unzip -q cmdline-tools.zip -d $HOME/Library/Android/sdk/
    mv $HOME/Library/Android/sdk/cmdline-tools $HOME/Library/Android/sdk/cmdline-tools/latest
    
    # Clean up
    rm cmdline-tools.zip
    
    # Add to PATH
    export ANDROID_HOME=$HOME/Library/Android/sdk
    export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    
    echo "✅ Android SDK installed at $ANDROID_HOME"
fi

# Set environment variables
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Accept licenses
echo "📝 Accepting Android licenses..."
yes | sdkmanager --licenses > /dev/null 2>&1

# Install required SDK components
echo "🔧 Installing required SDK components..."
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" > /dev/null 2>&1

# Build the APK
echo "🏗️ Building APK..."
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK built successfully!"
    echo "📱 APK location: app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "📲 To install on your phone:"
    echo "   1. Enable USB debugging on your Android phone"
    echo "   2. Connect via USB cable"
    echo "   3. Run: adb install app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "🔗 Or transfer the APK file to your phone and install manually"
else
    echo "❌ Build failed. Check the error messages above."
    exit 1
fi
