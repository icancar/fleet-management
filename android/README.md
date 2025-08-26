# Fleet Tracker - Android App

A background location tracking service that sends location data to the fleet management server every 10 seconds.

## 🚀 Features

- **Background Location Tracking**: Runs as a foreground service
- **Automatic Updates**: Sends location every 10 seconds
- **Rich Location Data**: GPS coordinates, accuracy, speed, bearing, altitude
- **Device Identification**: Unique device ID for each mobile device
- **Boot Auto-start**: Automatically starts tracking after device reboot

## 📱 Setup

### Prerequisites
- Android Studio Arctic Fox or later
- Android SDK 24+ (Android 7.0+)
- Google Play Services

### Installation
1. Open the project in Android Studio
2. Sync Gradle files
3. Connect an Android device or start an emulator
4. Build and run the app

### Permissions
The app requires these permissions:
- `ACCESS_FINE_LOCATION` - For precise GPS location
- `ACCESS_COARSE_LOCATION` - For approximate location
- `FOREGROUND_SERVICE` - For background operation
- `INTERNET` - To send data to server

## 🔧 Configuration

### Server URL
Update the server URL in `ApiService.kt`:

```kotlin
// For Android emulator (localhost)
.baseUrl("http://10.0.2.2:3001/api/")

// For real device (replace with your server IP)
.baseUrl("http://192.168.1.100:3001/api/")
```

### Location Update Frequency
Modify the update interval in `LocationTrackingService.kt`:

```kotlin
locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000) // 10 seconds
```

## 📊 Location Data Sent

Each location update includes:
- **Latitude/Longitude**: GPS coordinates
- **Accuracy**: Location accuracy in meters
- **Timestamp**: When the location was captured
- **Speed**: Movement speed in m/s
- **Bearing**: Direction of movement in degrees
- **Altitude**: Height above sea level
- **Device ID**: Unique identifier for the device

## 🚗 Usage

1. **Start Tracking**: Tap "Start Tracking" button
2. **Grant Permissions**: Allow location access when prompted
3. **Background Service**: The app will continue tracking even when minimized
4. **Stop Tracking**: Tap "Stop Tracking" to stop location updates

## 🔍 Monitoring

### Server Terminal Output
When location data is received, the server logs:

```
📍 LOCATION UPDATE RECEIVED:
   Device: device_serial_number
   Coordinates: 37.7749, -122.4194
   Accuracy: 5m
   Speed: 2.5 m/s
   Bearing: 45°
   Altitude: 100m
   Timestamp: 12/7/2023, 2:30:45 PM
   ──────────────────────────────────────────
```

### API Endpoints
- `POST /api/location` - Receive location data
- `GET /api/location` - Get all location history
- `GET /api/location/:deviceId` - Get location history for specific device

## 🛠️ Development

### Project Structure
```
android/
├── app/
│   ├── src/main/
│   │   ├── java/com/fleetmanagement/tracker/
│   │   │   ├── MainActivity.kt          # Main UI
│   │   │   ├── LocationTrackingService.kt # Background service
│   │   │   ├── LocationData.kt          # Data model
│   │   │   ├── ApiService.kt            # Network communication
│   │   │   ├── MainViewModel.kt         # UI state management
│   │   │   └── BootReceiver.kt          # Auto-start on boot
│   │   └── res/
│   │       └── layout/
│   │           └── activity_main.xml    # Main UI layout
│   └── build.gradle                     # App dependencies
├── build.gradle                         # Project configuration
└── settings.gradle                      # Project settings
```

### Key Components
- **MainActivity**: Simple UI with start/stop controls
- **LocationTrackingService**: Background service for location tracking
- **ApiService**: Retrofit interface for server communication
- **LocationData**: Data class for location information

## 🔒 Security Notes

- Location data is sent over HTTP (not HTTPS) for development
- In production, implement proper authentication and HTTPS
- Consider implementing data encryption for sensitive location data
- Add rate limiting to prevent abuse

## 🚀 Future Enhancements

- [ ] Real-time location streaming
- [ ] Geofencing capabilities
- [ ] Offline data storage and sync
- [ ] Battery optimization
- [ ] Location data visualization
- [ ] Driver identification
- [ ] Trip tracking integration
