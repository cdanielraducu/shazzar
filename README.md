# Shazzar

> From Akkadian — "to protect, to keep". The Babylonian name given to Daniel, rooted in devotion and steadfastness.

A bare-bones React Native app for building a devoted, intentional life — habit tracking with reminders, health data, and notifications. Portfolio project with real-app potential.

---

## Platform Strategy

- **Android** — fully implemented and working
- **iOS** — structure and configuration in place; signing and APNs deferred until Apple Developer account is active
- No Expo — bare React Native only
- Minimal third-party libraries — native/bare-bones wherever possible

---

## The Ralph Wiggum Loop

Every phase follows the same cycle: **Build → Break → Fix → Understand**. If Understand feels shaky, loop back to Build with a harder variation. Don't advance until the loop closes cleanly.

Run `/ralph` to start the next task.

---

## Learning Phases

Testing is baked into every phase (Jest unit tests + Appium E2E).

### Phase 1 — Project Foundation ✅
- Init bare React Native **0.72** project (no Expo)
- TypeScript from the start
- Folder structure that scales
- Understanding `/ios` and `/android` native folders

### Phase 2 — Native Modules (Old Bridge) ✅
- Write bridges from scratch using the **old architecture**
- iOS: Swift with `RCT_EXPORT_MODULE` / `RCT_EXPORT_METHOD`
- Android: Kotlin `ReactPackage` + `NativeModule`
- DeviceInfo — constants + async method ✅
- Haptics — impact, notification, selection ✅
- HealthKit (iOS) / Health Connect (Android) — requires minimal permissions implementation ✅
- SQLite — raw `execute(sql, params)`, transactions (`begin / commit / rollback`) ✅

### Phase 3 — Core App Scaffolding ✅
- `react-navigation` — tab navigator (Home, Settings) with nested stacks
- Screens: Home/Dashboard, Habit Detail, Add/Edit Habit, Settings
- Redux Toolkit for state management

### Phase 4 — CI/CD with Fastlane
- Pre-commit hooks — lint, type-check, test gate (Husky + lint-staged)
- Fastlane setup for both platforms
- Android: full lanes (build, sign, deploy)
- iOS: lane structure scaffolded, signing deferred (`match` needs Apple Developer account)
- GitHub Actions integration
- Build versioning, changelogs, environment secrets
- TODO: generate release keystore and configure signing env vars (`ANDROID_KEYSTORE_PATH`, `ANDROID_STORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) — locally in `~/.zshrc` and as GitHub Actions secrets; base64-encode keystore for CI
- TODO: create Google Play service account, download JSON key, set `PLAY_STORE_JSON_KEY_PATH` — locally and as a GitHub Actions secret

### Phase 5 — Build Optimization
- Hermes engine (understand it, not just enable it)
- ProGuard / R8 for Android APK size
- iOS dead code stripping, bitcode
- Bundle analysis

### Phase 6 — RN Upgrade + Architecture Migration
- Upgrade from RN 0.72 to latest
- Migrate old bridge native modules to new architecture
- Option A: **Turbo Modules** — official RN new arch (JSI-based, C++ codegen spec files)
- Option B: **Nitro Modules** (Marc Rousavy / `react-native-nitro`) — JSI-based, no C++ boilerplate, faster DX
- Compare both approaches on the same module (Haptics or HealthKit)
- Enable new architecture flags on Android and iOS

### Phase 7 — Permissions
- Full cross-platform runtime permission flows
- iOS `Info.plist` + Android `AndroidManifest.xml` config
- Request → denied → redirect to settings flow

### Phase 8 — Notifications (Push + Local)
- No wrappers, no third-party notification libraries
- **Push:** Android direct FCM SDK (Kotlin), iOS direct APNs (Swift) — needs Apple Developer account
- **Local:** scheduled/recurring notifications for habit reminders — `AlarmManager` + `NotificationManager` (Android), `UNUserNotificationCenter` (iOS)
- Bridge token registration and notification handling to JS manually

### Phase 9 — Deep Linking
- Android App Links + iOS Universal Links
- `react-navigation` deep link config
- Testing: `adb shell am start` (Android), `xcrun simctl openurl` (iOS)

### Phase 10 — Zustand Migration
- Migrate from Redux Toolkit to Zustand
- Compare DX, boilerplate, and performance between both approaches

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node | 20.18.2 |
| npm | 10.8.2 |
| Ruby | 3.4.1 |
| Java | 17 (OpenJDK) |
| Xcode | 26.2 |
| Android Studio | installed |

---

## Notes

- Apple Developer account ($99/year) needed for: iOS code signing (Fastlane `match`), APNs push notifications — planned for April 2026, required by Phase 8
- FCM on Android is free — only needs a Firebase project (no Play Console required)
- Play Store publish requires Google Play Developer account ($25 one-time)
- RN 0.72 chosen as baseline — last stable version with old architecture as default, clean starting point for architecture migration in Phase 6
- Android-first development; iOS on simulator until Apple Developer account is active
