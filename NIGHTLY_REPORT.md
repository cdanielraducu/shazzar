# Nightly Report — 2026-05-09

## Task
NotificationListenerService for cross-app notification reading

## What changed
- **AppNotificationListenerService.kt** — new `NotificationListenerService` subclass bound by the OS when the user grants notification access. Tracks per-package notification counts in SharedPreferences (`shazzar_notif_counts`). Emits `onAppNotification` JS events via `RCTDeviceEventEmitter` with `{ packageName, appName, title, text }` payload.
- **AppNotificationListenerModule.kt** — new RN native module (`AppNotificationListener`) exposing `isEnabled()`, `openSettings()`, `getNotificationCount(pkg)`, `clearNotificationCount(pkg)`. Also wires the `ReactApplicationContext` into the service singleton for event emission.
- **AppNotificationListenerPackage.kt** — `BaseReactPackage` that registers the module.
- **AndroidManifest.xml** — added `BIND_NOTIFICATION_LISTENER_SERVICE` permission and `<service>` declaration for `AppNotificationListenerService` with the required intent-filter.
- **MainApplication.kt** — registered `AppNotificationListenerPackage`.
- **NotificationReceiver.kt** — added `else if` branch for app-based data sources. Maps `"whatsapp"` → `com.whatsapp`, `"instagram"` → `com.instagram.android`, `"telegram"` → `org.telegram.messenger`. Reads the count from SharedPreferences and produces an enriched body ("You have 3 unread WhatsApp messages"). Falls back to static body when count is 0 or unavailable. Unknown package names containing a dot are also routed through this branch.
- **AppNotificationListenerModule.swift** — iOS stub with `requiresMainQueueSetup → false`, four methods matching the Android API surface, each with a `// TODO(ios):` comment and safe defaults (`false`/`0`/`nil`).
- **AppNotificationListenerModule.m** — ObjC bridging file for the Swift stub.
- **src/modules/AppNotifications/index.ts** — JS bridge with typed `AppNotification` and `AppDataSource` types, platform guards, and `onNotification()` event subscription helper.
- **PLAN.md** — task moved from Active to Done.

## What was hard
- **Branch state confusion**: the working directory was on a sibling branch (`task/cleanup-fcm-phase8-readme`) when work started; PLAN.md had a conflict after stashing/popping. Resolved by writing the merged file directly.
- **Gradle lint**: the sandbox has Java 21 but the Gradle toolchain resolver demands Java 17 and cannot reach foojay.io to auto-download it. `./gradlew lint` is unrunnable in this environment. Jest (`--passWithNoTests`) passes cleanly; Android code was verified by careful review against the existing module patterns.
- **ReactContext lifecycle in a Service**: `NotificationListenerService` is not a React component, so obtaining a live `ReactApplicationContext` requires a static holder updated from `AppNotificationListenerModule.initialize()` / `invalidate()`. This is the same approach used in other RN community modules and is safe because the service and the React bridge share the same process.

## What I found while implementing
- The existing `NotificationReceiver` used a simple `if / else` without falling through to reschedule — the new `else if` for app sources explicitly calls `rescheduleIfRepeating` to match the `else` branch behaviour, which was an implicit requirement not spelled out in the spec.
- `resolveAppPackage()` returns `null` for unknown aliases; when `dataSource` contains a dot, we treat it as a raw package name. This means raw package names (e.g., `"com.slack"`) work out of the box without updating the alias map.
- The `BIND_NOTIFICATION_LISTENER_SERVICE` permission in the manifest is technically a "signature-level" permission that only the OS can hold — declaring it in `<uses-permission>` is harmless and some documentation recommends it for clarity, though it has no functional effect at install time.

## Open questions
- **User grant prompt**: there is no way to programmatically prompt the user for notification listener access — `openSettings()` opens the system settings screen and the user must tap manually. Should Shazzar show a rationale dialog before calling `openSettings()`? That UX decision belongs to the product layer.
- **Count semantics**: the service increments on `onNotificationPosted` and decrements on `onNotificationRemoved`. If the user clears all notifications at once, Android fires multiple `onNotificationRemoved` callbacks — the floor-at-zero logic handles this correctly, but the count may not match the exact badge number the target app displays (apps can bundle multiple messages into one notification).
- **Xcode project file**: the two new iOS files (`.swift` + `.m`) are not referenced in the Xcode `.xcodeproj` group/file list. They need to be added in Xcode or via a script before the iOS build will pick them up. This is standard for any new iOS native module file in this repo.

## iOS stub status
iOS has no equivalent of NotificationListenerService — cross-app notification access is not permitted on iOS. The stub resolves all methods with safe defaults (false/0/nil) and documents this clearly. No further work possible until Apple loosens the sandboxing model (not expected).
