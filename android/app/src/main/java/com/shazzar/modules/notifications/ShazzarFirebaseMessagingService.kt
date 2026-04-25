package com.shazzar.modules.notifications

import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

// FirebaseMessagingService is a long-lived Service (not a BroadcastReceiver).
// FCM keeps a persistent connection to Google's servers and delivers messages
// to this service even when the app is in the background.
//
// Two entry points:
//   onNewToken   — called when FCM assigns or rotates the device token
//   onMessageReceived — called for data messages and foreground notifications
class ShazzarFirebaseMessagingService : FirebaseMessagingService() {

    // FCM issues a new token when the app is first installed, when the user
    // reinstalls, or when FCM rotates tokens for security. We emit it to JS
    // so the app can register it with a backend.
    override fun onNewToken(token: String) {
        // Persist so NotificationModule.getFcmToken() can return it any time JS asks,
        // regardless of when onNewToken fires relative to React context readiness.
        getSharedPreferences("shazzar_fcm", Context.MODE_PRIVATE)
            .edit().putString("token", token).apply()
        emitToJs("fcmToken", token)
    }

    // Called when a message arrives while the app is in the foreground,
    // or for data-only messages regardless of foreground/background state.
    // Notification messages (title + body) sent while the app is in the
    // background are handled automatically by the FCM SDK — they appear
    // in the system tray without reaching this method.
    override fun onMessageReceived(message: RemoteMessage) {
        val params = Arguments.createMap().apply {
            putString("messageId", message.messageId)
            // data payload — key/value pairs sent from the backend
            val data = Arguments.createMap()
            message.data.forEach { (k, v) -> data.putString(k, v) }
            putMap("data", data)
            // notification payload — title/body if present
            message.notification?.let {
                putString("title", it.title)
                putString("body", it.body)
            }
        }
        emitToJs("fcmMessage", params)
    }

    // RCTDeviceEventEmitter is the React Native mechanism for sending events
    // from native to JS without a direct method call. JS subscribes with
    // NativeEventEmitter and receives the payload as a JS object.
    // New architecture: use reactHost.currentReactContext, not reactNativeHost.
    private fun emitToJs(event: String, payload: Any?) {
        val reactApp = applicationContext as? ReactApplication ?: return
        reactApp.reactHost
            ?.currentReactContext
            ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(event, payload)
    }
}
