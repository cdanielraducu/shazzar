package com.shazzar.modules.haptics

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

// BaseReactPackage replaces ReactPackage for TurboModules (TurboReactPackage is deprecated).
// Instead of instantiating all modules upfront in createNativeModules(),
// it provides a ReactModuleInfoProvider so RN can lazy-load only the modules
// that are actually requested — a key TurboModule benefit.
class HapticsPackage : BaseReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == HapticsModule.NAME) HapticsModule(reactContext) else null
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                HapticsModule.NAME to ReactModuleInfo(
                    HapticsModule.NAME,   // name
                    HapticsModule.NAME,   // className
                    false,                // canOverrideExistingModule
                    false,                // needsEagerInit
                    false,                // isCxxModule
                    true,                 // isTurboModule  ← this is the key flag
                ),
            )
        }
    }
}
