#import <React/RCTBridgeModule.h>

// RCT_EXTERN_MODULE registers the Swift class with RN's ObjC bridge.
// RCT_EXTERN_METHOD declares each method so the bridge knows the signature.
// These macros must wrap an @interface/@end block — they are not standalone calls.
// The actual implementation lives entirely in HapticsModule.swift.

@interface RCT_EXTERN_MODULE(Haptics, NSObject)

RCT_EXTERN_METHOD(impact:(NSString *)style)

RCT_EXTERN_METHOD(notification:(NSString *)type)

RCT_EXTERN_METHOD(selection)

@end
