# 📱 Installing Fleet Tracker on Your Android Phone

Since you don't have Android Studio, here are the easiest ways to get the app on your phone:

## 🚀 **Option 1: Use the Build Script (Recommended)**

### **1. Run the build script:**
```bash
./build-android.sh
```

This will:
- Download Android SDK command line tools
- Install required components
- Build the APK file
- Give you installation instructions

### **2. Install on your phone:**
- Enable USB debugging on your Android phone
- Connect via USB cable
- Run: `adb install android/app/build/outputs/apk/debug/app-debug.apk`

## 📲 **Option 2: Manual APK Transfer**

### **1. Build the APK:**
```bash
cd android
./gradlew assembleDebug
```

### **2. Find the APK:**
The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### **3. Transfer to your phone:**
- **USB**: Copy the APK file to your phone's Downloads folder
- **Email**: Send the APK to yourself via email
- **Cloud**: Upload to Google Drive, Dropbox, etc.
- **ADB**: Use `adb push` command

### **4. Install on your phone:**
- Go to Settings → Security → Unknown Sources (enable)
- Open the APK file from your phone
- Tap "Install"

## 🔧 **Option 3: Use ADB (Advanced)**

### **1. Install ADB tools:**
```bash
# On macOS
brew install android-platform-tools

# Or download from Google:
# https://developer.android.com/studio/releases/platform-tools
```

### **2. Enable USB debugging on your phone:**
- Go to Settings → About Phone
- Tap "Build Number" 7 times to enable Developer Options
- Go to Settings → Developer Options → USB Debugging (enable)

### **3. Connect and install:**
```bash
# Check if device is connected
adb devices

# Install the APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## 📱 **Phone Setup Requirements**

### **Android Version:**
- **Minimum**: Android 7.0 (API level 24)
- **Recommended**: Android 10+ for best performance

### **Permissions Needed:**
- Location access (GPS)
- Internet access
- Background app refresh

### **Hardware:**
- GPS sensor
- Internet connection (WiFi or mobile data)

## 🚨 **Troubleshooting**

### **"Install blocked" error:**
- Go to Settings → Security → Unknown Sources
- Enable installation from unknown sources

### **"Parse error" when installing:**
- Make sure the APK file downloaded completely
- Try downloading again

### **App crashes on startup:**
- Check if location permissions are granted
- Ensure internet connection is available

### **Location not updating:**
- Check if GPS is enabled
- Verify location permissions are granted
- Check if battery optimization is disabled for the app

## 🔒 **Security Note**

This is a development build. In production:
- Use HTTPS instead of HTTP
- Implement proper authentication
- Add app signing
- Use release builds

## 📞 **Need Help?**

If you encounter issues:
1. Check the build output for errors
2. Verify your phone meets the requirements
3. Try the manual APK transfer method
4. Check that your server is running and accessible

## 🎯 **Next Steps After Installation**

1. **Start your server**: `./start.sh`
2. **Open the app** on your phone
3. **Grant permissions** when prompted
4. **Tap "Start Tracking"**
5. **Check your server terminal** for location updates!

The app will start sending location data every 10 seconds to your server! 🎉
