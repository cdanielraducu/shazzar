package com.shazzar.modules.notifications

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NotificationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "Notifications"

    // Returns true if the app can schedule exact alarms, false otherwise.
    // On API 31+ this is a special app access permission the user grants in Settings.
    @ReactMethod
    fun canScheduleExactAlarms(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            promise.resolve(true)
            return
        }
        val alarmManager = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        promise.resolve(alarmManager.canScheduleExactAlarms())
    }

    // Opens the system Settings page where the user can grant exact alarm permission.
    // There is no dialog for this — it must be granted in Special app access.
    @ReactMethod
    fun openExactAlarmSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                data = Uri.parse("package:${reactApplicationContext.packageName}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("NOTIFICATION_ERROR", "Could not open alarm settings: ${e.message}", e)
        }
    }

    // Schedules a local notification to fire at triggerAtMs (Unix timestamp in ms).
    // AlarmManager wakes the device if needed and fires the Intent exactly once.
    // id is used to cancel or replace the notification later.
    @ReactMethod
    fun scheduleNotification(id: Int, title: String, body: String, triggerAtMs: Double, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, NotificationReceiver::class.java).apply {
                putExtra(NotificationReceiver.EXTRA_ID, id)
                putExtra(NotificationReceiver.EXTRA_TITLE, title)
                putExtra(NotificationReceiver.EXTRA_BODY, body)
            }

            // FLAG_IMMUTABLE — required on API 31+. The PendingIntent cannot be modified
            // after creation. FLAG_UPDATE_CURRENT replaces any existing PendingIntent
            // with the same id, so scheduling the same id twice updates it.
            val pendingIntent = PendingIntent.getBroadcast(
                reactApplicationContext,
                id,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            val alarmManager = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager

            // setExactAndAllowWhileIdle fires even in Doze mode (battery saver).
            // Regular setExact() can be deferred by hours in Doze — not acceptable
            // for habit reminders that need to fire at a specific time.
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMs.toLong(),
                pendingIntent,
            )

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("NOTIFICATION_ERROR", "Failed to schedule: ${e.message}", e)
        }
    }

    // Cancels a previously scheduled notification by id.
    // Recreates the same PendingIntent and passes it to cancel() —
    // Android matches by requestCode (id) + Intent action/component.
    @ReactMethod
    fun cancelNotification(id: Int, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, NotificationReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                reactApplicationContext,
                id,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            val alarmManager = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmManager.cancel(pendingIntent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("NOTIFICATION_ERROR", "Failed to cancel: ${e.message}", e)
        }
    }
}
