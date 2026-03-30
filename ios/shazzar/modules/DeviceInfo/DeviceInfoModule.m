#import <React/RCTBridgeModule.h>

// RCT_EXTERN_MODULE is used as an @interface declaration — not a standalone call.
// It tells RN's ObjC bridge that "AppDeviceInfo" is implemented by the Swift class DeviceInfoModule.
// RCT_EXTERN_METHOD registers each bridged method inside the @interface/@end block.
@interface RCT_EXTERN_MODULE(AppDeviceInfo, NSObject)

RCT_EXTERN_METHOD(
  getBatteryLevel:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
