#import <React/RCTBridgeModule.h>

// Bridges the Swift HealthModule to RN's ObjC runtime.
// Method signatures must exactly match the Swift @objc signatures —
// the resolver/rejecter pattern is how RN maps to JS Promises.

@interface RCT_EXTERN_MODULE(Health, NSObject)

RCT_EXTERN_METHOD(
  isAvailable:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  requestPermissions:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  getSteps:(NSString *)startTime
  endTime:(NSString *)endTime
  resolve:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
