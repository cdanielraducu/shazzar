import {NativeModules, NativeEventEmitter, Platform} from 'react-native';

const {Notifications: NativeNotifications} = NativeModules;

// FCM events emitted from ShazzarFirebaseMessagingService via RCTDeviceEventEmitter.
// JS subscribes with the emitter returned here — subscription must be removed
// in the component's cleanup to avoid duplicate listeners.
const emitter =
  Platform.OS === 'android' ? new NativeEventEmitter() : null;

const Notifications = {
  // --- Local notifications ---

  // Android only — iOS handles permission via requestPermission() below.
  async canScheduleExactAlarms(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    return NativeNotifications.canScheduleExactAlarms();
  },

  // Android only — iOS has no equivalent; permission is requested via requestPermission().
  async openExactAlarmSettings(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }
    return NativeNotifications.openExactAlarmSettings();
  },

  // iOS only — requests UNUserNotificationCenter permission.
  // Returns 'granted' or 'denied'.
  async requestPermission(): Promise<string> {
    if (Platform.OS !== 'ios') {
      return 'granted';
    }
    return NativeNotifications.requestPermission();
  },

  // Schedules a local notification. triggerInMs is delay from now in milliseconds.
  // Android: caller must ensure canScheduleExactAlarms() is true first.
  // iOS: caller must ensure requestPermission() returned 'granted' first.
  async schedule(
    id: number,
    title: string,
    body: string,
    triggerInMs: number,
  ): Promise<void> {
    if (Platform.OS === 'android') {
      const triggerAtMs = Date.now() + triggerInMs;
      return NativeNotifications.scheduleNotification(id, title, body, triggerAtMs);
    }
    return NativeNotifications.schedule(id, title, body, triggerInMs);
  },

  async cancel(id: number): Promise<void> {
    if (Platform.OS === 'android') {
      return NativeNotifications.cancelNotification(id);
    }
    return NativeNotifications.cancel(id);
  },

  // --- FCM push (Android only) ---

  // Returns the current FCM token from SharedPreferences, or null if not yet issued.
  // Prefer this over onToken() for initial token fetch — onNewToken fires during
  // app startup before the React bridge is ready, so the event may be missed.
  async getFcmToken(): Promise<string | null> {
    if (Platform.OS !== 'android') {
      return null;
    }
    return NativeNotifications.getFcmToken();
  },

  // Subscribe to FCM token refresh events (token rotation after first install).
  // Returns a subscription — call .remove() in cleanup.
  onToken(handler: (token: string) => void) {
    return emitter?.addListener('fcmToken', handler) ?? null;
  },

  // Subscribe to incoming FCM messages (foreground + data-only background).
  // Returns a subscription — call .remove() in cleanup.
  onMessage(handler: (message: FcmMessage) => void) {
    return emitter?.addListener('fcmMessage', handler) ?? null;
  },
};

export type FcmMessage = {
  messageId?: string;
  title?: string;
  body?: string;
  data?: Record<string, string>;
};

export default Notifications;
