package com.shazzar.modules.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat

// BroadcastReceiver is the Android mechanism for receiving async system events.
// AlarmManager fires an Intent at the scheduled time — Android delivers it here,
// even if the app is in the background. This class has no persistent state;
// Android instantiates it fresh for each broadcast.
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

        // NotificationChannel is required on API 26+. Creating it here (not just once
        // at app start) is safe — createNotificationChannel() is idempotent.
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
    }
}
