package com.fleetmanagement.tracker

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

interface ApiService {
    
    @POST("location")
    suspend fun sendLocation(@Body locationData: LocationData): Response<LocationResponse>
    
    @POST("auth/fcm-token")
    suspend fun registerFCMToken(
        @Header("Authorization") token: String,
        @Body request: FCMTokenRequest
    ): Response<ApiResponse<Any>>
    
    companion object {
        fun create(): ApiService {
            return retrofit2.Retrofit.Builder()
                            .baseUrl("http://192.168.1.8:3001/api/") // Your computer's IP address
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

data class ApiResponse<T>(
    val success: Boolean,
    val message: String?,
    val data: T?
)
