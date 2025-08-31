package com.fleetmanagement.tracker

import android.app.*
import android.content.Intent
import android.location.Location
import android.os.Binder
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService
import com.google.android.gms.location.*
import kotlinx.coroutines.*
import java.util.*

class LocationTrackingService : LifecycleService() {
    
    private val binder = LocationBinder()
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var locationRequest: LocationRequest
    
    private var isTracking = false
    private var locationUpdateJob: Job? = null
    private val apiService = ApiService.create()
    
    private val notificationId = 1001
    private val channelId = "location_tracking_channel"
    
    inner class LocationBinder : Binder() {
        fun getService(): LocationTrackingService = this@LocationTrackingService
    }
    
    override fun onCreate() {
        super.onCreate()
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
                               val locationData = LocationData.create(
                   latitude = location.latitude,
                   longitude = location.longitude,
                   accuracy = location.accuracy,
                   timestamp = Date(),
                   speed = location.speed,
                   bearing = location.bearing,
                   altitude = location.altitude
               )
                
                // Log the data being sent
                val debugMessage = "Sending: ${location.latitude}, ${location.longitude} to http://192.168.1.2:3001/api/location"
                println(debugMessage)
                
                val response = apiService.sendLocation(locationData)
                
                if (response.isSuccessful) {
                    println("✅ Location sent successfully: ${location.latitude}, ${location.longitude}")
                    // Send broadcast to update UI
                    sendBroadcast(Intent("LOCATION_SENT_SUCCESS").apply {
                        putExtra("message", "Location sent: ${location.latitude}, ${location.longitude}")
                    })
                } else {
                    println("❌ Failed to send location: HTTP ${response.code()}")
                    sendBroadcast(Intent("LOCATION_SENT_FAILED").apply {
                        putExtra("message", "Failed to send: HTTP ${response.code()}")
                    })
                }
                
            } catch (e: Exception) {
                println("❌ Exception sending location: ${e.message}")
                sendBroadcast(Intent("LOCATION_SENT_FAILED").apply {
                    putExtra("message", "Exception: ${e.message}")
                })
            }
        }
    }
    
    fun isTracking(): Boolean = isTracking
}
