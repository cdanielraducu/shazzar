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

### Phase 4 — CI/CD with Fastlane ✅
- Pre-commit hooks — lint, type-check, test gate (Husky + lint-staged)
- Fastlane setup for both platforms
- Android: full lanes (build, sign, deploy)
- iOS: lane structure scaffolded, signing deferred (`match` needs Apple Developer account)
- GitHub Actions integration
- Build versioning, changelogs, environment secrets
- TODO: generate release keystore and configure signing env vars (`ANDROID_KEYSTORE_PATH`, `ANDROID_STORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) — locally in `~/.zshrc` and as GitHub Actions secrets; base64-encode keystore for CI
- TODO: create Google Play service account, download JSON key, set `PLAY_STORE_JSON_KEY_PATH` — locally and as a GitHub Actions secret

### Phase 5 — Build Optimization ✅
- Hermes engine (understand it, not just enable it)
- ProGuard / R8 for Android APK size
- iOS dead code stripping, bitcode
- Bundle analysis

### Phase 6 — RN Upgrade + Architecture Migration ✅

#### SQLite — execSQL() restriction in the new architecture

On RN's new architecture, `execSQL()` with bind arguments is restricted by Android — the error is:
> "Queries can be performed using SQLiteDatabase query or rawQuery methods only"

**Why it happens:** The new arch runs native modules through a JSI interop layer that enforces stricter threading and API surface rules. `execSQL()` with params falls outside what the layer permits.

**The original (broken) approach:**
```kotlin
db.execSQL(sql, bindArgs.toTypedArray())          // restricted in new arch
val cursor = db.rawQuery("SELECT changes()", null) // separate round trip for row count
```
Two problems: restricted API, and `SELECT changes()` is a fragile connection-level counter that breaks if anything else touches the connection between the two calls.

**The correct approach — `compileStatement()`:**
```kotlin
val statement = db.compileStatement(sql)
bindArgs.forEachIndexed { i, arg ->
    when (arg) {
        null     -> statement.bindNull(i + 1)
        is Double -> statement.bindDouble(i + 1, arg)
        is String -> statement.bindString(i + 1, arg)
        else     -> statement.bindString(i + 1, arg.toString())
    }
}
val rowsAffected = statement.executeUpdateDelete() // returns count atomically
statement.close()
```

`compileStatement()` is what Android's documentation recommends for parameterized mutations. `executeUpdateDelete()` returns the affected row count atomically — no second query, no race condition. Typed binding (`bindString`, `bindDouble`, `bindNull`) is also safer than casting everything to `Any?`.

The new arch restriction is forcing better code — `compileStatement()` is the proper API, not a workaround.

Source: [Android SQLiteDatabase docs](https://developer.android.com/reference/android/database/sqlite/SQLiteDatabase#compileStatement(java.lang.String))
- Upgrade from RN 0.72 to latest
- Migrate old bridge native modules to new architecture
- Option A: **Turbo Modules** — official RN new arch (JSI-based, C++ codegen spec files)
- Option B: **Nitro Modules** (Marc Rousavy / `react-native-nitro`) — JSI-based, no C++ boilerplate, faster DX
- Compare both approaches on the same module (Haptics or HealthKit)
- Enable new architecture flags on Android and iOS

#### TurboModules vs Nitro — Deep Comparison

##### Where the spec lives

Both approaches start with a TypeScript file — but what gets generated from it is completely different.

For TurboModules, `NativeHaptics.ts` is read by RN's codegen at build time (`pod install` / Gradle sync) and produces `ShazzarSpec.h` — an ObjC++ header. The first line of that file is `#error This file must be compiled as Obj-C++` — which tells you everything. It's not a pure C++ file or a pure ObjC file. It's both at once, because it has to bridge two incompatible type systems.

For Nitro, `HapticFeedback.nitro.ts` is read by `nitrogen` and produces `HybridHapticFeedbackSpec.swift` — a pure Swift protocol. No ObjC. No `.h` file.

##### Why TurboModules generate ObjC++ but can't generate shared C++

This is the irony at the heart of TurboModules: they generate ObjC++ not because they want C++, but because they're forced into it. ObjC++ (`#import` + `class` in the same file) is the only way to hold both an ObjC object and a C++ JSI reference in one place. C++ is used as glue, not as an implementation language.

The `ObjCTurboModule` runtime — the class everything hinges on — was built around one assumption: your implementation is an ObjC object. There is no `CxxTurboModule` equivalent. So even if you wanted to write a TurboModule in shared C++, there is no runtime path for it. The codegen would have nothing to generate into.

Nitro's core class is `HybridObject` — a C++ class. Swift and Kotlin implementations are convenience wrappers on top of it. That's why Nitro can offer a shared C++ implementation path and TurboModules fundamentally cannot — it would require redesigning the entire runtime, not just the codegen.

##### The interoperability layer

In TurboModules, the interop lives inside `ShazzarSpec.h`. That single generated file contains:
- `@protocol NativeHapticsSpec` — the ObjC protocol your Swift class conforms to via `@objc` + `RCT_EXTERN_MODULE`
- `NativeHapticsSpecJSI` — a C++ class extending `ObjCTurboModule` that holds your ObjC object and forwards JSI calls to it as ObjC messages

The `.m` file (`HapticsModule.m`) exists solely to make your Swift class visible as an ObjC object — `RCT_EXTERN_MODULE` is the bridge. Without it, `ObjCTurboModule` has nothing to hold.

In Nitro, the interop lives in `HybridHapticFeedbackSpecSwift.hpp` — a pure C++ class generated by nitrogen. It holds a reference to your Swift object (`_swiftPart`) and calls it directly:

```cpp
inline void impact(const std::string& style) override {
  auto __result = _swiftPart.impact(style);
}
```

This works because of Swift 5.9 C++ interop — Swift can be called from C++ natively, with no ObjC layer in between. No `.m` file. No `@objc`. No `RCT_EXTERN_MODULE`.

TurboModules needed ObjC as a middleman because Swift 5.9 didn't exist when they were designed. Nitro was built after Swift 5.9 and exploits it from day one.

##### The runtime — what happens on every call

The runtime is what runs while your app is live. Every time JS calls `Haptics.impact("medium")`, this is what executes:

**TurboModule (iOS):**
1. JSI delivers the call to `NativeHapticsSpecJSI` (C++)
2. `ObjCTurboModule` looks up `"impact"` in its method table → finds `@selector(impact:)`
3. Unpacks the argument from `folly::dynamic` (a generic C++ container) → converts to `NSString`
4. Sends ObjC message `[hapticsModule impact:@"medium"]` via `objc_msgSend`
5. ObjC runtime does its selector lookup → reaches your Swift method

Steps 2–4 happen on every single call: a table lookup, a type unboxing, and a runtime ObjC dispatch.

**Nitro (iOS):**
1. JSI delivers the call to `HybridHapticFeedbackSpecSwift` (C++)
2. Calls `_swiftPart.impact(style)` directly — typed `const std::string&`, no boxing
3. Swift 5.9 interop routes it straight to `HapticFeedbackNitro.swift`

No method table lookup. No `folly::dynamic` unboxing. No ObjC dispatch. Direct C++ → Swift call.

**On Android, the same pattern applies — differently:**

TurboModules use JNI (Java Native Interface) — there's a method descriptor lookup and JVM type conversion on every call. Nitro generates a direct C++ JNI bridge (`JHybridHapticFeedbackSpec.cpp`) that's more efficient than what TurboModules produce.

##### Full comparison

| | TurboModule | Nitro |
|---|---|---|
| You write (spec) | `NativeHaptics.ts` | `HapticFeedback.nitro.ts` |
| Codegen tool | RN codegen | nitrogen |
| Generated spec | `ShazzarSpec.h` — ObjC++ header | `HybridHapticFeedbackSpec.swift` — Swift protocol |
| Interop layer | `NativeHapticsSpecJSI` inside `ShazzarSpec.h` — C++ class wrapping an ObjC protocol | `HybridHapticFeedbackSpecSwift.hpp` — pure C++ class calling Swift directly |
| You implement (iOS) | Swift + `@objc` + `.m` file | Pure Swift |
| You implement (Android) | Kotlin extending generated spec | Kotlin extending generated spec |
| Shared C++ implementation | Not possible — runtime has no C++ path | Yes — `shared/c++/` folder, one implementation for both platforms |
| Runtime core | `ObjCTurboModule` — built around ObjC objects | `HybridObject` — built around C++ objects |
| iOS method dispatch | ObjC message dispatch (`objc_msgSend`) — runtime lookup | Direct C++ virtual call — resolved at compile time |
| Android method dispatch | JNI method lookup + JVM type conversion | Direct C++ JNI bridge |
| Argument passing | Boxed through `folly::dynamic` — unboxed on every call | Typed C++ — no boxing |
| Synchronous methods | Possible but discouraged | Default |
| Module instances | Singleton — `TurboModuleRegistry.getEnforcing()` | Multiple — `NitroModules.createHybridObject()` |
| Registration (Android) | Manual `ReactPackage` + `MainApplication` | C++ autolinking via `ShazzarOnLoad.cpp` + cmake |
| Registration (iOS) | `RCT_EXTERN_MODULE` in `.m` file | `ShazzarAutolinking.swift` generated by nitrogen |
| Why ObjC++ appears | Forced — only way to hold ObjC + C++ JSI ref in one file | Doesn't appear — C++ talks to Swift directly |
| Could TurboModules use Swift 5.9 interop? | Technically yes, but `ObjCTurboModule` runtime would need a full rewrite — too costly given Nitro already exists | N/A — designed around it from day one |

##### The honest summary

TurboModules fixed the biggest problem with the old architecture: JSON serialization and the async message queue are gone — JSI gives JS a direct C++ reference to the module. That's a real, significant improvement.

But on iOS, TurboModules still carry an ObjC dispatch overhead because the architecture predates Swift 5.9. Nitro removes that overhead because it was built after Swift 5.9 existed.

The broader gap: TurboModules were designed around platform-native languages (ObjC/Java). Nitro was designed around C++ as the shared core, with Swift/Kotlin as thin wrappers. That architectural difference is why Nitro can share implementations across platforms and TurboModules cannot.

TurboModules is the official path with legacy constraints baked in. Nitro is what TurboModules would look like if designed today.

##### Build time vs runtime tradeoff

Nitro's Swift 5.9 C++ interop requires the compiler to generate bridging headers between Swift and C++ — extra work at build time. TurboModules generate ObjC++ headers, which compile faster than the C++ interop layer Nitro needs.

What Nitro improves is runtime performance, not build time.

The build time cost is a one-time hit per clean build. On incremental builds — changing only JS — neither approach adds cost, because the native layer doesn't recompile.

So the real tradeoff is:

- **Pay more at build time with Nitro, get faster method calls at runtime**
- For most modules, that's a bad trade — you build many times, but the runtime gain is only meaningful at high call frequencies

When Nitro is worth it:
- **Camera frame processor at 60fps** — JSI is called hundreds of times per second, every microsecond of dispatch overhead compounds
- **Audio processing, real-time sensors, animation drivers** — anything where JS drives native at frame rate

When Nitro is not worth it:
- **Haptics** — called once per user gesture, ObjC dispatch overhead is imperceptible
- **SQLite, DeviceInfo, Health** — infrequent calls, build time cost outweighs runtime gain
- Any module where the bottleneck is I/O or the native operation itself, not the JS→native dispatch

#### New Architecture — What Actually Changed

The three pillars all build on **JSI (JavaScript Interface)** — a C++ layer that lets JS hold direct references to native objects without JSON serialization or a message queue.

- **JSI** — removes the translation layer. JS calls native C++ objects directly. No marshalling, no async queue. Enables everything below.
- **Fabric** — new renderer built on JSI. The shadow tree (layout model) lives in C++ and is readable by JS synchronously. This means `measure()` returns immediately, layout-driven animations don't need a round trip, and `onLayout` is accurate. Fabric did NOT exist in the old arch — it requires JSI.
- **TurboModules** — native modules built on JSI. Lazy loaded (not all registered at startup), and can expose synchronous methods when needed.
- **Concurrent React** — the real threading benefit. React 18/19 can pause, interrupt, and prioritize renders. This was impossible with the old bridge (FIFO queue, renders couldn't be interrupted). Concurrent React only works correctly with Fabric + JSI underneath it.

### Phase 7 — Permissions ✅
- Full cross-platform runtime permission flows
- iOS `Info.plist` + Android `AndroidManifest.xml` config
- Request → denied → redirect to settings flow

### Phase 8 — Notifications (Push + Local)
- No wrappers, no third-party notification libraries
- **Push:** Android direct FCM SDK (Kotlin), iOS direct APNs (Swift) — needs Apple Developer account
- **Local:** scheduled/recurring notifications for habit reminders — `AlarmManager` + `NotificationManager` (Android), `UNUserNotificationCenter` (iOS)
- Bridge token registration and notification handling to JS manually

#### FCM push (Android)

Direct Firebase Messaging SDK — no RN wrapper.

- `google-services.json` in `android/app/` + `com.google.gms:google-services` classpath plugin wires up the Firebase project
- `firebase-bom` manages all Firebase SDK versions from one declaration — individual SDKs omit version numbers and inherit from the BOM
- `ShazzarFirebaseMessagingService` extends `FirebaseMessagingService` (a long-lived `Service`, not a `BroadcastReceiver` — FCM keeps a persistent connection to Google's servers)
  - `onNewToken` — called on first install and on token rotation; emits `fcmToken` event to JS
  - `onMessageReceived` — called for data messages and foreground notifications; emits `fcmMessage` event to JS
  - Background notification messages (title + body payload) are handled automatically by the FCM SDK and appear in the system tray without reaching `onMessageReceived`
- `RCTDeviceEventEmitter` is the RN mechanism for native → JS events without a direct method call; JS subscribes with `NativeEventEmitter`
- Service registered in `AndroidManifest.xml` with `com.google.firebase.MESSAGING_EVENT` intent filter — this is how FCM knows which service to deliver messages to

---

#### iOS local notifications (UNUserNotificationCenter)

- `UNUserNotificationCenter` is the single iOS API for all local notifications — no separate "exact alarm" permission needed; timing is handled by the framework
- Permission is required before any notification can show — iOS has enforced this since day one; Android only added `POST_NOTIFICATIONS` in API 33
- `UNTimeIntervalNotificationTrigger` fires once after a given interval in seconds — trigger time passed in milliseconds from JS, converted to seconds in Swift
- `UNNotificationRequest` takes an identifier string — we use the numeric id cast to String so `cancel()` can match it with `removePendingNotificationRequests`
- `removePendingNotificationRequests` cancels notifications not yet delivered; `removeDeliveredNotifications` removes ones already shown in the tray — `cancel()` only needs pending
- Wired via `RCT_EXTERN_MODULE` + `.m` bridging file — same pattern as all other iOS native modules in this project
- No equivalent of Android's `BootReceiver` needed — iOS suspends and resumes the notification schedule automatically; the OS owns the timer, not the app

---

#### AlarmManager — reboot survival

`AlarmManager` holds alarms in memory only. A device reboot wipes all registered alarms.

**The fix — `BootReceiver` + `SharedPreferences`:**
- `NotificationModule` persists each alarm (id, title, body, triggerAtMs) to `SharedPreferences` on `schedule()`, removes it on `cancel()`
- `BootReceiver` listens for `BOOT_COMPLETED`, reads the persisted alarms, and re-registers each one with `AlarmManager.setExactAndAllowWhileIdle()`
- Past-due alarms (triggerAtMs already elapsed at boot time) are skipped and removed — firing a stale habit reminder after reboot would confuse the user
- `RECEIVE_BOOT_COMPLETED` permission declared in `AndroidManifest.xml`

### Phase 9 — Deep Linking ✅
- Android App Links + iOS Universal Links
- `react-navigation` deep link config
- Testing: `adb shell am start` (Android), `xcrun simctl openurl` (iOS)

#### Custom URI scheme vs App Links / Universal Links

Custom URI scheme (`shazzar://`) was chosen over verified App Links (Android) and Universal Links (iOS) because both verified approaches require a hosted domain with a served verification file (`assetlinks.json` on Android, `apple-app-site-association` on iOS). No production domain is active yet. Custom schemes work immediately with no domain ownership required — the tradeoff is that any app can claim the same scheme, whereas verified links are tied to a domain you control.

#### Cold start vs warm start — two separate paths

React Navigation handles deep links through two completely different mechanisms depending on app state:

- **Cold start** (app not running): the URL arrives in the launch intent / `launchOptions`. React Navigation calls `Linking.getInitialURL()` once on mount to read it.
- **Warm start** (app running in foreground or background): the OS delivers the URL through a separate delegate path. On Android this is `onNewIntent` on `MainActivity`; on iOS this is `application(_:open:options:)` on `AppDelegate`. React Navigation listens via `Linking.addEventListener('url', handler)`.

Without the `application(_:open:options:)` method in `AppDelegate`, iOS warm-start URLs were silently dropped — `launchOptions` is only populated on cold start, so React Native never saw the URL.

#### Unknown route behaviour

When the URL scheme matches but the path has no configured screen:
- **Cold start**: React Navigation can't resolve the URL to a screen and initialises to the default navigator state (Home).
- **Warm start**: React Navigation receives the URL event, fails to match it, and does nothing — the user stays on whatever screen they were already on.

Same "no match" logic, different outcome depending on whether existing navigation state is present.

### Phase 10 — Zustand Migration ✅
- Migrate from Redux Toolkit to Zustand
- Compare DX, boilerplate, and performance between both approaches

#### State access — selectors vs direct store

Redux requires two hooks and an intermediate action dispatch:

```ts
const habits = useAppSelector(state => state.habits.items);
const dispatch = useAppDispatch();
dispatch(toggleHabit(id));
```

Zustand collapses this — state and actions live in the same store object, both accessed through one hook:

```ts
const habits = useHabitsStore(state => state.habits);
const toggleHabit = useHabitsStore(state => state.toggleHabit);
toggleHabit(id);
```

No `dispatch`, no action creator, no action type string. You call the function directly.

#### Re-render mechanism — same model, less ceremony

The cross-screen reactivity works the same way in both. `useHabitsStore(state => state.habits)` creates a subscription. When `set()` is called inside an action, Zustand compares the selected slice with `Object.is` — if it changed, subscribed components re-render. What's gone is the middleware layer: no action object travelling through a reducer, no `switch` on action type. `set()` is called directly inside the function defined in `create()`.

#### What was deleted

Removing Redux meant deleting:
- `configureStore` + `Provider` wrapper in `App.tsx`
- `habitsSlice.ts` — action creators, reducer, `createSlice`
- `hooks.ts` — `useAppSelector`, `useAppDispatch` typed wrappers
- `@reduxjs/toolkit` and `react-redux` packages

Replacing them with one file (`habitsStore.ts`) and one package (`zustand`).

#### When Redux is still the right choice

Zustand wins on boilerplate for simple, local state. Redux Toolkit is worth the overhead when you need: time-travel debugging (Redux DevTools), complex derived state across many slices (`createSelector`), middleware like `redux-saga` for side-effect orchestration, or a strict unidirectional data flow enforced by convention across a large team.

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
