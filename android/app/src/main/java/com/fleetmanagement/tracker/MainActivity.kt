package com.fleetmanagement.tracker

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModelProvider

class MainActivity : AppCompatActivity() {
    
    private lateinit var viewModel: MainViewModel
    private lateinit var statusText: TextView
    private lateinit var serverUrlText: TextView
    private lateinit var debugText: TextView
    private lateinit var startButton: Button
    private lateinit var stopButton: Button
    private lateinit var viewRoutesButton: Button
    
    companion object {
        private const val LOCATION_PERMISSION_REQUEST_CODE = 1001
        private val PERMISSIONS = arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.ACCESS_BACKGROUND_LOCATION,
            Manifest.permission.FOREGROUND_SERVICE,
            Manifest.permission.WAKE_LOCK,
            Manifest.permission.ACCESS_WIFI_STATE
        )
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        viewModel = ViewModelProvider(this)[MainViewModel::class.java]
        
        initViews()
        setupObservers()
        checkPermissions()
    }
    
    private fun initViews() {
        statusText = findViewById(R.id.statusText)
        serverUrlText = findViewById(R.id.serverUrlText)
        debugText = findViewById(R.id.debugText)
        startButton = findViewById(R.id.startButton)
        stopButton = findViewById(R.id.stopButton)
        viewRoutesButton = findViewById(R.id.viewRoutesButton)
        
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
    }
    
    private fun setupObservers() {
        viewModel.isTracking.observe(this) { isTracking ->
            updateUI(isTracking)
        }
        
        viewModel.lastLocation.observe(this) { location ->
            statusText.text = "Last Location: ${location.latitude}, ${location.longitude}"
        }
        
        // Register broadcast receiver for debug messages
        registerReceiver(object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                when (intent?.action) {
                    "LOCATION_SENT_SUCCESS" -> {
                        val message = intent.getStringExtra("message") ?: "Location sent successfully"
                        updateDebugInfo(message)
                    }
                    "LOCATION_SENT_FAILED" -> {
                        val message = intent.getStringExtra("message") ?: "Failed to send location"
                        updateDebugInfo(message)
                    }
                }
            }
        }, IntentFilter().apply {
            addAction("LOCATION_SENT_SUCCESS")
            addAction("LOCATION_SENT_FAILED")
        })
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
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                Toast.makeText(this, "Location permissions granted", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Location permissions required for tracking", Toast.LENGTH_LONG).show()
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
            debugText.text = "Debug: Waiting for location updates..."
        } else {
            statusText.text = "Location tracking stopped"
            debugText.text = "Debug: No location data yet"
        }
    }

    fun updateDebugInfo(message: String) {
        runOnUiThread {
            debugText.text = "Debug: $message"
        }
    }
}
