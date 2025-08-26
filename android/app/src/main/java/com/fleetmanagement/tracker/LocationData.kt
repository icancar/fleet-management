package com.fleetmanagement.tracker

import java.util.Date

data class LocationData(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val timestamp: Date,
    val speed: Float,
    val bearing: Float,
    val altitude: Double,
    val deviceId: String = android.os.Build.SERIAL.takeIf { it != "unknown" } ?: "unknown"
)
