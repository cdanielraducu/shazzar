import Foundation
import UIKit

// @objc(DeviceInfo) exposes this class to Objective-C with the name "DeviceInfo"
// This name must match the first argument in RCT_EXTERN_MODULE in the .m file
@objc(DeviceInfo)
class DeviceInfoModule: NSObject {

  // constantsToExport is called once at bridge init — same concept as getConstants() on Android
  // Values land on the JS module object as plain properties, no bridge call at runtime
  @objc func constantsToExport() -> [AnyHashable: Any]! {
    return [
      // UIDevice.model returns "iPhone" / "iPad" — generic family, not specific model
      // Getting the exact model (e.g. "iPhone 15 Pro") requires sysctlbyname — out of scope here
      "MODEL": UIDevice.current.model,
      "OS_VERSION": UIDevice.current.systemVersion,
    ]
  }

  // Promise-based async — same contract as Android
  // Must be @objc so the ObjC bridge in the .m file can see it
  @objc func getBatteryLevel(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    // Battery monitoring is off by default — must be enabled before reading
    UIDevice.current.isBatteryMonitoringEnabled = true
    let level = UIDevice.current.batteryLevel

    // batteryLevel returns -1 when the value is unknown (e.g. simulator)
    if level < 0 {
      reject("BATTERY_ERROR", "Battery level unavailable on this device", nil)
      return
    }

    resolve(level)
  }

  // Tells RN whether this module needs to be initialised on the main thread
  // false = initialise on a background thread, which is fine for data-only modules
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
