# Simple Push Notifications Setup Guide

This guide explains how to set up a simple push notification system where Managers/Admins can send notifications to drivers using Firebase Cloud Messaging (FCM).

## What This Does

- **Managers and Admins** can send push notifications to drivers through the web interface
- **Drivers** receive notifications on their Android app when logged in
- **Simple notification types**: Info, Success, Warning, Error
- **No automated triggers** - just manual sending

## Prerequisites

- Android Studio
- Firebase project
- Google account
- Fleet Management backend server running

## 1. Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `fleet-management-notifications`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Add Android App

1. In Firebase Console, click "Add app" and select Android
2. Enter package name: `com.fleetmanagement.tracker`
3. Enter app nickname: `Fleet Management Tracker`
4. Click "Register app"

### Step 3: Download Configuration File

1. Download `google-services.json`
2. Place it in `android/app/` directory
3. Replace the example file with your actual configuration

### Step 4: Enable Cloud Messaging

1. In Firebase Console, go to "Project Settings" > "Cloud Messaging"
2. Note down the "Server key" (you'll need this for the backend)

## 2. Backend Configuration

### Step 1: Install Dependencies

```bash
cd server
npm install firebase-admin
```

### Step 2: Set Environment Variables

Add to your `.env` file:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

### Step 3: Generate Service Account Key

1. In Firebase Console, go to "Project Settings" > "Service Accounts"
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the values for your environment variables

## 3. Android App Configuration

### Step 1: Dependencies (Already Added)

The following dependencies are already added to `android/app/build.gradle`:

```gradle
implementation platform('com.google.firebase:firebase-bom:32.7.0')
implementation 'com.google.firebase:firebase-messaging-ktx'
implementation 'com.google.firebase:firebase-analytics-ktx'
```

### Step 2: Permissions (Already Added)

The following permissions are already added to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### Step 3: Firebase Service (Already Added)

The `FirebaseMessagingService` is already implemented to handle incoming notifications.

## 4. Testing Push Notifications

### Step 1: Build and Install App

```bash
cd android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Step 2: Test Token Registration

1. Launch the app and log in
2. Check the logs for "Push notifications enabled" message
3. Verify the token is registered in your database

### Step 3: Send Test Notification

You can send a test notification using the Firebase Console:

1. Go to "Cloud Messaging" in Firebase Console
2. Click "Send your first message"
3. Enter title and message
4. Select your app
5. Click "Send"

### Step 4: Test via Backend API

You can also test via the backend API:

```bash
# Send notification to specific user
curl -X POST http://localhost:3001/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test push notification",
    "type": "info",
    "userId": "USER_ID"
  }'
```

## 5. How to Use

### For Managers/Admins (Web Interface)

1. Log in to the web app as a Manager or Admin
2. Go to "Drivers" (or "Employees" for Admins) in the navigation menu
3. Find the driver you want to notify
4. Click the "Notify" button (bell icon) next to their name
5. Choose notification type: Info, Success, Warning, or Error
6. Enter title and message
7. Click "Send Notification"

### For Drivers (Android App & Web App)

1. **Android App**: Notifications will appear automatically when sent
2. **Web App**: Log in and go to "Notifications" to see all notifications
3. **Both**: Tap/click notifications to view details
4. **Web App**: Mark notifications as read individually or all at once

## 6. Backend API Endpoints

### Get User Notifications

```
GET /api/notifications?page=1&limit=20&type=info&unreadOnly=true
```

### Get Unread Count

```
GET /api/notifications/unread-count
```

### Mark as Read

```
PATCH /api/notifications/:id/read
```

### Mark All as Read

```
PATCH /api/notifications/mark-all-read
```

### Create Notification (Admin/Manager)

```
POST /api/notifications
{
  "title": "Notification Title",
  "message": "Notification message",
  "type": "info",
  "userId": "optional-user-id",
  "data": {}
}
```

### Register FCM Token

```
POST /api/auth/fcm-token
{
  "fcmToken": "FCM_TOKEN_HERE"
}
```

## 7. Troubleshooting

### Common Issues

1. **Notifications not received**
   - Check if FCM token is registered
   - Verify Firebase configuration
   - Check device notification permissions

2. **Token registration fails**
   - Verify backend is running
   - Check authentication token
   - Verify API endpoint URL

3. **Backend errors**
   - Check Firebase service account configuration
   - Verify environment variables
   - Check MongoDB connection

### Debug Steps

1. Check Android logs:

```bash
adb logcat | grep -E "(FleetManagement|Firebase|FCM)"
```

2. Check backend logs:

```bash
cd server
npm run dev
```

3. Test FCM token manually:

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "FCM_TOKEN",
    "notification": {
      "title": "Test",
      "body": "Test message"
    }
  }'
```

## 8. Production Considerations

1. **Security**
   - Store Firebase credentials securely
   - Use environment variables for sensitive data
   - Implement proper authentication

2. **Performance**
   - Batch notification sending
   - Implement retry logic
   - Monitor delivery rates

3. **Monitoring**
   - Track notification delivery
   - Monitor error rates
   - Set up alerts for failures

## 9. Next Steps

1. Set up Firebase project and download configuration
2. Configure backend environment variables
3. Test with sample notifications
4. Implement notification preferences
5. Add notification history in the app
6. Set up automated notifications for maintenance, fuel alerts, etc.

For more information, refer to the [Firebase Cloud Messaging documentation](https://firebase.google.com/docs/cloud-messaging).
