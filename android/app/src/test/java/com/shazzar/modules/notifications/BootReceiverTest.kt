package com.shazzar.modules.notifications

import android.content.Context
import android.content.Intent
import androidx.test.core.app.ApplicationProvider
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class BootReceiverTest {

    private lateinit var context: Context

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
        // Clear prefs before each test
        context.getSharedPreferences("shazzar_alarms", Context.MODE_PRIVATE)
            .edit().clear().apply()
    }

    private fun putAlarm(id: Int, triggerAtMs: Long, hour: Int, minute: Int, frequency: String) {
        val alarm = JSONObject().apply {
            put("id", id)
            put("title", "Test")
            put("body", "Body")
            put("triggerAtMs", triggerAtMs)
            put("hour", hour)
            put("minute", minute)
            put("frequency", frequency)
        }
        context.getSharedPreferences("shazzar_alarms", Context.MODE_PRIVATE)
            .edit().putString(id.toString(), alarm.toString()).apply()
    }

    private fun getAlarm(id: Int): JSONObject? {
        val json = context.getSharedPreferences("shazzar_alarms", Context.MODE_PRIVATE)
            .getString(id.toString(), null) ?: return null
        return JSONObject(json)
    }

    @Test
    fun `weekly alarm past due advances by 7 days`() {
        // Put a weekly alarm that fired 1 day ago
        val oneDayAgo = System.currentTimeMillis() - 24 * 60 * 60 * 1000L
        putAlarm(1, oneDayAgo, hour = 9, minute = 0, frequency = "weekly")

        val receiver = BootReceiver()
        val intent = Intent(Intent.ACTION_BOOT_COMPLETED)
        receiver.onReceive(context, intent)

        val updated = getAlarm(1)
        assertNotNull("Alarm should still exist after weekly advancement", updated)
        val newTrigger = updated!!.getLong("triggerAtMs")
        assertTrue("New trigger must be in the future", newTrigger > System.currentTimeMillis())
        // Should be roughly 6 days from now (was 1 day ago, advances by 7)
        val sixDaysFromNow = System.currentTimeMillis() + 6 * 24 * 60 * 60 * 1000L
        assertTrue("New trigger should be ~6 days out (weekly - 1 day elapsed)", newTrigger > sixDaysFromNow - 2 * 60 * 60 * 1000L)
    }

    @Test
    fun `daily alarm past due advances by 1 day`() {
        val twoDaysAgo = System.currentTimeMillis() - 2 * 24 * 60 * 60 * 1000L
        putAlarm(2, twoDaysAgo, hour = 8, minute = 30, frequency = "daily")

        val receiver = BootReceiver()
        receiver.onReceive(context, Intent(Intent.ACTION_BOOT_COMPLETED))

        val updated = getAlarm(2)
        assertNotNull("Daily alarm should still exist", updated)
        val newTrigger = updated!!.getLong("triggerAtMs")
        assertTrue("New trigger must be in the future", newTrigger > System.currentTimeMillis())
        // Should be today or tomorrow at 08:30
        val oneDayFromNow = System.currentTimeMillis() + 24 * 60 * 60 * 1000L
        assertTrue("New trigger should be within 25h", newTrigger < oneDayFromNow + 60 * 60 * 1000L)
    }

    @Test
    fun `one-shot alarm past due is removed`() {
        val yesterday = System.currentTimeMillis() - 24 * 60 * 60 * 1000L
        // One-shot: hour = -1, minute = -1, frequency = ""
        val alarm = JSONObject().apply {
            put("id", 3)
            put("title", "One-shot")
            put("body", "Body")
            put("triggerAtMs", yesterday)
            put("hour", -1)
            put("minute", -1)
            put("frequency", "")
        }
        context.getSharedPreferences("shazzar_alarms", Context.MODE_PRIVATE)
            .edit().putString("3", alarm.toString()).apply()

        BootReceiver().onReceive(context, Intent(Intent.ACTION_BOOT_COMPLETED))

        assertNull("One-shot past alarm must be removed", getAlarm(3))
    }

    @Test
    fun `future alarm is not modified`() {
        val tomorrow = System.currentTimeMillis() + 24 * 60 * 60 * 1000L
        putAlarm(4, tomorrow, hour = 10, minute = 0, frequency = "daily")

        BootReceiver().onReceive(context, Intent(Intent.ACTION_BOOT_COMPLETED))

        val alarm = getAlarm(4)
        assertNotNull(alarm)
        assertEquals("Future trigger must not change", tomorrow, alarm!!.getLong("triggerAtMs"))
    }
}
