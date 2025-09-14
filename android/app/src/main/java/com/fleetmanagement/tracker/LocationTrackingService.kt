package com.fleetmanagement.tracker

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.location.Location
import android.os.Binder
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService
import com.google.android.gms.location.*
import kotlinx.coroutines.*
import java.util.*
import androidx.localbroadcastmanager.content.LocalBroadcastManager

class LocationTrackingService : LifecycleService() {
    
    private val binder = LocationBinder()
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var locationRequest: LocationRequest
    
    private var isTracking = false
    private var locationUpdateJob: Job? = null
    private val apiService = ApiService.create()
    private lateinit var sharedPreferences: SharedPreferences
    
    private val notificationId = 1001
    private val channelId = "location_tracking_channel"
    
    inner class LocationBinder : Binder() {
        fun getService(): LocationTrackingService = this@LocationTrackingService
    }
    
    override fun onCreate() {
        super.onCreate()
        sharedPreferences = getSharedPreferences("fleet_management", Context.MODE_PRIVATE)
        createNotificationChannel()
        setupLocationServices()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        
        startForeground(notificationId, createNotification())
        startLocationTracking()
        
        return START_STICKY
    }
    
    override fun onBind(intent: Intent): IBinder {
        super.onBind(intent)
        return binder
    }
    
    override fun onDestroy() {
        super.onDestroy()
        stopLocationTracking()
    }
    
    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            channelId,
            "Location Tracking",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Shows when location tracking is active"
        }
        
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(channel)
    }
    
    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("Fleet Tracker Active")
            .setContentText("Location tracking is running")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
    
    private fun setupLocationServices() {
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        
        locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000) // 10 seconds
            .setWaitForAccurateLocation(false)
            .setMinUpdateIntervalMillis(5000) // Minimum 5 seconds
            .setMaxUpdateDelayMillis(15000)   // Maximum 15 seconds
            .build()
        
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    onLocationReceived(location)
                }
            }
        }
    }
    
    private fun startLocationTracking() {
        if (isTracking) return
        
        isTracking = true
        
        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
            
            // Also start periodic updates every 10 seconds as backup
            locationUpdateJob = CoroutineScope(Dispatchers.IO).launch {
                while (isTracking) {
                    delay(10000) // 10 seconds
                    requestLocationUpdate()
                }
            }
            
        } catch (e: SecurityException) {
            // Handle permission error
        }
    }
    
    private fun stopLocationTracking() {
        isTracking = false
        
        fusedLocationClient.removeLocationUpdates(locationCallback)
        locationUpdateJob?.cancel()
    }
    
    private fun requestLocationUpdate() {
        try {
            fusedLocationClient.lastLocation.addOnSuccessListener { location ->
                location?.let { onLocationReceived(it) }
            }
        } catch (e: SecurityException) {
            // Handle permission error
        }
    }
    
    private fun onLocationReceived(location: Location) {
        // Send location to server
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = sharedPreferences.getString("user_id", null)
                val locationData = LocationData.create(
                    latitude = location.latitude,
                    longitude = location.longitude,
                    accuracy = location.accuracy,
                    timestamp = Date(),
                    speed = location.speed,
                    bearing = location.bearing,
                    altitude = location.altitude,
                    deviceId = getDeviceIdentifier(),
                    userId = userId
                )
                
                
                val response = apiService.sendLocation(locationData)
                
                if (response.isSuccessful) {
                    // Location sent successfully
                } else {
                    // Failed to send location
                }
                
            } catch (e: Exception) {
                // Handle exception silently
            }
        }
    }
    
    fun isTracking(): Boolean = isTracking

    private fun getDeviceIdentifier(): String {
        return getDeviceFingerprint()
    }
    
    private fun getDeviceFingerprint(): String {
        return try {
            val deviceId = android.provider.Settings.Secure.getString(
                contentResolver, 
                android.provider.Settings.Secure.ANDROID_ID
            )
            
            val manufacturer = android.os.Build.MANUFACTURER
            val model = android.os.Build.MODEL
            val androidVersion = android.os.Build.VERSION.RELEASE
            
            // Try to get IMEI number (may not be available on all devices)
            val imei = getImeiNumber()
            
            // Create a unique fingerprint combining multiple device identifiers
            val fingerprint = if (imei != null) {
                "${manufacturer}_${model}_${androidVersion}_${imei.takeLast(8)}"
            } else {
                "${manufacturer}_${model}_${androidVersion}_${deviceId.take(8)}"
            }
                .replace(" ", "_")
                .replace("-", "_")
                .uppercase()
            
            // Take first 20 characters to accommodate IMEI
            fingerprint.take(20)
            
        } catch (e: Exception) {
            e.printStackTrace()
            // Fallback to a combination of available identifiers
            "${android.os.Build.MANUFACTURER}_${android.os.Build.MODEL}".uppercase()
        }
    }
    
    private fun getImeiNumber(): String? {
        return try {
            val telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as android.telephony.TelephonyManager
            
            // Check if we have the required permission
            if (checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                // For Android 10+ (API 29+), IMEI access is restricted
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                    // Try to get IMEI using reflection (may not work on all devices)
                    try {
                        val method = telephonyManager.javaClass.getMethod("getImei")
                        method.invoke(telephonyManager) as? String
                    } catch (e: Exception) {
                        // Fallback to getDeviceId for older devices
                        if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.Q) {
                            telephonyManager.deviceId
                        } else {
                            null
                        }
                    }
                } else {
                    // For older Android versions, use deviceId
                    telephonyManager.deviceId
                }
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
