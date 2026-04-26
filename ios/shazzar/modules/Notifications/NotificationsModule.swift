import Foundation
import UserNotifications

@objc(Notifications)
class NotificationsModule: NSObject {

  // Requests notification permission from the user.
  // iOS requires explicit permission before any notification can be shown —
  // unlike Android where POST_NOTIFICATIONS is granted at install on API < 33.
  @objc func requestPermission(_ resolve: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
      if let error = error {
        reject("NOTIFICATION_ERROR", error.localizedDescription, error)
      } else {
        resolve(granted ? "granted" : "denied")
      }
    }
  }

  // Schedules a local notification to fire after triggerInMs milliseconds.
  // UNTimeIntervalNotificationTrigger fires once after the given interval —
  // no separate "exact alarm" permission needed on iOS.
  @objc func schedule(_ id: NSNumber,
                      title: String,
                      body: String,
                      triggerInMs: NSNumber,
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    content.sound = .default

    let triggerSeconds = triggerInMs.doubleValue / 1000.0
    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: triggerSeconds, repeats: false)
    let request = UNNotificationRequest(identifier: "\(id)", content: content, trigger: trigger)

    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        reject("NOTIFICATION_ERROR", error.localizedDescription, error)
      } else {
        resolve(nil)
      }
    }
  }

  // Cancels a pending notification by id.
  // removePendingNotificationRequests removes notifications not yet delivered —
  // removeDeliveredNotifications would remove ones already shown in the tray.
  @objc func cancel(_ id: NSNumber,
                    resolver resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["\(id)"])
    resolve(nil)
  }

  // Schedules a repeating notification at a fixed time of day.
  // UNCalendarNotificationTrigger with repeats: true lets the OS handle recurrence —
  // no re-scheduling needed after each fire, unlike Android's AlarmManager.
  @objc func scheduleRepeating(_ id: NSNumber,
                               title: String,
                               body: String,
                               hour: NSNumber,
                               minute: NSNumber,
                               frequency: String,
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    content.sound = .default

    var components = DateComponents()
    components.hour = hour.intValue
    components.minute = minute.intValue
    // For weekly, pin to the current weekday — fires same day each week.
    if frequency == "weekly" {
      components.weekday = Calendar.current.component(.weekday, from: Date())
    }

    let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
    let request = UNNotificationRequest(identifier: "\(id)", content: content, trigger: trigger)

    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        reject("NOTIFICATION_ERROR", error.localizedDescription, error)
      } else {
        resolve(nil)
      }
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }
}
