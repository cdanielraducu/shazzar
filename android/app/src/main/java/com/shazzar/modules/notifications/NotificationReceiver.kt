package com.shazzar.modules.notifications

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
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
        val body = intent.getStringExtra(EXTRA_BODY) ?: ""
        val notificationId = intent.getIntExtra(EXTRA_ID, 0)

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val channel = NotificationChannel(
            CHANNEL_ID,
            "Habit Reminders",
            NotificationManager.IMPORTANCE_DEFAULT,
        )
        manager.createNotificationChannel(channel)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .build()

        manager.notify(notificationId, notification)

        // Re-schedule for the next occurrence if this is a repeating alarm.
        // AlarmManager fires once — repeating is handled by scheduling again here.
        rescheduleIfRepeating(context, notificationId, title, body)
    }

    private fun rescheduleIfRepeating(context: Context, id: Int, title: String, body: String) {
        val prefs = context.getSharedPreferences("shazzar_alarms", Context.MODE_PRIVATE)
        val json = prefs.getString(id.toString(), null) ?: return
        val alarm = JSONObject(json)

        val hour = alarm.optInt("hour", -1)
        val minute = alarm.optInt("minute", -1)
        val frequency = alarm.optString("frequency", "")

        // One-shot alarms have no hour/minute stored — skip re-scheduling.
        if (hour < 0 || minute < 0 || frequency.isEmpty()) return

        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, hour)
        cal.set(Calendar.MINUTE, minute)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)

        val intervalDays = if (frequency == "weekly") 7 else 1
        cal.add(Calendar.DAY_OF_YEAR, intervalDays)

        val nextTriggerAtMs = cal.timeInMillis

        val nextIntent = Intent(context, NotificationReceiver::class.java).apply {
            putExtra(EXTRA_ID, id)
            putExtra(EXTRA_TITLE, title)
            putExtra(EXTRA_BODY, body)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            id,
            nextIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextTriggerAtMs, pendingIntent)

        // Update stored triggerAtMs so BootReceiver has the correct next-fire time.
        val updated = JSONObject(json).apply { put("triggerAtMs", nextTriggerAtMs) }
        prefs.edit().putString(id.toString(), updated.toString()).apply()
    }
}
