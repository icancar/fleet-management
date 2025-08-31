package com.fleetmanagement.tracker

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.gms.maps.model.PolylineOptions
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.*
import java.net.URL
import java.net.HttpURLConnection

class RouteMapActivity : AppCompatActivity(), OnMapReadyCallback {
    
    private lateinit var mMap: GoogleMap
    private lateinit var statsText: TextView
    private lateinit var distanceText: TextView
    private lateinit var durationText: TextView
    private lateinit var speedText: TextView
    
    private val gson = Gson()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_route_map)
        
        // Initialize views
        statsText = findViewById(R.id.statsText)
        distanceText = findViewById(R.id.distanceText)
        durationText = findViewById(R.id.durationText)
        speedText = findViewById(R.id.speedText)
        
        // Initialize map
        val mapFragment = supportFragmentManager
            .findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)
        
        // Load route data
        loadRouteData()
        
        // Set up refresh button
        findViewById<com.google.android.material.floatingactionbutton.FloatingActionButton>(R.id.refreshButton).setOnClickListener {
            loadRouteData()
        }
    }
    
    override fun onMapReady(googleMap: GoogleMap) {
        mMap = googleMap
        
        // Set map settings
        mMap.uiSettings.isZoomControlsEnabled = true
        mMap.uiSettings.isMyLocationButtonEnabled = true
        
        // Set default location (Belgrade)
        val belgrade = LatLng(44.7866, 20.4489)
        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(belgrade, 12f))
    }
    
    private fun loadRouteData() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Get today's date
                val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
                
                // Load routes for today
                val routes = loadRoutesForDate(today)
                
                // Update UI on main thread
                withContext(Dispatchers.Main) {
                    displayRoutes(routes)
                    updateStats(routes)
                }
                
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    statsText.text = "Error loading routes: ${e.message}"
                }
            }
        }
    }
    
    private suspend fun loadRoutesForDate(date: String): List<DailyRoute> {
        return withContext(Dispatchers.IO) {
            try {
                val deviceId = getDeviceIdentifier()
                val urlString = "http://192.168.1.2:3001/api/location/routes/device/$deviceId?date=$date"
                
                val url = URL(urlString)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.connectTimeout = 10000
                connection.readTimeout = 10000
                
                val responseCode = connection.responseCode
                val jsonResponse = if (responseCode == 200) {
                    connection.inputStream.bufferedReader().use { it.readText() }
                } else {
                    "{}"
                }
                
                val apiResponse = gson.fromJson<ApiResponse<List<DailyRoute>>>(jsonResponse, 
                    object : TypeToken<ApiResponse<List<DailyRoute>>>() {}.type)
                
                apiResponse.data ?: emptyList()
                
            } catch (e: Exception) {
                e.printStackTrace()
                emptyList()
            }
        }
    }
    
    private fun displayRoutes(routes: List<DailyRoute>) {
        if (routes.isEmpty()) {
            statsText.text = "No routes found for today"
            return
        }
        
        val bounds = LatLngBounds.Builder()
        var totalDistance = 0.0
        var totalDuration = 0.0
        var totalPoints = 0
        
        routes.forEach { route ->
            totalDistance += route.totalDistance
            totalDuration += route.totalDuration
            totalPoints += route.totalPoints
            
            // Draw route line
            if (route.routePoints.size >= 2) {
                val polylineOptions = PolylineOptions()
                    .color(0xFF2196F3.toInt()) // Blue color
                    .width(8f)
                
                route.routePoints.forEach { point ->
                    val latLng = LatLng(point.latitude, point.longitude)
                    polylineOptions.add(latLng)
                    bounds.include(latLng)
                }
                
                mMap.addPolyline(polylineOptions)
                
                // Add start and end markers
                val startPoint = route.routePoints.first()
                val endPoint = route.routePoints.last()
                
                mMap.addMarker(MarkerOptions()
                    .position(LatLng(startPoint.latitude, startPoint.longitude))
                    .title("Start")
                    .snippet("${formatTime(startPoint.timestamp)}"))
                
                mMap.addMarker(MarkerOptions()
                    .position(LatLng(endPoint.latitude, endPoint.longitude))
                    .title("End")
                    .snippet("${formatTime(endPoint.timestamp)}"))
            }
        }
        
        // Animate camera to show all routes
        try {
            val boundsBuilt = bounds.build()
            mMap.animateCamera(CameraUpdateFactory.newLatLngBounds(boundsBuilt, 100))
        } catch (e: Exception) {
            // If bounds are invalid, just zoom to a default location
            val belgrade = LatLng(44.7866, 20.4489)
            mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(belgrade, 12f))
        }
        
        // Update statistics
        updateStatsDisplay(totalDistance, totalDuration, totalPoints)
    }
    
    private fun updateStats(routes: List<DailyRoute>) {
        if (routes.isEmpty()) return
        
        val totalDistance = routes.sumOf { it.totalDistance }
        val totalDuration = routes.sumOf { it.totalDuration }
        val totalPoints = routes.sumOf { it.totalPoints }
        val averageSpeed = routes.mapNotNull { it.averageSpeed }.average()
        
        updateStatsDisplay(totalDistance, totalDuration, totalPoints)
    }
    
    private fun updateStatsDisplay(distance: Double, duration: Double, points: Int) {
        distanceText.text = "Distance: ${formatDistance(distance)}"
        durationText.text = "Duration: ${formatDuration(duration)}"
        speedText.text = "Points: $points"
    }
    
    private fun getDeviceIdentifier(): String {
        return android.os.Build.SERIAL.takeIf { it != "unknown" } ?: "unknown"
    }
    
    private fun formatDistance(meters: Double): String {
        return if (meters < 1000) {
            "${String.format("%.1f", meters)}m"
        } else {
            "${String.format("%.2f", meters / 1000)}km"
        }
    }
    
    private fun formatDuration(seconds: Double): String {
        val hours = (seconds / 3600).toInt()
        val minutes = ((seconds % 3600) / 60).toInt()
        val secs = (seconds % 60).toInt()
        
        return when {
            hours > 0 -> "${hours}h ${minutes}m"
            minutes > 0 -> "${minutes}m ${secs}s"
            else -> "${secs}s"
        }
    }
    
    private fun formatTime(timestamp: String): String {
        return try {
            val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).parse(timestamp)
            SimpleDateFormat("HH:mm", Locale.US).format(date ?: Date())
        } catch (e: Exception) {
            timestamp
        }
    }
    
    // Data classes for API response
    data class ApiResponse<T>(
        val success: Boolean,
        val data: T?,
        val message: String?
    )
    
    data class DailyRoute(
        val date: String,
        val deviceId: String,
        val totalPoints: Int,
        val totalDistance: Double,
        val totalDuration: Double,
        val averageSpeed: Double,
        val maxSpeed: Double,
        val startLocation: RouteLocation,
        val endLocation: RouteLocation,
        val routePoints: List<RoutePoint>
    )
    
    data class RouteLocation(
        val latitude: Double,
        val longitude: Double,
        val timestamp: String
    )
    
    data class RoutePoint(
        val latitude: Double,
        val longitude: Double,
        val timestamp: String,
        val speed: Double?,
        val accuracy: Double
    )
}
