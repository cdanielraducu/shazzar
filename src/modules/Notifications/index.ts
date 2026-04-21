import {NativeModules, Platform} from 'react-native';

const {Notifications: NativeNotifications} = NativeModules;

const Notifications = {
  async canScheduleExactAlarms(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    return NativeNotifications.canScheduleExactAlarms();
  },

  async openExactAlarmSettings(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }
    return NativeNotifications.openExactAlarmSettings();
  },

  // Schedules a local notification. triggerInMs is delay from now in milliseconds.
  // Caller must ensure canScheduleExactAlarms() is true before calling this.
  async schedule(id: number, title: string, body: string, triggerInMs: number): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }
    const triggerAtMs = Date.now() + triggerInMs;
    return NativeNotifications.scheduleNotification(id, title, body, triggerAtMs);
  },

  async cancel(id: number): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }
    return NativeNotifications.cancelNotification(id);
  },
};

export default Notifications;
