package com.shazzar.modules.notifications

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.util.Calendar

class NotificationReceiver : BroadcastReceiver() {

    companion object {
        const val CHANNEL_ID = "shazzar_habits"
        const val EXTRA_TITLE = "title"
        const val EXTRA_BODY = "body"
        const val EXTRA_ID = "notification_id"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val title = intent.getStringExtra(EXTRA_TITLE) ?: "Shazzar"
        val staticBody = intent.getStringExtra(EXTRA_BODY) ?: ""
        val notificationId = intent.getIntExtra(EXTRA_ID, 0)

        val prefs = context.getSharedPreferences("shazzar_alarms", Context.MODE_PRIVATE)
        val json = prefs.getString(notificationId.toString(), null)
        val alarm = json?.let { runCatching { JSONObject(it) }.getOrNull() }
        val dataSource = alarm?.optString("dataSource", "") ?: ""

        Log.d("Shazzar", "NotificationReceiver fired: id=$notificationId dataSource='$dataSource'")

        if (dataSource.equals("steps", ignoreCase = true)) {
            // Health Connect refuses reads from background processes.
            // Delegate to StepsFetchService — a ForegroundService is allowed to read health data.
            val serviceIntent = Intent(context, StepsFetchService::class.java).apply {
                putExtra(EXTRA_ID, notificationId)
                putExtra(EXTRA_TITLE, title)
                putExtra(EXTRA_BODY, staticBody)
                putExtra("alarmJson", json)
            }
            context.startForegroundService(serviceIntent)
        } else if (resolveAppPackage(dataSource) != null || dataSource.contains('.')) {
            // App-based data sources — read notification count from AppNotificationListenerService.
            val pkgName = resolveAppPackage(dataSource) ?: dataSource
            val body = buildAppNotifBody(context, pkgName, staticBody)
            showNotification(context, notificationId, title, body)
            rescheduleIfRepeating(context, notificationId, title, staticBody, alarm)
        } else {
            showNotification(context, notificationId, title, staticBody)
            rescheduleIfRepeating(context, notificationId, title, staticBody, alarm)
        }
    }

    // Maps well-known app aliases to their canonical Android package names.
    // Returns null if the alias is not recognised (caller should treat the value
    // as a raw package name if it contains a dot).
    private fun resolveAppPackage(dataSource: String): String? = when (dataSource.lowercase()) {
        "whatsapp" -> "com.whatsapp"
        "instagram" -> "com.instagram.android"
        "telegram" -> "org.telegram.messenger"
        else -> null
    }

    // Returns a human-readable alias for a known package, used in notification body copy.
    private fun appDisplayName(pkgName: String): String = when (pkgName) {
        "com.whatsapp" -> "WhatsApp"
        "com.instagram.android" -> "Instagram"
        "org.telegram.messenger" -> "Telegram"
        else -> pkgName
    }

    // Reads the stored notification count from AppNotificationListenerService's prefs
    // and formats an enriched body string.  Falls back to staticBody when count is 0
    // or the service has not yet recorded any notifications.
    private fun buildAppNotifBody(
        context: Context,
        pkgName: String,
        staticBody: String,
    ): String {
        val prefs = context.getSharedPreferences(
            AppNotificationListenerService.PREFS_NAME, Context.MODE_PRIVATE
        )
        val count = prefs.getString(pkgName, "0")?.toIntOrNull() ?: 0
        if (count <= 0) return staticBody

        val displayName = appDisplayName(pkgName)
        return "You have $count unread $displayName ${if (count == 1) "message" else "messages"}"
    }

    private fun showNotification(context: Context, id: Int, title: String, body: String) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            CHANNEL_ID, "Habit Reminders", NotificationManager.IMPORTANCE_DEFAULT,
        )
        manager.createNotificationChannel(channel)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .build()

        manager.notify(id, notification)
    }

    private fun rescheduleIfRepeating(
        context: Context,
        id: Int,
        title: String,
        body: String,
        alarm: JSONObject?,
    ) {
        if (alarm == null) return
        val hour = alarm.optInt("hour", -1)
        val minute = alarm.optInt("minute", -1)
        val frequency = alarm.optString("frequency", "")
        if (hour < 0 || minute < 0 || frequency.isEmpty()) return

        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, hour)
        cal.set(Calendar.MINUTE, minute)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        cal.add(Calendar.DAY_OF_YEAR, if (frequency == "weekly") 7 else 1)
        val nextTriggerAtMs = cal.timeInMillis

        val nextIntent = Intent(context, NotificationReceiver::class.java).apply {
            putExtra(EXTRA_ID, id)
            putExtra(EXTRA_TITLE, title)
            putExtra(EXTRA_BODY, body)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context, id, nextIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager)
            .setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextTriggerAtMs, pendingIntent)

        val updated = JSONObject(alarm.toString()).apply { put("triggerAtMs", nextTriggerAtMs) }
        context.getSharedPreferences("shazzar_alarms", Context.MODE_PRIVATE)
            .edit().putString(id.toString(), updated.toString()).apply()
    }
}
