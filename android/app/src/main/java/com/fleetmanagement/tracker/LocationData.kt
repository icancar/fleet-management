package com.fleetmanagement.tracker

import java.text.SimpleDateFormat
import java.util.*

data class LocationData(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val timestamp: String,
    val speed: Float,
    val bearing: Float,
    val altitude: Double,
    val deviceId: String = android.os.Build.SERIAL.takeIf { it != "unknown" } ?: "unknown"
) {
    companion object {
        private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        
        fun create(
            latitude: Double,
            longitude: Double,
            accuracy: Float,
            timestamp: Date,
            speed: Float,
            bearing: Float,
            altitude: Double,
            deviceId: String = android.os.Build.SERIAL.takeIf { it != "unknown" } ?: "unknown"
        ): LocationData {
            return LocationData(
                latitude = latitude,
                longitude = longitude,
                accuracy = accuracy,
                timestamp = dateFormat.format(timestamp),
                speed = speed,
                bearing = bearing,
                altitude = altitude,
                deviceId = deviceId
            )
        }
    }
}
