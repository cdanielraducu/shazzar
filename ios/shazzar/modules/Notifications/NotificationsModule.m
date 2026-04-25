#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(Notifications, NSObject)

RCT_EXTERN_METHOD(requestPermission:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(schedule:(nonnull NSNumber *)id
                  title:(NSString *)title
                  body:(NSString *)body
                  triggerInMs:(nonnull NSNumber *)triggerInMs
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancel:(nonnull NSNumber *)id
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
