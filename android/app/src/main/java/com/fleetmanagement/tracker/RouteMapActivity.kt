package com.fleetmanagement.tracker

import android.app.DatePickerDialog
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.*
import java.net.URL
import java.net.HttpURLConnection

class RouteMapActivity : AppCompatActivity() {
    
    private lateinit var webView: WebView
    private lateinit var statsText: TextView
    private lateinit var distanceText: TextView
    private lateinit var durationText: TextView
    private lateinit var speedText: TextView
    
    private val gson = Gson()
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private val displayDateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.US)
    private var currentSelectedDate = ""
    
    // Variables to store current map state for zoom preservation
    private var currentZoomLevel = 15
    private var currentCenterLat = 0.0
    private var currentCenterLon = 0.0
    private var isInitialLoad = true
    
    // Store start point coordinates for quick return
    private var startPointLat = 0.0
    private var startPointLon = 0.0
    
    // Broadcast receiver for automatic map updates
    private val locationUpdateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                "LOCATION_SENT_SUCCESS" -> {
                    // Automatically refresh the map when new location is sent
                    println("🗺️ Auto-refreshing map due to new location data")
                    // Use smooth update instead of full reload to prevent flickering
                    updateRouteDataSmoothly(currentSelectedDate)
                }
                "LOCATION_SENT_FAILED" -> {
                    // Optionally show error message
                    val message = intent.getStringExtra("message") ?: "Location send failed"
                    println("❌ $message")
                }
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_route_map)
        
        // Initialize views
        statsText = findViewById(R.id.statsText)
        distanceText = findViewById(R.id.distanceText)
        durationText = findViewById(R.id.durationText)
        speedText = findViewById(R.id.speedText)
        
        // Initialize WebView
        webView = findViewById(R.id.map)
        webView.settings.javaScriptEnabled = true
        webView.webViewClient = WebViewClient()
        
        // Add JavaScript interface for map state communication
        webView.addJavascriptInterface(object {
            @android.webkit.JavascriptInterface
            fun updateMapState(zoom: Int, lat: Double, lng: Double) {
                currentZoomLevel = zoom
                currentCenterLat = lat
                currentCenterLon = lng
                isInitialLoad = false
            }
        }, "Android")
        
        // Set current date as default
        currentSelectedDate = getTodayDate()
        
        // Load route data for today by default
        loadRouteData(currentSelectedDate, preserveZoom = false)
        
        // Set up refresh button
        findViewById<com.google.android.material.floatingactionbutton.FloatingActionButton>(R.id.refreshButton).setOnClickListener {
            loadRouteData(currentSelectedDate, preserveZoom = false)
        }
        
        // Set up return to start button
        findViewById<com.google.android.material.floatingactionbutton.FloatingActionButton>(R.id.returnToStartButton).setOnClickListener {
            returnToStartPoint()
        }
        
        // Register broadcast receiver for automatic map updates
        registerLocationUpdateReceiver()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // Unregister broadcast receiver
        unregisterLocationUpdateReceiver()
    }
    
    private fun registerLocationUpdateReceiver() {
        val filter = IntentFilter().apply {
            addAction("LOCATION_SENT_SUCCESS")
            addAction("LOCATION_SENT_FAILED")
        }
        LocalBroadcastManager.getInstance(this).registerReceiver(locationUpdateReceiver, filter)
    }
    
    private fun unregisterLocationUpdateReceiver() {
        try {
            LocalBroadcastManager.getInstance(this).unregisterReceiver(locationUpdateReceiver)
        } catch (e: Exception) {
            // Receiver might not be registered
        }
    }
    
    // Return to start point functionality with zoom preservation
    private fun returnToStartPoint() {
        if (startPointLat != 0.0 && startPointLon != 0.0) {
            println("🗺️ Returning to start point: $startPointLat, $startPointLon with current zoom: $currentZoomLevel")
            val returnScript = """
                (function() {
                    if (map && map.setView) {
                        // Preserve current zoom level when returning to start point
                        map.setView([$startPointLat, $startPointLon], $currentZoomLevel);
                        console.log('Returned to start point with preserved zoom level');
                    }
                })();
            """.trimIndent()
            webView.evaluateJavascript(returnScript, null)
        } else {
            println("❌ Start point coordinates not available")
        }
    }
    
    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.route_map_menu, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_select_date -> {
                showDatePicker()
                true
            }
            R.id.action_today -> {
                currentSelectedDate = getTodayDate()
                loadRouteData(currentSelectedDate, preserveZoom = false)
                true
            }
            R.id.action_yesterday -> {
                currentSelectedDate = getYesterdayDate()
                loadRouteData(currentSelectedDate, preserveZoom = false)
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun showDatePicker() {
        val calendar = Calendar.getInstance()
        val year = calendar.get(Calendar.YEAR)
        val month = calendar.get(Calendar.MONTH)
        val day = calendar.get(Calendar.DAY_OF_MONTH)
        
        val datePickerDialog = DatePickerDialog(
            this,
            { _, selectedYear, selectedMonth, selectedDay ->
                val selectedDate = Calendar.getInstance().apply {
                    set(selectedYear, selectedMonth, selectedDay)
                }.time
                currentSelectedDate = dateFormat.format(selectedDate)
                loadRouteData(currentSelectedDate, preserveZoom = false)
            },
            year, month, day
        )
        
        // Set max date to today
        datePickerDialog.datePicker.maxDate = System.currentTimeMillis()
        datePickerDialog.show()
    }
    
    private fun getTodayDate(): String {
        return dateFormat.format(Date())
    }
    
    private fun getYesterdayDate(): String {
        val calendar = Calendar.getInstance()
        calendar.add(Calendar.DAY_OF_YEAR, -1)
        return dateFormat.format(calendar.time)
    }
    
    private fun loadRouteData(date: String, preserveZoom: Boolean = false) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Load routes for selected date
                val routes = loadRoutesForDate(date)
                
                // Update UI on main thread
                withContext(Dispatchers.Main) {
                    displayRoutes(routes, date, preserveZoom)
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
    
    // New method for smooth updates without flickering
    private fun updateRouteDataSmoothly(date: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Load routes for selected date
                val routes = loadRoutesForDate(date)
                
                // Update UI on main thread
                withContext(Dispatchers.Main) {
                    // Update only the route data in the existing map (no HTML reload)
                    updateRouteDataOnly(routes)
                    updateStats(routes)
                }
                
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    statsText.text = "Error updating routes: ${e.message}"
                }
            }
        }
    }
    
    // Update only route data without reloading the entire map
    private fun updateRouteDataOnly(routes: List<DailyRoute>) {
        if (routes.isEmpty()) return
        
        // Execute JavaScript to update route data smoothly
        val updateScript = createRouteUpdateScript(routes)
        webView.evaluateJavascript(updateScript, null)
    }
    
    // Create JavaScript to update routes without reloading
    private fun createRouteUpdateScript(routes: List<DailyRoute>): String {
        if (routes.isEmpty()) return ""
        
        val route = routes.first()
        val points = route.routePoints
        
        if (points.size < 2) return ""
        
        return """
            (function() {
                // Clear existing route
                if (window.currentPolyline) {
                    map.removeLayer(window.currentPolyline);
                }
                if (window.currentMarkers) {
                    window.currentMarkers.forEach(function(marker) {
                        map.removeLayer(marker);
                    });
                }
                
                // Create new route points
                var routePoints = [
                    ${points.map { "[${it.latitude}, ${it.longitude}]" }.joinToString(",\n                    ")}
                ];
                
                // Add new polyline
                window.currentPolyline = L.polyline(routePoints, {
                    color: 'blue',
                    weight: 4,
                    opacity: 0.8
                }).addTo(map);
                
                // Add start and end markers
                window.currentMarkers = [];
                
                var startMarker = L.marker(routePoints[0]).addTo(map)
                    .bindPopup('<b>Start</b><br>${formatTime(points.first().timestamp)}');
                window.currentMarkers.push(startMarker);
                
                var endMarker = L.marker(routePoints[routePoints.length - 1]).addTo(map)
                    .bindPopup('<b>End</b><br>${formatTime(points.last().timestamp)}');
                window.currentMarkers.push(endMarker);
                
                // Keep current zoom and center (no fitBounds)
                console.log('Route updated smoothly without flickering');
            })();
        """.trimIndent()
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
    
    private fun displayRoutes(routes: List<DailyRoute>, date: String, preserveZoom: Boolean = false) {
        if (routes.isEmpty()) {
            statsText.text = "No routes found for ${displayDateFormat.format(dateFormat.parse(date)!!)}"
            webView.loadData("<html><body><h2>No routes found for this date</h2></body></html>", "text/html", "UTF-8")
            return
        }
        
        var totalDistance = 0.0
        var totalDuration = 0.0
        var totalPoints = 0
        
        routes.forEach { route ->
            totalDistance += route.totalDistance
            totalDuration += route.totalDuration
            totalPoints += route.totalPoints
        }
        
        // Store start point coordinates for return to start functionality
        if (routes.isNotEmpty() && routes.first().routePoints.isNotEmpty()) {
            val firstPoint = routes.first().routePoints.first()
            startPointLat = firstPoint.latitude
            startPointLon = firstPoint.longitude
            println("📍 Start point stored: $startPointLat, $startPointLon")
        }
        
        // Create HTML with OpenStreetMap and route visualization
        val html = createMapHTML(routes, preserveZoom)
        webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
        
        // Update statistics
        updateStatsDisplay(totalDistance, totalDuration, totalPoints)
    }
    
    private fun createMapHTML(routes: List<DailyRoute>, preserveZoom: Boolean = false): String {
        if (routes.isEmpty()) return "<html><body><h2>No routes available</h2></body></html>"
        
        val route = routes.first() // Show first route for now
        val points = route.routePoints
        
        if (points.size < 2) return "<html><body><h2>Insufficient route points</h2></body></html>"
        
        // Calculate center point
        val centerLat = points.map { it.latitude }.average()
        val centerLon = points.map { it.longitude }.average()
        
        // Use preserved zoom/center if available and preserving zoom
        val mapLat = if (preserveZoom && !isInitialLoad) currentCenterLat else centerLat
        val mapLon = if (preserveZoom && !isInitialLoad) currentCenterLon else centerLon
        val mapZoom = if (preserveZoom && !isInitialLoad) currentZoomLevel else 15
        
        // Store current map state for future preservation
        if (!isInitialLoad) {
            currentCenterLat = mapLat
            currentCenterLon = mapLon
        }
        
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { margin: 0; padding: 0; }
                #map { height: 100vh; width: 100%; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map = L.map('map', {
                    zoomControl: false
                }).setView([$mapLat, $mapLon], $mapZoom);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                
                var routePoints = [
                    ${points.map { "[${it.latitude}, ${it.longitude}]" }.joinToString(",\n                    ")}
                ];
                
                var polyline = L.polyline(routePoints, {
                    color: 'blue',
                    weight: 4,
                    opacity: 0.8
                }).addTo(map);
                
                // Store reference for smooth updates
                window.currentPolyline = polyline;
                window.currentMarkers = [];
                
                // Add start marker
                var startMarker = L.marker(routePoints[0]).addTo(map)
                    .bindPopup('<b>Start</b><br>${formatTime(points.first().timestamp)}');
                window.currentMarkers.push(startMarker);
                
                // Add end marker
                var endMarker = L.marker(routePoints[routePoints.length - 1]).addTo(map)
                    .bindPopup('<b>End</b><br>${formatTime(points.last().timestamp)}');
                window.currentMarkers.push(endMarker);
                
                // Only fit bounds on initial load or manual refresh (not auto-refresh)
                if (!${preserveZoom}) {
                    map.fitBounds(polyline.getBounds());
                }
                
                // Store current zoom and center for preservation
                map.on('zoomend', function() {
                    window.Android.updateMapState(map.getZoom(), map.getCenter().lat, map.getCenter().lng);
                });
                
                map.on('moveend', function() {
                    window.Android.updateMapState(map.getZoom(), map.getCenter().lat, map.getCenter().lng);
                });
            </script>
        </body>
        </html>
        """.trimIndent()
    }
    
    private fun updateStats(routes: List<DailyRoute>) {
        if (routes.isEmpty()) return
        
        val totalDistance = routes.sumOf { it.totalDistance }
        val totalDuration = routes.sumOf { it.totalDuration }
        val totalPoints = routes.sumOf { it.totalPoints }
        
        updateStatsDisplay(totalDistance, totalDuration, totalPoints)
    }
    
    private fun updateStatsDisplay(distance: Double, duration: Double, points: Int) {
        distanceText.text = "Distance: ${formatDistance(distance)}"
        durationText.text = "Duration: ${formatDuration(duration)}"
        speedText.text = "Points: $points"
    }
    
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
            
            // Create a unique fingerprint combining multiple device identifiers
            val fingerprint = "${manufacturer}_${model}_${androidVersion}_$deviceId"
                .replace(" ", "_")
                .replace("-", "_")
                .uppercase()
            
            // Take first 16 characters to keep it manageable
            fingerprint.take(16)
            
        } catch (e: Exception) {
            e.printStackTrace()
            // Fallback to a combination of available identifiers
            "${android.os.Build.MANUFACTURER}_${android.os.Build.MODEL}".uppercase()
        }
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
