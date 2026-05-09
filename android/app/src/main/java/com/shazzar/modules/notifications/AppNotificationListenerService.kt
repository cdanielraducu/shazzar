package com.shazzar.modules.notifications

import android.content.Context
import android.content.pm.PackageManager
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

// AppNotificationListenerService is bound by the OS when the user grants notification access
// in Settings → Notification access.  It runs in the app's process but is managed entirely
// by the OS — Android binds/unbinds it automatically, and it survives across app restarts.
//
// Notification counts are stored in SharedPreferences ("shazzar_notif_counts") so they can
// be read by AppNotificationListenerModule and NotificationReceiver without an IPC call.
class AppNotificationListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "ShazzarNotifListener"
        const val PREFS_NAME = "shazzar_notif_counts"

        // Singleton reference to the ReactContext so we can emit JS events.
        // Guarded by the fact that this service is only bound once — race conditions
        // between bind/unbind and JS event emission are acceptable here (events
        // may be dropped briefly if the bridge restarts).
        @Volatile
        var reactContextHolder: com.facebook.react.bridge.ReactApplicationContext? = null
    }

    // Called by the OS every time a new notification is posted to any app.
    // StatusBarNotification wraps the original Notification + metadata.
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val pkg = sbn.packageName ?: return
        incrementCount(pkg)

        // Resolve a human-readable app name for the JS payload.
        val appName = resolveAppName(pkg)

        val notification = sbn.notification ?: return
        val extras = notification.extras
        val title = extras?.getString("android.title") ?: ""
        val text = extras?.getCharSequence("android.text")?.toString() ?: ""

        Log.d(TAG, "onNotificationPosted: pkg=$pkg appName=$appName title=$title")

        emitJsEvent(pkg, appName, title, text)
    }

    // Called by the OS when a notification is cleared (by user or app).
    // We decrement the count, flooring at 0 to avoid negative values.
    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        val pkg = sbn.packageName ?: return
        decrementCount(pkg)
        Log.d(TAG, "onNotificationRemoved: pkg=$pkg")
    }

    // ---------------------------------------------------------------------------
    // SharedPreferences helpers
    // ---------------------------------------------------------------------------

    private fun prefs() = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun incrementCount(pkg: String) {
        val prefs = prefs()
        val current = prefs.getString(pkg, "0")?.toIntOrNull() ?: 0
        prefs.edit().putString(pkg, (current + 1).toString()).apply()
    }

    private fun decrementCount(pkg: String) {
        val prefs = prefs()
        val current = prefs.getString(pkg, "0")?.toIntOrNull() ?: 0
        val next = maxOf(0, current - 1)
        prefs.edit().putString(pkg, next.toString()).apply()
    }

    // ---------------------------------------------------------------------------
    // JS event emission
    // ---------------------------------------------------------------------------

    private fun emitJsEvent(packageName: String, appName: String, title: String, text: String) {
        val ctx = reactContextHolder ?: return
        if (!ctx.hasActiveReactInstance()) return

        try {
            val params = Arguments.createMap().apply {
                putString("packageName", packageName)
                putString("appName", appName)
                putString("title", title)
                putString("text", text)
            }
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onAppNotification", params)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to emit onAppNotification event: ${e.message}", e)
        }
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private fun resolveAppName(pkg: String): String {
        return try {
            val info = packageManager.getApplicationInfo(pkg, 0)
            packageManager.getApplicationLabel(info).toString()
        } catch (e: PackageManager.NameNotFoundException) {
            pkg
        }
    }
}
