import Foundation

// AppNotificationListenerModule — iOS stub
//
// iOS has no equivalent of Android's NotificationListenerService.
// The iOS sandbox strictly prohibits apps from reading notifications posted
// by other apps — this is a fundamental OS-level restriction, not a missing
// API.  Apple has not provided any public framework for cross-app notification
// access as of iOS 18, and no relaxation is expected.
//
// This stub satisfies the JS interface contract so shared JS code can call
// these methods on both platforms.  All methods return safe defaults.
@objc(AppNotificationListener)
class AppNotificationListenerModule: NSObject {

  // Returns false — iOS never grants cross-app notification listener access.
  // TODO(ios): iOS has no equivalent of NotificationListenerService — cross-app
  //            notification access is not permitted on iOS.
  @objc func isEnabled(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    // TODO(ios): iOS has no equivalent of NotificationListenerService — cross-app
    //            notification access is not permitted on iOS.
    resolve(false)
  }

  // No-op — there is no notification listener settings screen on iOS.
  // TODO(ios): iOS has no equivalent of NotificationListenerService — cross-app
  //            notification access is not permitted on iOS.
  @objc func openSettings(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    // TODO(ios): iOS has no equivalent of NotificationListenerService — cross-app
    //            notification access is not permitted on iOS.
    resolve(nil)
  }

  // Returns 0 — no cross-app notification counts are available on iOS.
  // TODO(ios): iOS has no equivalent of NotificationListenerService — cross-app
  //            notification access is not permitted on iOS.
  @objc func getNotificationCount(
    _ packageName: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    // TODO(ios): iOS has no equivalent of NotificationListenerService — cross-app
    //            notification access is not permitted on iOS.
    resolve(0)
  }

  // No-op — there is nothing to clear on iOS.
  // TODO(ios): iOS has no equivalent of NotificationListenerService — cross-app
  //            notification access is not permitted on iOS.
  @objc func clearNotificationCount(
    _ packageName: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    // TODO(ios): iOS has no equivalent of NotificationListenerService — cross-app
    //            notification access is not permitted on iOS.
    resolve(nil)
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }
}
