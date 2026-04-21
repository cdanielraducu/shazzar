import 'react-native-gesture-handler/jestSetup';
import {TurboModuleRegistry, NativeModules} from 'react-native';

// NativeModules are empty in Jest — mock any module that throws on missing.
NativeModules.AppDeviceInfo = {
  MODEL: 'Jest',
  OS_VERSION: '0.0',
  getBatteryLevel: jest.fn(() => Promise.resolve(1)),
};
NativeModules.Health = {
  isAvailable: jest.fn(() => Promise.resolve(false)),
  requestPermissions: jest.fn(() => Promise.resolve(false)),
  getSteps: jest.fn(() => Promise.resolve(0)),
};

// TurboModuleRegistry.getEnforcing() throws in Jest because there is no native
// binary. Mock each TurboModule by name so tests can import modules that depend
// on them without crashing.
const originalGetEnforcing = TurboModuleRegistry.getEnforcing.bind(TurboModuleRegistry);
(TurboModuleRegistry as any).getEnforcing = (name: string) => {
  if (name === 'Haptics') {
    return {
      impact: jest.fn(),
      notification: jest.fn(),
      selection: jest.fn(),
    };
  }
  return originalGetEnforcing(name);
};
