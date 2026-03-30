import Foundation
import HealthKit

@objc(Health)
class HealthModule: NSObject {

  // Single shared instance — Apple docs require one HKHealthStore per app.
  // Creating multiple stores works but wastes resources and can cause
  // inconsistent authorization state.
  private let store = HKHealthStore()

  // The set of HealthKit types we want to read. Mirrors the Android side
  // which requests READ_STEPS via Health Connect. HealthKit uses HKQuantityType
  // identifiers instead of permission strings.
  private let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!

  // Checks whether HealthKit is available on this device.
  // Returns false on iPad (HealthKit is iPhone-only) and on simulators
  // without health data support. Equivalent to Android's getSdkStatus().
  @objc func isAvailable(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(HKHealthStore.isHealthDataAvailable())
  }

  // Requests read permission for step count data.
  // Opens the HealthKit authorization sheet. Unlike Android where we can
  // check exact grant status, Apple's privacy model never reveals whether
  // the user denied a specific type — requestAuthorization succeeds even
  // if the user taps "Don't Allow". The only way to know is to try reading
  // data and see if you get results.
  // We resolve true if the authorization call itself succeeded (no error),
  // not whether the user actually granted access.
  @objc func requestPermissions(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard HKHealthStore.isHealthDataAvailable() else {
      reject("HEALTH_ERROR", "HealthKit is not available on this device", nil)
      return
    }

    // toShare: nil — we only read, never write health data.
    // read: the set of types we want read access to.
    store.requestAuthorization(toShare: nil, read: [stepType]) { success, error in
      if let error = error {
        reject("HEALTH_ERROR", "Authorization request failed: \(error.localizedDescription)", error)
        return
      }
      resolve(success)
    }
  }

  // Reads total step count between two ISO-8601 timestamps.
  // Uses HKStatisticsQuery with cumulativeSum — HealthKit aggregates all
  // step sources (Apple Watch, iPhone, third-party apps) and de-duplicates
  // automatically. This is the equivalent of summing StepsRecord entries
  // on Android's Health Connect.
  @objc func getSteps(
    _ startTime: String,
    endTime: String,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard HKHealthStore.isHealthDataAvailable() else {
      reject("HEALTH_ERROR", "HealthKit is not available on this device", nil)
      return
    }

    // JS Date.toISOString() outputs "2026-03-30T00:00:00.000Z" — fractional seconds
    // included. ISO8601DateFormatter needs explicit formatOptions to handle this.
    // We set the full option set rather than inserting, because the defaults
    // can conflict with withFractionalSeconds on some OS versions.
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(abbreviation: "UTC")

    // Also try without fractional seconds as a fallback
    let formatterNoFrac = DateFormatter()
    formatterNoFrac.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
    formatterNoFrac.locale = Locale(identifier: "en_US_POSIX")
    formatterNoFrac.timeZone = TimeZone(abbreviation: "UTC")

    guard let start = formatter.date(from: startTime) ?? formatterNoFrac.date(from: startTime) else {
      reject("HEALTH_ERROR", "Invalid startTime format — expected ISO-8601 (e.g. 2026-03-30T00:00:00Z)", nil)
      return
    }

    guard let end = formatter.date(from: endTime) ?? formatterNoFrac.date(from: endTime) else {
      reject("HEALTH_ERROR", "Invalid endTime format — expected ISO-8601 (e.g. 2026-03-30T23:59:59Z)", nil)
      return
    }

    let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

    // HKStatisticsQuery runs once and returns an aggregate.
    // .cumulativeSum tells HealthKit to add up all step samples in the range.
    // For quantity types that are discrete (like heart rate), you'd use
    // .discreteAverage or .discreteMax instead.
    let query = HKStatisticsQuery(
      quantityType: stepType,
      quantitySamplePredicate: predicate,
      options: .cumulativeSum
    ) { _, result, error in
      // HealthKit returns an error when there are no samples for the query
      // (e.g. simulator, or user hasn't walked today). That's not a real
      // failure — just means 0 steps. Only reject on non-"no data" errors.
      if let error = error {
        let nsError = error as NSError
        // HKErrorCode 11 = noData — no samples exist for this range.
        // Resolve nil so JS can distinguish "no data" from "0 steps walked".
        if nsError.domain == "com.apple.healthkit" && nsError.code == 11 {
          resolve(nil)
          return
        }
        reject("HEALTH_ERROR", "Failed to read steps: \(error.localizedDescription)", error)
        return
      }

      // sumQuantity() returns nil if there are no samples in the range —
      // that's not an error, the user just didn't walk. Return 0.
      let steps = result?.sumQuantity()?.doubleValue(for: HKUnit.count()) ?? 0
      resolve(steps)
    }

    store.execute(query)
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
