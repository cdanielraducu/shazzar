import {NativeModules, Platform} from 'react-native';

// The string here must match getName() in DeviceInfoModule.kt
const {DeviceInfo: NativeDeviceInfo} = NativeModules;

if (!NativeDeviceInfo) {
  throw new Error(
    'DeviceInfo native module is not available. ' +
      'Make sure DeviceInfoPackage is registered in MainApplication.java ' +
      'and the app has been rebuilt.',
  );
}

export interface DeviceInfoType {
  // Constants — populated via getConstants() at module init, no bridge call at runtime
  model: string;
  osVersion: string;
  // Async — Promise-based bridge call
  getBatteryLevel(): Promise<number>;
}

const DeviceInfo: DeviceInfoType = {
  model: NativeDeviceInfo.MODEL,
  osVersion: NativeDeviceInfo.OS_VERSION,
  getBatteryLevel: () => NativeDeviceInfo.getBatteryLevel(),
};

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

export default DeviceInfo;
