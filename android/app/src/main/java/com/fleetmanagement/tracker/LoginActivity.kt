package com.fleetmanagement.tracker

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class LoginActivity : AppCompatActivity() {

    private lateinit var emailEditText: EditText
    private lateinit var passwordEditText: EditText
    private lateinit var loginButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var sharedPreferences: SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        // Check if user is already logged in
        sharedPreferences = getSharedPreferences("fleet_management", Context.MODE_PRIVATE)
        val token = sharedPreferences.getString("auth_token", null)
        if (token != null) {
            // User is already logged in, go to main activity
            navigateToMainActivity()
            return
        }

        initializeViews()
        setupClickListeners()
    }

    private fun initializeViews() {
        emailEditText = findViewById(R.id.emailEditText)
        passwordEditText = findViewById(R.id.passwordEditText)
        loginButton = findViewById(R.id.loginButton)
        progressBar = findViewById(R.id.progressBar)
        
        // Ensure text colors are set correctly
        emailEditText.setTextColor(resources.getColor(android.R.color.black, null))
        passwordEditText.setTextColor(resources.getColor(android.R.color.black, null))
    }

    private fun setupClickListeners() {
        loginButton.setOnClickListener {
            performLogin()
        }
    }

    private fun performLogin() {
        val email = emailEditText.text.toString().trim()
        val password = passwordEditText.text.toString().trim()

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please enter both email and password", Toast.LENGTH_SHORT).show()
            return
        }

        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(this, "Please enter a valid email address", Toast.LENGTH_SHORT).show()
            return
        }

        showLoading(true)
        
        lifecycleScope.launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    performLoginRequest(email, password)
                }
                
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    
                    if (result.success) {
                        // Save token and user data
                        sharedPreferences.edit()
                            .putString("auth_token", result.token)
                            .putString("user_id", result.userId)
                            .putString("user_email", result.email)
                            .putString("user_name", result.name)
                            .putString("user_role", result.role)
                            .apply()
                        
                        Toast.makeText(this@LoginActivity, "Login successful!", Toast.LENGTH_SHORT).show()
                        navigateToMainActivity()
                    } else {
                        Toast.makeText(this@LoginActivity, result.message, Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    Toast.makeText(this@LoginActivity, "Login failed: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun performLoginRequest(email: String, password: String): LoginResult {
        val url = URL("http://192.168.1.8:3001/api/auth/login")
        val connection = url.openConnection() as HttpURLConnection
        
        try {
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.doOutput = true
            
            val requestBody = JSONObject().apply {
                put("email", email)
                put("password", password)
            }
            
            connection.outputStream.use { outputStream ->
                outputStream.write(requestBody.toString().toByteArray())
            }
            
            val responseCode = connection.responseCode
            val responseBody = if (responseCode == HttpURLConnection.HTTP_OK) {
                connection.inputStream.bufferedReader().readText()
            } else {
                connection.errorStream.bufferedReader().readText()
            }
            
            val jsonResponse = JSONObject(responseBody)
            
            return if (responseCode == HttpURLConnection.HTTP_OK && jsonResponse.getBoolean("success")) {
                val data = jsonResponse.getJSONObject("data")
                val user = data.getJSONObject("user")
                
                LoginResult(
                    success = true,
                    token = data.getString("token"),
                    userId = user.getString("id"),
                    email = user.getString("email"),
                    name = "${user.getString("firstName")} ${user.getString("lastName")}",
                    role = user.getString("role"),
                    message = jsonResponse.getString("message")
                )
            } else {
                LoginResult(
                    success = false,
                    token = null,
                    userId = null,
                    email = null,
                    name = null,
                    role = null,
                    message = jsonResponse.optString("message", "Login failed")
                )
            }
            
        } finally {
            connection.disconnect()
        }
    }

    private fun showLoading(show: Boolean) {
        progressBar.visibility = if (show) View.VISIBLE else View.GONE
        loginButton.isEnabled = !show
        emailEditText.isEnabled = !show
        passwordEditText.isEnabled = !show
    }

    private fun navigateToMainActivity() {
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    data class LoginResult(
        val success: Boolean,
        val token: String?,
        val userId: String?,
        val email: String?,
        val name: String?,
        val role: String?,
        val message: String
    )
}
