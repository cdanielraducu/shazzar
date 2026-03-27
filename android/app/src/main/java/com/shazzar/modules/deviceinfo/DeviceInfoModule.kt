package com.shazzar.modules.deviceinfo

import android.os.BatteryManager
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DeviceInfoModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DeviceInfo"

    // getConstants() is called once at module init time.
    // Values are pushed into the JS module object immediately — JS reads them
    // as plain properties with no bridge call, no thread blocking, debugger safe.
    // Use this pattern for anything that is constant for the lifetime of the app.
    override fun getConstants(): Map<String, Any> = mapOf(
        "MODEL" to Build.MODEL,
        "OS_VERSION" to Build.VERSION.RELEASE
    )

    // Promise-based → async, does not block the JS thread
    // BatteryManager.getIntProperty is a system call — always treat I/O as async
    @ReactMethod
    fun getBatteryLevel(promise: Promise) {
        try {
            val batteryManager = reactApplicationContext
                .getSystemService(ReactApplicationContext.BATTERY_SERVICE) as BatteryManager
            val level = batteryManager
                .getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            promise.resolve(level / 100.0)
        } catch (e: Exception) {
            promise.reject("BATTERY_ERROR", e.message, e)
        }
    }
}
