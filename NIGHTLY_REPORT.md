# Nightly Report — 2026-05-09

## Task
Remove FCM debug UI + Mark Phase 8 ✅

## What changed
- `src/screens/SettingsScreen.tsx` — removed the `// TODO: remove once FCM token flow is verified` comment and the entire `useEffect` that called `Notifications.getFcmToken()` and `Notifications.onToken()`. Also removed `useEffect` from the React import (no longer used). The `output` state, `log` helper, and `Notifications` import were all retained — they are used by the rest of the component.
- `README.md` — changed `### Phase 8 — Notifications (Push + Local)` to include the ✅ checkmark. Added a `#### Phase 8 audit (2026-05-09)` section before Phase 9 covering FCM, local notifications (both platforms), iOS APNs credential gap, NotificationReceiver dataSource coverage, and habit cancellation correctness.
- `PLAN.md` — moved both tasks from `## Active` to `## Done` with `completed: 2026-05-09 | pr: #TBD`.

## What was hard
Nothing technically hard here. The main care required was confirming that removing `useEffect` from the import did not break anything else in the file (it did not — the component has no other effects). The audit required reading `NotificationReceiver.kt` and `NotificationModule.kt` carefully rather than summarising from memory.

## What I found while implementing

**NotificationReceiver.dataSource coverage:**
The receiver reads `dataSource` from SharedPreferences JSON at fire time. The only explicit branch is `"steps"` (case-insensitive) — this delegates to `StepsFetchService` which can perform a foreground Health Connect read. All other `dataSource` values (including `""`, `"none"`, and future values like `"whatsapp"`, `"instagram"`) fall through to `showNotification()` with the static body stored at scheduling time. This is graceful — no crash, no silent drop. The static body becomes the notification text. This is acceptable until Phase 14 adds `NotificationListenerService` branches.

**Habit cancellation edge cases:**
`cancelNotification()` in `NotificationModule.kt` does two things atomically from the caller's perspective: `alarmManager.cancel(pendingIntent)` removes the pending alarm from AlarmManager, and `removeAlarm(id)` removes the entry from SharedPreferences. The `PendingIntent` is constructed with the same request code (`id`) and `FLAG_UPDATE_CURRENT | FLAG_IMMUTABLE` — this matches the intent that was registered, so the cancel is guaranteed to hit the right alarm. BootReceiver will not re-register a cancelled alarm on the next reboot because the SharedPreferences entry is gone. No edge cases found.

One minor observation: `cancelNotification()` does not cancel a notification already delivered to the tray (`manager.cancel(id)` would be needed for that). For habit reminders this is intentional — a fired reminder stays visible until the user dismisses it.

## Open questions
- BootReceiver advances past-due alarms by 24h for all frequencies — weekly habits need 7-day advancement. This is a known gap tracked separately in PLAN.md (high priority, phase 11-followup).
- `NotificationListenerService` for cross-app data sources (`whatsapp`, `instagram`) is planned for Phase 14. The `dataSource` fall-through in `NotificationReceiver` is a placeholder for those branches.

## iOS stub status
N/A — both tasks are JS/docs cleanup. iOS local notifications are already fully stubbed in NotificationsModule.swift.
