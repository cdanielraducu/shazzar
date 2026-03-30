import {NativeModules} from 'react-native';

const {Health: NativeHealth} = NativeModules;

if (!NativeHealth) {
  throw new Error(
    'Health native module is not available. ' +
      'Make sure HealthPackage is registered in MainApplication.java (Android) ' +
      'and HealthModule is added to the Xcode target (iOS), ' +
      'then rebuild the app.',
  );
}

export interface HealthType {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  getSteps(startTime: string, endTime: string): Promise<number>;
}

const Health: HealthType = {
  // Check if Health Connect (Android) / HealthKit (iOS) is available on this device.
  // Returns false on Android < 8.0 or if Health Connect app is not installed.
  isAvailable: () => NativeHealth.isAvailable(),

  // Request permission to read step count data.
  // Opens the platform health permission UI. Resolves to true if granted.
  requestPermissions: () => NativeHealth.requestPermissions(),

  // Read total step count between two ISO-8601 timestamps.
  // e.g. getSteps("2026-03-30T00:00:00Z", "2026-03-30T23:59:59Z")
  getSteps: (startTime: string, endTime: string) =>
    NativeHealth.getSteps(startTime, endTime),
};

export default Health;
