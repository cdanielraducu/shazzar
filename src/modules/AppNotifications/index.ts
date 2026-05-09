import {NativeModules, NativeEventEmitter, Platform} from 'react-native';

export type AppNotification = {
  packageName: string;
  appName: string;
  title: string;
  text: string;
};

// Exported type for known app aliases
export type AppDataSource = 'whatsapp' | 'instagram' | 'telegram';

const {AppNotificationListener: NativeAppNotificationListener} = NativeModules;
const emitter = Platform.OS === 'android' ? new NativeEventEmitter() : null;

const AppNotificationListener = {
  async isEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    return NativeAppNotificationListener.isEnabled();
  },

  async openSettings(): Promise<void> {
    if (Platform.OS !== 'android') return;
    return NativeAppNotificationListener.openSettings();
  },

  async getNotificationCount(packageName: string): Promise<number> {
    if (Platform.OS !== 'android') return 0;
    return NativeAppNotificationListener.getNotificationCount(packageName);
  },

  async clearNotificationCount(packageName: string): Promise<void> {
    if (Platform.OS !== 'android') return;
    return NativeAppNotificationListener.clearNotificationCount(packageName);
  },

  onNotification(handler: (notification: AppNotification) => void) {
    return emitter?.addListener('onAppNotification', handler) ?? null;
  },
};

export default AppNotificationListener;
