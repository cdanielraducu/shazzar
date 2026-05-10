# Shazzar Plan

> Working backlog for the overnight agent and daily development.
> README.md is documentation — this file is the task surface.
> Agent rules: Android-first. iOS gets a stub with the correct interface + `// TODO(ios):` comments. Never touch main directly. One branch per task.

---

## Active

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

- [x] Remove FCM token debug UI from SettingsScreen
      completed: 2026-05-09 | pr: #TBD
      notes: Removed getFcmToken useEffect and TODO comment from SettingsScreen.tsx.
             `output` state and `log` helper retained — used by other buttons.
             `Notifications` import retained — used by other functions.

- [x] Mark Phase 8 ✅ in README and audit remaining Android notification gaps
      completed: 2026-05-09 | pr: #TBD
      notes: Phase 8 header marked ✅. Audit note added before Phase 9.
             NotificationReceiver: steps handled via StepsFetchService; all other dataSource values
             fall through to static body — graceful. cancelNotification() cancels AlarmManager entry
             and removes from SharedPreferences atomically — no edge cases found.

- [x] Implement NotificationListenerService for cross-app notification reading
      completed: 2026-05-09 | pr: #TBD
      notes: Android: AppNotificationListenerService (counts via SharedPreferences),
             AppNotificationListenerModule (isEnabled/openSettings/getNotificationCount/clearNotificationCount + onAppNotification event),
             AppNotificationListenerPackage. NotificationReceiver extended with whatsapp/instagram/telegram branch.
             iOS: stub with TODO(ios) comments — cross-app notification access not permitted on iOS.
             JS bridge: src/modules/AppNotifications/index.ts.

- [x] Add weekly habit recurrence to BootReceiver past-due advancement logic (unit test)
      completed: 2026-05-09 | pr: #12
      notes: Weekly logic (intervalDays = 7) was already implemented in BootReceiver.kt.
             Added Robolectric unit tests covering: weekly past-due (+7d), daily past-due (+1d),
             one-shot removal, and future alarm unchanged. Bootstrapped test infrastructure
             (testImplementation deps + testOptions in build.gradle).

- [x] CI/CD: generate release keystore + configure Android signing env vars
      completed: 2026-05-10 | pr: task/android-signing-setup
      notes: scripts/generate-keystore.sh — interactive keytool wrapper, prints base64 and secret
             names. README Phase 4 updated with full 5-step setup guide. ci.yml: new build-android
             job (main-push only, guarded by secrets), decodes ANDROID_KEYSTORE_B64 to temp file,
             runs fastlane android build, uploads AAB artifact. Fastfile unchanged — env var
             mapping was already correct. iOS signing deferred (needs Apple Developer account).
- [x] Google Play: create service account + set PLAY_STORE_JSON_KEY_PATH
      completed: 2026-05-10 | pr: task/play-store-fastlane-setup
      notes: Scaffolded — service account creation requires Google Play Console access (human step).
             Added scripts/setup-play-store.md with 7-step guide (Cloud project, API enable,
             service account + JSON key, Play Console permissions, env var, validate, ship).
             Fastfile: deploy lane now validates PLAY_STORE_JSON_KEY_PATH before uploading;
             build lane warns when signing env vars are missing; new validate_play_connection lane
             calls upload_to_play_store(validate_only: true). README Phase 4 TODO replaced with
             full Google Play section. .gitignore extended with service account JSON patterns.
