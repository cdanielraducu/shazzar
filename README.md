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

## Learning Phases

### Phase 1 — Project Foundation
- Init bare React Native **0.72** project (no Expo) ✅
- TypeScript from the start
- Folder structure that scales
- Understanding `/ios` and `/android` native folders

### Phase 2 — Native Modules (Old Bridge)
- Write bridges from scratch using the **old architecture**
- iOS: Swift with `RCT_EXPORT_MODULE` / `RCT_EXPORT_METHOD`
- Android: Kotlin `ReactPackage` + `NativeModule`
- Example: step counter / device info bridge
- Study an existing complex module to see the pattern at scale

### Phase 3 — CI/CD with Fastlane
- Fastlane setup for both platforms
- Android: full lanes (build, sign, deploy)
- iOS: lane structure scaffolded, signing deferred (`match` needs Apple Developer account)
- GitHub Actions integration
- Build versioning, changelogs, environment secrets

### Phase 4 — Build Optimization
- Hermes engine (understand it, not just enable it)
- ProGuard / R8 for Android APK size
- iOS dead code stripping, bitcode
- Bundle analysis

### Phase 5 — RN Upgrade + Architecture Migration
- Upgrade from RN 0.72 to latest
- Migrate old bridge native modules to new architecture
- Option A: **Turbo Modules** — official RN new arch (JSI-based, C++ codegen spec files)
- Option B: **Nitro Modules** (Marc Rousavy / `react-native-nitro`) — JSI-based, no C++ boilerplate, faster DX
- Compare both approaches on the same module
- Enable new architecture flags on Android and iOS

### Phase 6 — Permissions
- Cross-platform runtime permission flows
- iOS `Info.plist` + Android `AndroidManifest.xml` config
- Request → denied → redirect to settings flow

### Phase 7 — Push Notifications (bare-bones)
- No wrappers, no third-party notification libraries
- Android: direct FCM SDK integration via Kotlin native module (fully working)
- iOS: direct APNs integration via Swift native module (deferred — needs Apple Developer account)
- Bridge token registration and notification handling to JS manually

### Phase 8 — Deep Linking
- Android App Links + iOS Universal Links
- `react-navigation` deep link config
- Testing: `adb shell am start` (Android), `xcrun simctl openurl` (iOS)

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

- Apple Developer account ($99/year) needed for: iOS code signing (Fastlane `match`), APNs push notifications
- FCM on Android is free — only needs a Firebase project (no Play Console required)
- Play Store publish requires Google Play Developer account ($25 one-time)
- RN 0.72 chosen as baseline — last stable version with old architecture as default, clean starting point for architecture migration in Phase 5
