package com.shazzar.modules.haptics

import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class HapticsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "Haptics"

    // Resolves the Vibrator service across API levels.
    // VibratorManager is the modern API (API 31+).
    // Vibrator directly is the legacy path (API 26–30).
    private fun getVibrator(): Vibrator? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = reactApplicationContext
                .getSystemService(ReactApplicationContext.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            manager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            reactApplicationContext
                .getSystemService(ReactApplicationContext.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    // impact() maps to one-shot vibrations of different amplitudes.
    // VibrationEffect.createOneShot(durationMs, amplitude)
    // Amplitude range: 1–255. Android has no semantic "light/medium/heavy" API
    // so we approximate with amplitude values.
    @ReactMethod
    fun impact(style: String) {
        val amplitude = when (style) {
            "light"  -> 80
            "heavy"  -> 255
            else     -> 160  // medium (default)
        }
        val duration = when (style) {
            "light"  -> 10L
            "heavy"  -> 20L
            else     -> 15L
        }
        getVibrator()?.vibrate(
            VibrationEffect.createOneShot(duration, amplitude)
        )
    }

    // notification() uses predefined VibrationEffect constants (API 29+).
    // These are device-tuned patterns — the closest Android equivalent
    // to iOS UINotificationFeedbackGenerator.
    @ReactMethod
    fun notification(type: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val effectId = when (type) {
                "success" -> VibrationEffect.EFFECT_HEAVY_CLICK
                "warning" -> VibrationEffect.EFFECT_DOUBLE_CLICK
                "error"   -> VibrationEffect.EFFECT_TICK
                else      -> VibrationEffect.EFFECT_CLICK
            }
            getVibrator()?.vibrate(VibrationEffect.createPredefined(effectId))
        } else {
            // Fallback for API 26–28: pattern-based vibration
            val pattern = when (type) {
                "success" -> longArrayOf(0, 10, 50, 10)
                "warning" -> longArrayOf(0, 20, 40, 20)
                "error"   -> longArrayOf(0, 30, 30, 30, 30, 30)
                else      -> longArrayOf(0, 15)
            }
            @Suppress("DEPRECATION")
            getVibrator()?.vibrate(pattern, -1)
        }
    }

    // selection() is a subtle tick — the lightest available feedback.
    // Maps to EFFECT_TICK which is the standard Android selection haptic.
    @ReactMethod
    fun selection() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getVibrator()?.vibrate(
                VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK)
            )
        } else {
            getVibrator()?.vibrate(
                VibrationEffect.createOneShot(10, 60)
            )
        }
    }
}
