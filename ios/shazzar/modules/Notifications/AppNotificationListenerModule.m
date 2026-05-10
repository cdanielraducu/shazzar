#import <React/RCTBridgeModule.h>

// ObjC bridge for the AppNotificationListenerModule Swift stub.
// iOS has no equivalent of Android's NotificationListenerService — cross-app
// notification access is not permitted on iOS.  All methods resolve with safe
// defaults (false / 0 / nil).  See AppNotificationListenerModule.swift for details.

@interface RCT_EXTERN_MODULE(AppNotificationListener, NSObject)

RCT_EXTERN_METHOD(isEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(openSettings:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getNotificationCount:(NSString *)packageName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearNotificationCount:(NSString *)packageName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
