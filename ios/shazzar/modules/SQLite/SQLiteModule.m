#import <React/RCTBridgeModule.h>

// Bridges the Swift SQLiteModule to RN's ObjC runtime.
// Method signatures must exactly match the Swift @objc signatures.

@interface RCT_EXTERN_MODULE(SQLite, NSObject)

RCT_EXTERN_METHOD(
  execute:(NSString *)sql
  params:(NSArray *)params
  resolve:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  beginTransaction:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  commitTransaction:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  rollbackTransaction:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
