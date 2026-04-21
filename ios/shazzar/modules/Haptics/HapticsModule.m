// Swift TurboModules on iOS require ObjC++ bridging to import the codegen-generated
// NativeHapticsSpec protocol. Instead of an ObjC++ wrapper, we use RCT_EXTERN_MODULE
// which lets RN's new arch backward-compat layer promote this Swift module to a
// TurboModule automatically at runtime — still JSI-backed, no manual spec conformance.

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(Haptics, NSObject)

RCT_EXTERN_METHOD(impact:(NSString *)style)

RCT_EXTERN_METHOD(notification:(NSString *)type)

RCT_EXTERN_METHOD(selection)

@end
