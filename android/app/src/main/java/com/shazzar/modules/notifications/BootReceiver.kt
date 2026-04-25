package com.shazzar.modules.notifications

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import org.json.JSONObject
import java.util.Calendar

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        val prefs = context.getSharedPreferences("shazzar_alarms", Context.MODE_PRIVATE)
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        for ((_, value) in prefs.all) {
            val alarm = JSONObject(value as String)
            val id = alarm.getInt("id")
            val title = alarm.getString("title")
            val body = alarm.getString("body")
            var triggerAtMs = alarm.getLong("triggerAtMs")
            val hour = alarm.optInt("hour", -1)
            val minute = alarm.optInt("minute", -1)
            val frequency = alarm.optString("frequency", "")
            val isRepeating = hour >= 0 && minute >= 0 && frequency.isNotEmpty()

            if (triggerAtMs <= System.currentTimeMillis()) {
                if (!isRepeating) {
                    // One-shot alarm already past — remove it.
                    prefs.edit().remove(id.toString()).apply()
                    continue
                }
                // Repeating alarm past due — advance to the next future occurrence.
                val intervalDays = if (frequency == "weekly") 7 else 1
                val cal = Calendar.getInstance()
                cal.set(Calendar.HOUR_OF_DAY, hour)
                cal.set(Calendar.MINUTE, minute)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                while (cal.timeInMillis <= System.currentTimeMillis()) {
                    cal.add(Calendar.DAY_OF_YEAR, intervalDays)
                }
                triggerAtMs = cal.timeInMillis
                val updated = JSONObject(value).apply { put("triggerAtMs", triggerAtMs) }
                prefs.edit().putString(id.toString(), updated.toString()).apply()
            }

            val broadcastIntent = Intent(context, NotificationReceiver::class.java).apply {
                putExtra(NotificationReceiver.EXTRA_ID, id)
                putExtra(NotificationReceiver.EXTRA_TITLE, title)
                putExtra(NotificationReceiver.EXTRA_BODY, body)
            }

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                id,
                broadcastIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent)
        }
    }
}
