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
import org.json.JSONObject
import java.util.Calendar

class NotificationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "Notifications"

    private fun prefs() = reactApplicationContext.getSharedPreferences("shazzar_alarms", Context.MODE_PRIVATE)

    @ReactMethod
    fun getFcmToken(promise: Promise) {
        val token = reactApplicationContext
            .getSharedPreferences("shazzar_fcm", Context.MODE_PRIVATE)
            .getString("token", null)
        promise.resolve(token)
    }

    private fun saveAlarm(
        id: Int,
        title: String,
        body: String,
        triggerAtMs: Long,
        hour: Int = -1,
        minute: Int = -1,
        frequency: String = "",
        dataSource: String = "",
    ) {
        val alarm = JSONObject().apply {
            put("id", id)
            put("title", title)
            put("body", body)
            put("triggerAtMs", triggerAtMs)
            put("hour", hour)
            put("minute", minute)
            put("frequency", frequency)
            put("dataSource", dataSource)
        }
        prefs().edit().putString(id.toString(), alarm.toString()).apply()
    }

    private fun removeAlarm(id: Int) {
        prefs().edit().remove(id.toString()).apply()
    }

    private fun nextTriggerMs(hour: Int, minute: Int): Long {
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, hour)
        cal.set(Calendar.MINUTE, minute)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        if (cal.timeInMillis <= System.currentTimeMillis()) {
            cal.add(Calendar.DAY_OF_YEAR, 1)
        }
        return cal.timeInMillis
    }

    private fun makePendingIntent(id: Int, title: String, body: String): PendingIntent {
        val intent = Intent(reactApplicationContext, NotificationReceiver::class.java).apply {
            putExtra(NotificationReceiver.EXTRA_ID, id)
            putExtra(NotificationReceiver.EXTRA_TITLE, title)
            putExtra(NotificationReceiver.EXTRA_BODY, body)
        }
        return PendingIntent.getBroadcast(
            reactApplicationContext,
            id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    @ReactMethod
    fun canScheduleExactAlarms(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            promise.resolve(true)
            return
        }
        val alarmManager = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        promise.resolve(alarmManager.canScheduleExactAlarms())
    }

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

    // One-shot notification — used by the Settings playground.
    @ReactMethod
    fun scheduleNotification(id: Int, title: String, body: String, triggerAtMs: Double, promise: Promise) {
        try {
            val alarmManager = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMs.toLong(),
                makePendingIntent(id, title, body),
            )
            saveAlarm(id, title, body, triggerAtMs.toLong())
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("NOTIFICATION_ERROR", "Failed to schedule: ${e.message}", e)
        }
    }

    // Repeating notification — fires at hour:minute daily or weekly.
    // AlarmManager fires once; NotificationReceiver re-schedules the next occurrence.
    // hour, minute, frequency are stored in SharedPreferences for the receiver to use.
    @ReactMethod
    fun scheduleRepeating(id: Int, title: String, body: String, hour: Int, minute: Int, frequency: String, dataSource: String, promise: Promise) {
        try {
            val triggerAtMs = nextTriggerMs(hour, minute)
            val alarmManager = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMs,
                makePendingIntent(id, title, body),
            )
            saveAlarm(id, title, body, triggerAtMs, hour, minute, frequency, dataSource)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("NOTIFICATION_ERROR", "Failed to schedule repeating: ${e.message}", e)
        }
    }

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
            removeAlarm(id)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("NOTIFICATION_ERROR", "Failed to cancel: ${e.message}", e)
        }
    }
}
