import UIKit

@objc(Haptics)
class HapticsModule: NSObject {

  // iOS provides three distinct feedback generator classes — each must be
  // prepared before use. Preparation pre-warms the Taptic Engine, reducing
  // latency on first trigger. We instantiate lazily and prepare on demand.

  // impact() maps directly to UIImpactFeedbackGenerator.
  // iOS has semantic styles: light, medium, heavy (+ soft, rigid on newer devices).
  @objc func impact(_ style: String) {
    DispatchQueue.main.async {
      let feedbackStyle: UIImpactFeedbackGenerator.FeedbackStyle
      switch style {
      case "light":  feedbackStyle = .light
      case "heavy":  feedbackStyle = .heavy
      default:       feedbackStyle = .medium
      }
      let generator = UIImpactFeedbackGenerator(style: feedbackStyle)
      generator.prepare()
      generator.impactOccurred()
    }
  }

  // notification() maps to UINotificationFeedbackGenerator.
  // iOS natively supports success, warning, error — an exact semantic match
  // to what we expose in JS, unlike Android which requires approximation.
  @objc func notification(_ type: String) {
    DispatchQueue.main.async {
      let feedbackType: UINotificationFeedbackGenerator.FeedbackType
      switch type {
      case "success": feedbackType = .success
      case "warning": feedbackType = .warning
      case "error":   feedbackType = .error
      default:        feedbackType = .success
      }
      let generator = UINotificationFeedbackGenerator()
      generator.prepare()
      generator.notificationOccurred(feedbackType)
    }
  }

  // selection() maps to UISelectionFeedbackGenerator.
  // This is the subtlest feedback — intended for pickers, toggles,
  // and any UI element where the user moves through discrete values.
  @objc func selection() {
    DispatchQueue.main.async {
      let generator = UISelectionFeedbackGenerator()
      generator.prepare()
      generator.selectionChanged()
    }
  }

  // UIFeedbackGenerator subclasses must run on the main thread.
  // requiresMainQueueSetup = false means the module itself initialises
  // on a background thread — that's fine, because we dispatch UI calls
  // to main inside each method.
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
