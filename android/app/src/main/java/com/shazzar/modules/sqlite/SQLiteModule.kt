package com.shazzar.modules.sqlite

import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

// Android ships with SQLite built in — no external dependency needed.
// android.database.sqlite wraps the C sqlite3 library and gives us
// SQLiteDatabase, which handles file creation, locking, and journaling.
// We use WAL (Write-Ahead Logging) journal mode for better concurrent
// read/write performance — reads don't block writes and vice versa.
class SQLiteModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SQLite"

    // Lazy-init the database — created on first use, not on module load.
    // getDatabasePath() puts it in the app's private data directory:
    //   /data/data/com.shazzar/databases/shazzar.db
    // This survives app restarts but is deleted on uninstall.
    private val db: SQLiteDatabase by lazy {
        val dbFile = reactApplicationContext.getDatabasePath("shazzar.db")
        dbFile.parentFile?.mkdirs()
        SQLiteDatabase.openOrCreateDatabase(dbFile, null).apply {
            // WAL mode: writes go to a separate log file instead of the main DB.
            // Readers see a consistent snapshot while a write is in progress.
            // Default journal mode is "delete" (rollback journal), which locks
            // the entire file during writes. WAL is strictly better for our use case.
            execSQL("PRAGMA journal_mode=WAL")
        }
    }

    // Executes any SQL statement with positional parameters.
    // For SELECT: returns { rows: [...], rowsAffected: 0 }
    // For INSERT/UPDATE/DELETE: returns { rows: [], rowsAffected: N }
    //
    // We detect SELECT vs mutation by checking if the SQL starts with SELECT.
    // This is a simplification — in theory you could have a CTE that starts
    // with WITH and returns rows — but it covers all practical cases for a
    // habit tracker. A more robust approach would use sqlite3_stmt_readonly()
    // but Android's Java wrapper doesn't expose that.
    @ReactMethod
    fun execute(sql: String, params: ReadableArray, promise: Promise) {
        try {
            val bindArgs = readableArrayToBindArgs(params)
            val trimmed = sql.trimStart().uppercase()

            if (trimmed.startsWith("SELECT") || trimmed.startsWith("PRAGMA")) {
                // rawQuery() returns a Cursor — Android's iterator over result rows.
                // Unlike iOS's sqlite3_step() loop, Cursor handles memory management
                // and column type detection for us.
                val cursor = db.rawQuery(sql, bindArgs.map { it?.toString() }.toTypedArray())
                val result = cursorToWritableArray(cursor)
                cursor.close()

                val response = Arguments.createMap()
                response.putArray("rows", result)
                response.putInt("rowsAffected", 0)
                promise.resolve(response)
            } else {
                // execSQL() for mutations. It doesn't return row count directly,
                // so we query changes() — SQLite's built-in function that returns
                // the number of rows modified by the last INSERT/UPDATE/DELETE.
                if (bindArgs.isEmpty()) {
                    db.execSQL(sql)
                } else {
                    db.execSQL(sql, bindArgs.toTypedArray())
                }

                // changes() returns rows affected by the most recent statement.
                // It's a connection-level counter, not transaction-level — safe
                // to call immediately after execSQL on the same thread.
                val changesCursor = db.rawQuery("SELECT changes()", null)
                var rowsAffected = 0
                if (changesCursor.moveToFirst()) {
                    rowsAffected = changesCursor.getInt(0)
                }
                changesCursor.close()

                val response = Arguments.createMap()
                response.putArray("rows", Arguments.createArray())
                response.putInt("rowsAffected", rowsAffected)
                promise.resolve(response)
            }
        } catch (e: Exception) {
            promise.reject("SQLITE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun beginTransaction(promise: Promise) {
        try {
            db.beginTransaction()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SQLITE_ERROR", e.message, e)
        }
    }

    // Android's transaction API requires setTransactionSuccessful() before
    // endTransaction() — otherwise endTransaction() rolls back automatically.
    // This is a safety mechanism: if your code crashes between begin and end,
    // the transaction rolls back instead of committing partial changes.
    @ReactMethod
    fun commitTransaction(promise: Promise) {
        try {
            db.setTransactionSuccessful()
            db.endTransaction()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SQLITE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun rollbackTransaction(promise: Promise) {
        try {
            // endTransaction() without setTransactionSuccessful() = rollback.
            db.endTransaction()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SQLITE_ERROR", e.message, e)
        }
    }

    // Converts RN's ReadableArray (the JS params array) to a List<Any?>.
    // ReadableArray is RN's bridge type for JS arrays — each element has
    // a dynamic type that we need to extract with the right getter.
    private fun readableArrayToBindArgs(params: ReadableArray): List<Any?> {
        val args = mutableListOf<Any?>()
        for (i in 0 until params.size()) {
            when {
                params.isNull(i) -> args.add(null)
                params.getType(i).name == "Number" -> args.add(params.getDouble(i))
                params.getType(i).name == "String" -> args.add(params.getString(i))
                else -> args.add(params.getString(i))
            }
        }
        return args
    }

    // Converts a Cursor (Android's query result iterator) to an RN WritableArray
    // of WritableMap objects — this becomes a JS array of objects.
    // Each row is { columnName: value, ... }.
    //
    // Cursor column types:
    //   FIELD_TYPE_NULL (0), FIELD_TYPE_INTEGER (1), FIELD_TYPE_FLOAT (2),
    //   FIELD_TYPE_STRING (3), FIELD_TYPE_BLOB (4)
    // We skip blobs — habit data is all text/numbers/null.
    private fun cursorToWritableArray(cursor: Cursor) = Arguments.createArray().apply {
        val columnNames = cursor.columnNames
        while (cursor.moveToNext()) {
            val row = Arguments.createMap()
            for (i in columnNames.indices) {
                when (cursor.getType(i)) {
                    Cursor.FIELD_TYPE_NULL -> row.putNull(columnNames[i])
                    Cursor.FIELD_TYPE_INTEGER -> row.putDouble(columnNames[i], cursor.getLong(i).toDouble())
                    Cursor.FIELD_TYPE_FLOAT -> row.putDouble(columnNames[i], cursor.getDouble(i))
                    Cursor.FIELD_TYPE_STRING -> row.putString(columnNames[i], cursor.getString(i))
                    // Blobs are binary data (images, files). We don't need them
                    // for a habit tracker, and RN's bridge doesn't have a binary
                    // type — you'd need to base64-encode. Skip for now.
                    else -> row.putNull(columnNames[i])
                }
            }
            pushMap(row)
        }
    }
}
