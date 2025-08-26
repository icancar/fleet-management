package com.fleetmanagement.tracker

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    
    @POST("location")
    suspend fun sendLocation(@Body locationData: LocationData): Response<LocationResponse>
    
    companion object {
        fun create(): ApiService {
            return retrofit2.Retrofit.Builder()
                .baseUrl("http://10.0.2.2:3001/api/") // For Android emulator
                // .baseUrl("http://192.168.1.100:3001/api/") // For real device (replace with your server IP)
                .addConverterFactory(retrofit2.converter.gson.GsonConverterFactory.create())
                .build()
                .create(ApiService::class.java)
        }
    }
}

data class LocationResponse(
    val success: Boolean,
    val message: String?,
    val data: LocationData?
)
