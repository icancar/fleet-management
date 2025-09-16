# Firebase Push Notifications Setup Guide

This guide will help you complete the Firebase Cloud Messaging (FCM) setup to enable push notifications to your Android app.

## Prerequisites

- Google account
- Android Studio (already installed)
- Fleet Management backend running
- Android device or emulator for testing

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or **"Add project"**
3. Enter project name: `fleet-management-push` (or any name you prefer)
4. Enable Google Analytics (optional, but recommended)
5. Click **"Create project"**

## Step 2: Add Android App to Firebase

1. In your Firebase project, click the **Android icon** (</>) to add an Android app
2. **Android package name**: `com.fleetmanagement.tracker`
   - This is found in `android/app/build.gradle` under `defaultConfig.applicationId`
3. **App nickname**: `Fleet Management Tracker`
4. **SHA-1 signing certificate** (optional but recommended):
   - Run this command in your terminal:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

   - Copy the SHA1 fingerprint and paste it in Firebase
5. Click **"Register app"**

## Step 3: Download google-services.json

1. After registering your app, download the `google-services.json` file
2. Place it in: `android/app/google-services.json`
   - **Important**: This file contains sensitive information, so add it to `.gitignore`
3. The file should look like this:

```json
{
  "project_info": {
    "project_number": "123456789012",
    "project_id": "your-project-id",
    "storage_bucket": "your-project-id.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:123456789012:android:abcdef123456",
        "android_client_info": {
          "package_name": "com.fleetmanagement.tracker"
        }
      },
      "oauth_client": [...],
      "api_key": [...],
      "services": {
        "appinvite_service": {...}
      }
    }
  ],
  "configuration_version": "1"
}
```

## Step 4: Generate Firebase Service Account Key (Backend)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Download the JSON file and rename it to `serviceAccountKey.json`
5. Place it in your `server/` directory
6. Add to `.gitignore`:

```bash
echo "server/serviceAccountKey.json" >> .gitignore
```

## Step 5: Update Backend Environment

Add this to your `server/.env` file:

```bash
# Firebase Configuration
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
FIREBASE_PROJECT_ID=your-project-id
```

## Step 6: Update NotificationService.ts

The current implementation should work, but let's make sure it uses the service account key:

```typescript
// In server/src/services/NotificationService.ts
import admin from "firebase-admin";
import path from "path";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccountPath = path.join(
    __dirname,
    "../../serviceAccountKey.json"
  );
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}
```

## Step 7: Test the Setup

### Test 1: Build and Install Android App

```bash
cd android
./gradlew assembleDebug
# Install on device/emulator
```

### Test 2: Send Test Notification

```bash
# From server directory
curl -X POST http://localhost:3001/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Test Push Notification",
    "message": "This is a test push notification!",
    "type": "info"
  }'
```

### Test 3: Check Logs

- **Android Logcat**: Look for FCM token registration
- **Server Logs**: Look for "Push notification sent to user" messages

## Step 8: Verify Everything Works

1. **Android App**: Should show "Push notifications enabled" toast on login
2. **Server Logs**: Should show FCM token registration
3. **Push Notifications**: Should appear on Android device when sent from web app
4. **Web App**: Notifications should appear in the Notifications page

## Troubleshooting

### Common Issues:

1. **"No FCM token for user"**
   - Check if Android app is properly registered
   - Verify google-services.json is in correct location
   - Check Android logs for FCM errors

2. **"Firebase Admin SDK not initialized"**
   - Verify serviceAccountKey.json exists
   - Check GOOGLE_APPLICATION_CREDENTIALS path
   - Ensure Firebase project ID is correct

3. **"Permission denied"**
   - Verify service account has proper permissions
   - Check Firebase project settings

4. **Notifications not appearing on Android**
   - Check notification permissions are granted
   - Verify app is in foreground/background
   - Check Android notification settings

## Cost Information

**Firebase Cloud Messaging is 100% FREE:**

- ✅ Unlimited messages to Android, iOS, and web
- ✅ No daily or monthly limits
- ✅ No charges for delivery
- ✅ No charges for targeting or analytics

You only pay for other Firebase services if you use them (which you don't need for push notifications).

## Next Steps

Once setup is complete:

1. Test with different notification types (info, warning, error, success)
2. Test sending to specific users vs all drivers
3. Test on different Android devices
4. Consider adding notification sound customization
5. Add notification click actions (open specific app screens)

## Support

If you encounter issues:

1. Check the Firebase Console for error logs
2. Check Android Logcat for FCM errors
3. Check server logs for Firebase Admin SDK errors
4. Verify all configuration files are in the correct locations
