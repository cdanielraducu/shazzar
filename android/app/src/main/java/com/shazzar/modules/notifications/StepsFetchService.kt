package com.shazzar.modules.notifications

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.time.Instant
import java.time.ZoneId
import java.util.Calendar

// ForegroundService is required to read Health Connect data outside the app UI.
// Health Connect rejects reads from background processes (BroadcastReceiver, WorkManager).
// A ForegroundService is considered "foreground" and is permitted to read health data.
class StepsFetchService : Service() {

    companion object {
        // Temporary notification shown while the service is fetching — distinct id from habit ids.
        private const val TEMP_NOTIFICATION_ID = 999998
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notificationId = intent?.getIntExtra(NotificationReceiver.EXTRA_ID, 0) ?: 0
        val title = intent?.getStringExtra(NotificationReceiver.EXTRA_TITLE) ?: "Shazzar"
        val staticBody = intent?.getStringExtra(NotificationReceiver.EXTRA_BODY) ?: ""
        val alarmJson = intent?.getStringExtra("alarmJson")
        val alarm = alarmJson?.let { runCatching { JSONObject(it) }.getOrNull() }

        // Must call startForeground() before doing any work — Android kills the service
        // if this isn't called within ~5 seconds of onStartCommand().
        startForeground(TEMP_NOTIFICATION_ID, buildTempNotification())

        CoroutineScope(Dispatchers.IO).launch {
            val body = try {
                val steps = readStepsToday()
                "You've walked $steps steps today."
            } catch (e: Exception) {
                Log.e("Shazzar", "StepsFetchService: readSteps failed: ${e.message}", e)
                staticBody
            }

            showHabitNotification(notificationId, title, body)
            reschedule(notificationId, title, staticBody, alarm)

            // Remove the temporary foreground notification and stop the service.
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }

        return START_NOT_STICKY
    }

    private fun buildTempNotification() = run {
        ensureChannel()
        NotificationCompat.Builder(this, NotificationReceiver.CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle("Shazzar")
            .setContentText("Fetching your data…")
            .build()
    }

    private fun showHabitNotification(id: Int, title: String, body: String) {
        ensureChannel()
        val notification = NotificationCompat.Builder(this, NotificationReceiver.CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .build()
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(id, notification)
    }

    private fun ensureChannel() {
        val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            NotificationReceiver.CHANNEL_ID,
            "Habit Reminders",
            NotificationManager.IMPORTANCE_DEFAULT,
        )
        manager.createNotificationChannel(channel)
    }

    private suspend fun readStepsToday(): Long {
        val client = HealthConnectClient.getOrCreate(this)
        val now = Instant.now()
        val startOfDay = now.atZone(ZoneId.systemDefault())
            .toLocalDate()
            .atStartOfDay(ZoneId.systemDefault())
            .toInstant()
        val response = client.readRecords(
            ReadRecordsRequest(
                recordType = StepsRecord::class,
                timeRangeFilter = TimeRangeFilter.between(startOfDay, now),
            )
        )
        return response.records.sumOf { it.count }
    }

    private fun reschedule(id: Int, title: String, body: String, alarm: JSONObject?) {
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

        val nextIntent = Intent(this, NotificationReceiver::class.java).apply {
            putExtra(NotificationReceiver.EXTRA_ID, id)
            putExtra(NotificationReceiver.EXTRA_TITLE, title)
            putExtra(NotificationReceiver.EXTRA_BODY, body)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            this, id, nextIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        (getSystemService(ALARM_SERVICE) as AlarmManager)
            .setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextTriggerAtMs, pendingIntent)

        val updated = JSONObject(alarm.toString()).apply { put("triggerAtMs", nextTriggerAtMs) }
        getSharedPreferences("shazzar_alarms", MODE_PRIVATE)
            .edit().putString(id.toString(), updated.toString()).apply()
    }
}
