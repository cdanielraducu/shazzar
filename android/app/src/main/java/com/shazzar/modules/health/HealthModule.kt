package com.shazzar.modules.health

import android.app.Activity
import android.content.Intent
import android.os.Build
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
// Coroutines — Kotlin's way of running async work without blocking threads.
// Health Connect's API uses "suspend" functions (like JS async functions) which
// can only be called from inside a coroutine. That's why DeviceInfo/Haptics don't
// need this — their Android APIs are synchronous (return a value immediately).
// CoroutineScope(Dispatchers.IO).launch { ... } is roughly equivalent to:
//   DispatchQueue.global().async { ... }  (Swift/iOS)
//   new Promise((resolve) => { ... })     (JS, conceptually)
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant

// ActivityEventListener — the old-bridge pattern for getting results back from
// another Activity (screen). Modern Android uses registerForActivityResult(),
// but that requires an Activity/Fragment lifecycle owner. RN native modules
// don't have one, so we fall back to the older startActivityForResult() +
// onActivityResult() callback pair.
class HealthModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    companion object {
        // Arbitrary ID to match our request in onActivityResult.
        // When the Health Connect permission screen closes, Android calls
        // onActivityResult with this code so we know it's ours.
        private const val REQUEST_CODE = 9001
    }

    // The set of Health Connect permissions we want. Each is a string like
    // "android.permission.health.READ_STEPS". We only ask for step-count
    // read access for now — expand this set to add more data types later.
    private val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class)
    )

    // An ActivityResultContract that knows how to create the permission
    // request Intent and parse the result. We use it manually (createIntent +
    // parseResult) instead of through registerForActivityResult — see note above.
    private val contract = PermissionController.createRequestPermissionResultContract()

    // Holds the JS Promise while the permission UI is open.
    // Nullable because there's only a pending promise between requestPermissions()
    // and onActivityResult(). If the user calls requestPermissions twice before
    // the first resolves, the first promise is lost — acceptable for now.
    private var permissionPromise: Promise? = null

    init {
        // Register this module to receive Activity results.
        // Without this, onActivityResult() would never be called.
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "Health"

    // Checks whether Health Connect is installed and available on this device.
    // Returns false on API < 26 (Health Connect minimum) or if the provider app is missing.
    @ReactMethod
    fun isAvailable(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.resolve(false)
            return
        }
        try {
            val status = HealthConnectClient.getSdkStatus(reactApplicationContext)
            promise.resolve(status == HealthConnectClient.SDK_AVAILABLE)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    // Launches the Health Connect permission UI for step-count read access.
    // Resolves to true if all requested permissions were granted, false otherwise.
    // Uses startActivityForResult + ActivityEventListener because the old RN bridge
    // doesn't support Jetpack Activity Result Contracts directly.
    @ReactMethod
    fun requestPermissions(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.reject("HEALTH_ERROR", "Health Connect requires Android 8.0 (API 26)+")
            return
        }

        val activity = currentActivity
        if (activity == null) {
            promise.reject("HEALTH_ERROR", "No activity available")
            return
        }

        permissionPromise = promise

        try {
            val intent = contract.createIntent(reactApplicationContext, permissions)
            activity.startActivityForResult(intent, REQUEST_CODE)
        } catch (e: Exception) {
            permissionPromise = null
            promise.reject("HEALTH_ERROR", "Failed to launch permission request: ${e.message}", e)
        }
    }

    // Reads total step count between two ISO-8601 instants (e.g. "2026-03-30T00:00:00Z").
    // Health Connect stores steps as individual StepsRecord entries — this sums them.
    @ReactMethod
    fun getSteps(startTime: String, endTime: String, promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.reject("HEALTH_ERROR", "Health Connect requires Android 8.0 (API 26)+")
            return
        }

        val client = try {
            HealthConnectClient.getOrCreate(reactApplicationContext)
        } catch (e: Exception) {
            promise.reject("HEALTH_ERROR", "Health Connect not available: ${e.message}", e)
            return
        }

        // readRecords() is a suspend function — it does I/O (reads from Health
        // Connect's content provider) and can't be called from a regular function.
        // CoroutineScope(Dispatchers.IO) creates a coroutine on the IO thread pool,
        // which is designed for blocking I/O. The JS thread is not blocked —
        // the promise resolves/rejects asynchronously when the coroutine finishes.
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = client.readRecords(
                    ReadRecordsRequest(
                        recordType = StepsRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(
                            Instant.parse(startTime),
                            Instant.parse(endTime)
                        )
                    )
                )
                val totalSteps = response.records.sumOf { it.count }
                promise.resolve(totalSteps.toDouble())
            } catch (e: Exception) {
                promise.reject("HEALTH_ERROR", "Failed to read steps: ${e.message}", e)
            }
        }
    }

    // Called by Android when the Health Connect permission screen closes.
    // This is the "callback" half of the startActivityForResult pattern.
    // Every Activity result in the app flows through here, so we filter
    // by REQUEST_CODE to only handle ours.
    override fun onActivityResult(
        activity: Activity?,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode != REQUEST_CODE) return

        val promise = permissionPromise ?: return
        permissionPromise = null

        // Don't trust resultCode — check granted permissions directly via the client.
        // The permission UI can close in various ways (back button, swipe, grant, deny);
        // the source of truth is always what the client reports as granted.
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = HealthConnectClient.getOrCreate(reactApplicationContext)
                val granted = client.permissionController.getGrantedPermissions()
                promise.resolve(granted.containsAll(permissions))
            } catch (e: Exception) {
                promise.reject("HEALTH_ERROR", "Failed to verify permissions: ${e.message}", e)
            }
        }
    }

    // Required by ActivityEventListener interface but unused here.
    // This fires when the app receives a new Intent while already running
    // (e.g. deep links) — not relevant for health permissions.
    override fun onNewIntent(intent: Intent?) {}
}
