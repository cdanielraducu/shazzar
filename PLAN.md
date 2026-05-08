# Shazzar Plan

> Working backlog for the overnight agent and daily development.
> README.md is documentation — this file is the task surface.
> Agent rules: Android-first. iOS gets a stub with the correct interface + `// TODO(ios):` comments. Never touch main directly. One branch per task.

---

## Active

- [ ] Implement NotificationListenerService for cross-app notification reading
      priority: high | phase: 14 | added: 2026-05-08
      notes: Data source `"whatsapp"`, `"instagram"`, etc. Android full implementation.
             iOS has no equivalent — stub the JS interface with a clear TODO(ios) comment.
             Wire `dataSource` branch in `NotificationReceiver` to delegate to this service.
             Requires `BIND_NOTIFICATION_LISTENER_SERVICE` permission + user grant flow in Settings.

- [ ] Add weekly habit recurrence to BootReceiver past-due advancement logic
      priority: high | phase: 11-followup | added: 2026-05-08
      notes: BootReceiver currently advances past-due alarms by 24h. Weekly habits need 7-day
             advancement. Check `frequency` from SharedPreferences before computing next fire time.
             Add a unit test covering the weekly case across a reboot boundary.

- [ ] Remove FCM token debug UI from SettingsScreen
      priority: low | phase: 8-cleanup | added: 2026-05-08
      notes: `src/screens/SettingsScreen.tsx` — TODO comment already there.
             Remove the `getFcmToken` useEffect and any debug output state once FCM flow is
             confirmed stable. Verify nothing else depends on that state before deleting.

- [ ] Mark Phase 8 ✅ in README and audit remaining Android notification gaps
      priority: medium | phase: 8-close | added: 2026-05-08
      notes: Android FCM ✅, Android local ✅, iOS local ✅ (via UNUserNotificationCenter).
             iOS APNs push is blocked on Apple Developer account — not a code gap, a credential gap.
             Audit: does `NotificationReceiver` handle all `dataSource` values gracefully?
             Does cancelling a habit also cancel the AlarmManager entry in all edge cases?

- [ ] CI/CD: generate release keystore + configure Android signing env vars
      priority: medium | phase: 4-followup | added: 2026-05-08
      notes: README Phase 4 has the full TODO. Env vars needed:
             `ANDROID_KEYSTORE_PATH`, `ANDROID_STORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
             Base64-encode keystore for GitHub Actions secret. Document the steps taken in README.
             Do not commit the keystore file. Android-only — iOS signing needs Apple Dev account.

- [ ] Google Play: create service account + set PLAY_STORE_JSON_KEY_PATH
      priority: low | phase: 4-followup | added: 2026-05-08
      notes: README Phase 4. Needs Google Play Console access (user must do manually).
             Agent can scaffold the Fastlane lane config and document the steps,
             but cannot create the service account itself — flag this clearly in the PR.

---

## Blocked

- [ ] iOS APNs push notifications — full implementation
      blocked: Apple Developer account ($99/year) not yet active
      notes: Swift module structure is in place (`NotificationsModule.swift`).
             When unblocked: implement `didRegisterForRemoteNotificationsWithDeviceToken`,
             wire token to JS via RCTDeviceEventEmitter, handle `didReceiveRemoteNotification`.
             Fastlane `match` setup also lives here.

- [ ] iOS Notification Service Extension — live data at notification time
      blocked: Apple Developer account required for separate extension target signing
      notes: Android equivalent is `StepsFetchService` (ForegroundService).
             iOS path: `UNNotificationServiceExtension` intercepts push before display,
             reads HealthKit data, modifies notification content. Separate Xcode target.

---

## Done

- [x] Project Foundation (Phase 1)
      completed: 2026-01 | notes: bare RN 0.72, TypeScript, folder structure

- [x] Native Modules — Old Bridge (Phase 2)
      completed: 2026-01 | notes: DeviceInfo, Haptics, HealthKit/Health Connect, SQLite

- [x] Core App Scaffolding (Phase 3)
      completed: 2026-01 | notes: react-navigation tabs+stacks, screens, Redux Toolkit

- [x] CI/CD with Fastlane (Phase 4)
      completed: 2026-02 | notes: Husky, lint-staged, GitHub Actions, Android lanes, iOS scaffolded

- [x] Build Optimization (Phase 5)
      completed: 2026-02 | notes: Hermes, ProGuard/R8, bundle analysis

- [x] RN Upgrade + Architecture Migration (Phase 6)
      completed: 2026-02 | notes: RN latest, TurboModules vs Nitro deep-dive, new arch flags

- [x] Permissions (Phase 7)
      completed: 2026-03 | notes: runtime flows, denied→settings redirect, cross-platform

- [x] Notifications — Android FCM + local (Phase 8, partial)
      completed: 2026-03 | notes: FCM service, AlarmManager, BootReceiver, reboot survival

- [x] Deep Linking (Phase 9)
      completed: 2026-03 | notes: custom URI scheme, cold/warm start, react-navigation config

- [x] Zustand Migration (Phase 10)
      completed: 2026-03 | notes: replaced Redux Toolkit, selector pattern, Immer trade-offs

- [x] SQLite Persistence + Trigger Wiring (Phase 11)
      completed: 2026-04 | notes: soft delete, optimistic writes, notification scheduling on CRUD

- [x] Live data at notification time (Phase 12)
      completed: 2026-04 | notes: StepsFetchService, ForegroundService pattern, Health Connect gate

- [x] Claude-inspired design system (Phase 13)
      completed: 2026-05 | pr: #8
