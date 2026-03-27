#import <React/RCTBridgeModule.h>

// RCT_EXTERN_MODULE tells RN's ObjC bridge that a module named "DeviceInfo" exists
// and that it is implemented by the Swift class DeviceInfoModule (from the .swift file)
// Without this file, RN has no idea the Swift class exists
RCT_EXTERN_MODULE(DeviceInfo, NSObject)

// RCT_EXTERN_METHOD registers each bridged method — parameter labels must exactly
// match the Swift method signature
RCT_EXTERN_METHOD(
  getBatteryLevel:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)
