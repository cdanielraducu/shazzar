package com.shazzar.modules.notifications

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class AppNotificationListenerPackage : BaseReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == "AppNotificationListener") AppNotificationListenerModule(reactContext) else null
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                "AppNotificationListener" to ReactModuleInfo(
                    "AppNotificationListener",
                    "AppNotificationListener",
                    false,
                    false,
                    false,
                    false,
                ),
            )
        }
    }
}
