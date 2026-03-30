import {NativeModules} from 'react-native';

const {Haptics: NativeHaptics} = NativeModules;

if (!NativeHaptics) {
  throw new Error(
    'Haptics native module is not available. ' +
      'Make sure HapticsPackage is registered in MainApplication.java (Android) ' +
      'and HapticsModule is added to the Xcode target (iOS), ' +
      'then rebuild the app.',
  );
}

// ImpactStyle maps to:
//   Android → VibrationEffect amplitude (approximation)
//   iOS     → UIImpactFeedbackGenerator.FeedbackStyle (semantic)
export type ImpactStyle = 'light' | 'medium' | 'heavy';

// NotificationType maps to:
//   Android → VibrationEffect predefined constants (approximation, API 29+)
//   iOS     → UINotificationFeedbackGenerator.FeedbackType (exact semantic match)
export type NotificationType = 'success' | 'warning' | 'error';

export interface HapticsType {
  impact(style: ImpactStyle): void;
  notification(type: NotificationType): void;
  selection(): void;
}

const Haptics: HapticsType = {
  // Triggers a physical impact sensation — use for button presses,
  // confirmations, or any gesture that implies a collision or snap.
  impact: (style: ImpactStyle) => NativeHaptics.impact(style),

  // Triggers a result-oriented haptic — use after an async operation
  // completes (form submit, save, network call) to communicate outcome.
  notification: (type: NotificationType) => NativeHaptics.notification(type),

  // Triggers a subtle selection tick — use when the user moves through
  // a list, picker, or toggle between discrete states.
  selection: () => NativeHaptics.selection(),
};

export default Haptics;
