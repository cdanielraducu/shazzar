package com.shazzar.modules.notifications

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import org.json.JSONObject

// AlarmManager alarms don't survive device reboots — they live in memory only.
// Android broadcasts BOOT_COMPLETED when the system finishes booting. We listen
// for it here and re-register any alarms that were persisted to SharedPreferences.
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
            val triggerAtMs = alarm.getLong("triggerAtMs")

            // Skip alarms whose trigger time has already passed — firing a
            // stale habit reminder after reboot would confuse the user.
            if (triggerAtMs <= System.currentTimeMillis()) {
                prefs.edit().remove(id.toString()).apply()
                continue
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

            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMs,
                pendingIntent,
            )
        }
    }
}
