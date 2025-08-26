package com.fleetmanagement.tracker

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import android.location.Location

class MainViewModel : ViewModel() {
    
    private val _isTracking = MutableLiveData<Boolean>(false)
    val isTracking: LiveData<Boolean> = _isTracking
    
    private val _lastLocation = MutableLiveData<Location>()
    val lastLocation: LiveData<Location> = _lastLocation
    
    fun setTracking(tracking: Boolean) {
        _isTracking.value = tracking
    }
    
    fun updateLocation(location: Location) {
        _lastLocation.value = location
    }
}
