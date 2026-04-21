import {Linking, PermissionsAndroid, Platform} from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

// Android 13+ requires POST_NOTIFICATIONS as a runtime permission.
// Below API 33 it is granted automatically — no dialog shown.
async function requestNotificationsAndroid(): Promise<PermissionStatus> {
  if ((Platform.Version as number) < 33) {
    return 'granted';
  }

  const current = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  if (current) {
    return 'granted';
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  switch (result) {
    case PermissionsAndroid.RESULTS.GRANTED:
      return 'granted';
    case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
      return 'blocked';
    default:
      return 'denied';
  }
}

// iOS: UNUserNotificationCenter handles notification permissions natively.
// The system dialog only appears once — any subsequent denial is permanent.
// We use the react-native built-in alert mechanism here; actual UNUserNotificationCenter
// integration happens in Phase 8 when we build the full notification pipeline.
async function requestNotificationsIOS(): Promise<PermissionStatus> {
  // Placeholder until Phase 8 wires up UNUserNotificationCenter.
  // On iOS the permission request is tied to registering for notifications,
  // not a standalone PermissionsAndroid-style API.
  return 'unavailable';
}

export async function requestNotificationPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'android') {
    return requestNotificationsAndroid();
  }
  return requestNotificationsIOS();
}

// Opens the app's system settings page so the user can manually toggle permissions.
// Called when status is 'blocked' — the system dialog cannot be shown again.
export function openAppSettings(): Promise<void> {
  return Linking.openSettings();
}
