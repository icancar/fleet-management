package com.fleetmanagement.tracker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            
            // Optionally restart location tracking service
            // For now, we'll just log that boot was received
            println("Boot completed - Fleet Tracker ready")
        }
    }
}
