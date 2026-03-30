package com.shazzar

import android.app.Activity
import android.os.Bundle

// Minimal activity required by Health Connect to register this app as a
// health data consumer. Health Connect opens this when the user taps
// "learn more" or views the app's permission rationale.
// For now it just closes immediately — in a production app you'd show
// a screen explaining why you need health data access.
class HealthPermissionRationaleActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        finish()
    }
}
