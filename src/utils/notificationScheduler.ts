import {Platform} from 'react-native';
import Notifications from '@/modules/Notifications';
import {Habit} from '@/store/habitsStore';

// Maps a string habit id to a safe 32-bit notification id.
// habit.id is Date.now().toString() — 13 digits — so we mod by INT_MAX.
export function notificationIdFor(habitId: string): number {
  return Number(habitId) % 2147483647;
}

// Schedules (or replaces) a repeating notification for a habit.
// Checks permissions before scheduling — silently skips if not granted.
export async function scheduleHabitNotification(habit: Habit): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      const canSchedule = await Notifications.canScheduleExactAlarms();
      if (!canSchedule) {
        return;
      }
    } else {
      const status = await Notifications.requestPermission();
      if (status !== 'granted') {
        return;
      }
    }

    const body = habit.dataSource
      ? `Checking: ${habit.dataSource}`
      : 'Time to check in.';

    await Notifications.scheduleRepeating(
      notificationIdFor(habit.id),
      habit.name,
      body,
      habit.triggerHour,
      habit.triggerMinute,
      habit.frequency,
      habit.dataSource,
    );
  } catch (e) {
    console.error('[scheduler] scheduleHabitNotification failed', e);
  }
}

export async function cancelHabitNotification(habitId: string): Promise<void> {
  try {
    await Notifications.cancel(notificationIdFor(habitId));
  } catch (e) {
    console.error('[scheduler] cancelHabitNotification failed', e);
  }
}
