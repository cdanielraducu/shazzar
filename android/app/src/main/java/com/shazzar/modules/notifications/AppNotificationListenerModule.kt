package com.shazzar.modules.notifications

import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

// AppNotificationListenerModule exposes notification-listener controls to the JS layer.
//
// The user must manually grant notification access in
// Settings → Apps → Special app access → Notification access.
// This module lets JS check that status and open the settings screen.
//
// Notification counts are read from SharedPreferences written by
// AppNotificationListenerService — no IPC needed because both components
// share the same app process and prefs file.
class AppNotificationListenerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppNotificationListener"

    override fun initialize() {
        super.initialize()
        // Store the ReactContext in the service companion so it can emit JS events.
        // The context is valid for the lifetime of the React bridge instance.
        AppNotificationListenerService.reactContextHolder = reactApplicationContext
    }

    override fun invalidate() {
        super.invalidate()
        // Clear the reference when the bridge tears down to prevent leaks.
        AppNotificationListenerService.reactContextHolder = null
    }

    // Returns true if Shazzar appears in the system's enabled notification listeners list.
    // Uses Settings.Secure to query the raw colon-separated list of listener component names —
    // the most reliable method across API levels.
    @ReactMethod
    fun isEnabled(promise: Promise) {
        try {
            val flat = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                "enabled_notification_listeners"
            ) ?: ""
            val pkgName = reactApplicationContext.packageName
            // The list contains entries like "com.example/.MyService" — a simple contains
            // on the package name is sufficient because we only need to know if *any*
            // listener from our package is enabled.
            promise.resolve(flat.contains(pkgName))
        } catch (e: Exception) {
            promise.reject("NOTIF_LISTENER_ERROR", "Failed to check listener status: ${e.message}", e)
        }
    }

    // Opens the system Notification access settings screen so the user can grant access.
    // There is no programmatic way to grant this permission — the user must do it manually.
    @ReactMethod
    fun openSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("NOTIF_LISTENER_ERROR", "Could not open notification settings: ${e.message}", e)
        }
    }

    // Returns the current unread notification count for the given package name.
    // The count is maintained by AppNotificationListenerService via SharedPreferences.
    // Returns 0 if the service is not enabled or no notifications have arrived yet.
    @ReactMethod
    fun getNotificationCount(packageName: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(
                AppNotificationListenerService.PREFS_NAME, Context.MODE_PRIVATE
            )
            val count = prefs.getString(packageName, "0")?.toIntOrNull() ?: 0
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("NOTIF_LISTENER_ERROR", "Failed to read count for $packageName: ${e.message}", e)
        }
    }

    // Resets the stored notification count for the given package name to zero.
    // Call this after the user has acknowledged a notification or opened the app.
    @ReactMethod
    fun clearNotificationCount(packageName: String, promise: Promise) {
        try {
            reactApplicationContext.getSharedPreferences(
                AppNotificationListenerService.PREFS_NAME, Context.MODE_PRIVATE
            ).edit().putString(packageName, "0").apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("NOTIF_LISTENER_ERROR", "Failed to clear count for $packageName: ${e.message}", e)
        }
    }
}
