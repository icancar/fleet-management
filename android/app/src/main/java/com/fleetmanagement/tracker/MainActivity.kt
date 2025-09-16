package com.fleetmanagement.tracker

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModelProvider
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    
    private lateinit var viewModel: MainViewModel
    private lateinit var statusText: TextView
    private lateinit var serverUrlText: TextView
    private lateinit var startButton: Button
    private lateinit var stopButton: Button
    private lateinit var viewRoutesButton: Button
    private lateinit var logoutButton: Button
    private lateinit var userInfoText: TextView
    private lateinit var sharedPreferences: SharedPreferences
    
    companion object {
        private const val LOCATION_PERMISSION_REQUEST_CODE = 1001
        private const val NOTIFICATION_PERMISSION_REQUEST_CODE = 1002
        private val PERMISSIONS = arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.ACCESS_BACKGROUND_LOCATION,
            Manifest.permission.FOREGROUND_SERVICE,
            Manifest.permission.WAKE_LOCK,
            Manifest.permission.ACCESS_WIFI_STATE,
            Manifest.permission.READ_PHONE_STATE
        )
        private val NOTIFICATION_PERMISSIONS = arrayOf(
            Manifest.permission.POST_NOTIFICATIONS
        )
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Check authentication first
        sharedPreferences = getSharedPreferences("fleet_management", Context.MODE_PRIVATE)
        val token = sharedPreferences.getString("auth_token", null)
        
        if (token == null) {
            // User not logged in, redirect to login
            navigateToLogin()
            return
        }
        
        setContentView(R.layout.activity_main)
        
        viewModel = ViewModelProvider(this)[MainViewModel::class.java]
        
        initViews()
        setupObservers()
        checkPermissions()
        checkNotificationPermissions()
        displayUserInfo()
        initializeFirebase()
    }
    
    private fun initViews() {
        statusText = findViewById(R.id.statusText)
        serverUrlText = findViewById(R.id.serverUrlText)
        startButton = findViewById(R.id.startButton)
        stopButton = findViewById(R.id.stopButton)
        viewRoutesButton = findViewById(R.id.viewRoutesButton)
        logoutButton = findViewById(R.id.logoutButton)
        userInfoText = findViewById(R.id.userInfoText)
        
        startButton.setOnClickListener {
            if (checkPermissions()) {
                startLocationTracking()
            }
        }
        
        stopButton.setOnClickListener {
            stopLocationTracking()
        }
        
        viewRoutesButton.setOnClickListener {
            val intent = Intent(this, RouteMapActivity::class.java)
            startActivity(intent)
        }
        
        logoutButton.setOnClickListener {
            performLogout()
        }
    }
    
    private fun setupObservers() {
        viewModel.isTracking.observe(this) { isTracking ->
            updateUI(isTracking)
        }
        
        viewModel.lastLocation.observe(this) { location ->
            statusText.text = "Last Location: ${location.latitude}, ${location.longitude}"
        }
        
    }
    
    private fun checkPermissions(): Boolean {
        val permissionsToRequest = mutableListOf<String>()
        
        for (permission in PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission)
            }
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsToRequest.toTypedArray(), LOCATION_PERMISSION_REQUEST_CODE)
            return false
        }
        
        return true
    }
    
    private fun checkNotificationPermissions(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val permissionsToRequest = mutableListOf<String>()
            
            for (permission in NOTIFICATION_PERMISSIONS) {
                if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                    permissionsToRequest.add(permission)
                }
            }
            
            if (permissionsToRequest.isNotEmpty()) {
                ActivityCompat.requestPermissions(this, permissionsToRequest.toTypedArray(), NOTIFICATION_PERMISSION_REQUEST_CODE)
                return false
            }
        }
        
        return true
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        when (requestCode) {
            LOCATION_PERMISSION_REQUEST_CODE -> {
                if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                    Toast.makeText(this, "Location permissions granted", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this, "Location permissions required for tracking", Toast.LENGTH_LONG).show()
                }
            }
            NOTIFICATION_PERMISSION_REQUEST_CODE -> {
                if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                    Toast.makeText(this, "Notification permissions granted", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this, "Notification permissions required for push notifications", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
    
    private fun startLocationTracking() {
        val intent = Intent(this, LocationTrackingService::class.java)
        startForegroundService(intent)
        viewModel.setTracking(true)
        Toast.makeText(this, "Location tracking started", Toast.LENGTH_SHORT).show()
    }
    
    private fun stopLocationTracking() {
        val intent = Intent(this, LocationTrackingService::class.java)
        stopService(intent)
        viewModel.setTracking(false)
        Toast.makeText(this, "Location tracking stopped", Toast.LENGTH_SHORT).show()
    }
    
    private fun updateUI(isTracking: Boolean) {
        startButton.isEnabled = !isTracking
        stopButton.isEnabled = isTracking
        
        if (isTracking) {
            statusText.text = "Location tracking is active"
        } else {
            statusText.text = "Location tracking stopped"
        }
    }

    
    private fun displayUserInfo() {
        val userName = sharedPreferences.getString("user_name", "Unknown")
        val userRole = sharedPreferences.getString("user_role", "Unknown")
        userInfoText.text = "Logged in as: $userName ($userRole)"
    }
    
    private fun performLogout() {
        // Clear stored authentication data
        sharedPreferences.edit()
            .remove("auth_token")
            .remove("user_id")
            .remove("user_email")
            .remove("user_name")
            .remove("user_role")
            .apply()
        
        // Stop location tracking if running
        stopLocationTracking()
        
        // Navigate to login
        navigateToLogin()
    }
    
    private fun navigateToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
    
    private fun initializeFirebase() {
        // Get FCM token and register it with the server
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                Toast.makeText(this, "Failed to get FCM token", Toast.LENGTH_SHORT).show()
                return@addOnCompleteListener
            }
            
            val token = task.result
            // Delay FCM token registration to ensure auth token is available
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                registerFCMTokenWithServer(token)
            }, 1000) // 1 second delay
        }
    }
    
    private fun registerFCMTokenWithServer(token: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val apiService = ApiService.create()
                val authToken = sharedPreferences.getString("auth_token", null)
                
                if (authToken == null) {
                    runOnUiThread {
                        Toast.makeText(this@MainActivity, "Not logged in, cannot register for push notifications", Toast.LENGTH_SHORT).show()
                    }
                    return@launch
                }
                
                val response = apiService.registerFCMToken("Bearer $authToken", FCMTokenRequest(token))
                
                runOnUiThread {
                    if (response.isSuccessful) {
                        Toast.makeText(this@MainActivity, "Push notifications enabled", Toast.LENGTH_SHORT).show()
                    } else {
                        val errorMessage = when (response.code()) {
                            401 -> "Authentication failed - please log in again"
                            403 -> "Access denied - insufficient permissions"
                            500 -> "Server error - please try again later"
                            else -> "Failed to register for push notifications (${response.code()})"
                        }
                        Toast.makeText(this@MainActivity, errorMessage, Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "Error registering for push notifications", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
