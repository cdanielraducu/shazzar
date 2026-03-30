import Foundation

// SQLite3 is a C library that ships with iOS — no CocoaPod or framework needed.
// Unlike Android's SQLiteDatabase wrapper, iOS gives us the raw C API:
//   sqlite3_open(), sqlite3_prepare_v2(), sqlite3_step(), sqlite3_finalize()
// This means more manual work (binding params, stepping through rows, closing
// statements) but also full control and zero dependencies.
import SQLite3

@objc(SQLite)
class SQLiteModule: NSObject {

  // The database connection pointer. In C, sqlite3* is an opaque pointer —
  // Swift represents it as OpaquePointer. All operations go through this handle.
  // nil means the database hasn't been opened yet.
  private var db: OpaquePointer?

  // Lazy-open the database on first use. The file goes in the app's Documents
  // directory so it persists across app launches (but is deleted on uninstall).
  // SQLITE_OPEN_CREATE creates the file if it doesn't exist.
  // SQLITE_OPEN_READWRITE allows both reads and writes.
  private func getDb() throws -> OpaquePointer {
    if let db = db { return db }

    let fileManager = FileManager.default
    let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
    let dbURL = documentsURL.appendingPathComponent("shazzar.db")

    // sqlite3_open_v2 returns SQLITE_OK (0) on success.
    // The db pointer is set even on failure (for error reporting),
    // so we always need to check the return code.
    var dbPointer: OpaquePointer?
    let flags = SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE
    let result = sqlite3_open_v2(dbURL.path, &dbPointer, flags, nil)

    guard result == SQLITE_OK, let opened = dbPointer else {
      let errorMsg = dbPointer.flatMap { String(cString: sqlite3_errmsg($0)) } ?? "Unknown error"
      sqlite3_close(dbPointer)
      throw NSError(domain: "SQLiteModule", code: Int(result), userInfo: [
        NSLocalizedDescriptionKey: "Failed to open database: \(errorMsg)"
      ])
    }

    // Enable WAL journal mode for better concurrent read/write performance.
    // Same reason as Android — reads don't block writes.
    sqlite3_exec(opened, "PRAGMA journal_mode=WAL", nil, nil, nil)

    db = opened
    return opened
  }

  // Executes any SQL statement with optional positional parameters.
  // The flow is: prepare → bind → step → collect → finalize.
  //
  // prepare: compiles the SQL string into a bytecode program (sqlite3_stmt).
  // bind: attaches parameter values to ? placeholders.
  // step: runs the bytecode one row at a time (SQLITE_ROW = got a row, SQLITE_DONE = finished).
  // finalize: frees the compiled statement. MUST be called or you leak memory.
  @objc func execute(
    _ sql: String,
    params: NSArray,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      let database = try getDb()

      // sqlite3_prepare_v2 compiles SQL into a statement. The -1 tells it
      // to read until the null terminator (the full string).
      var stmt: OpaquePointer?
      guard sqlite3_prepare_v2(database, sql, -1, &stmt, nil) == SQLITE_OK else {
        let error = String(cString: sqlite3_errmsg(database))
        reject("SQLITE_ERROR", "Prepare failed: \(error)", nil)
        return
      }

      defer { sqlite3_finalize(stmt) }

      // Bind parameters to ? placeholders. SQLite uses 1-based indexing
      // for parameters (first ? is index 1, not 0).
      for i in 0..<params.count {
        let paramIndex = Int32(i + 1)
        let value = params[i]

        if value is NSNull {
          sqlite3_bind_null(stmt, paramIndex)
        } else if let text = value as? String {
          // SQLITE_TRANSIENT (-1 cast to a destructor pointer) tells SQLite
          // to make its own copy of the string. Without this, SQLite would
          // hold a pointer to Swift-managed memory that could be freed.
          sqlite3_bind_text(stmt, paramIndex, text, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        } else if let number = value as? NSNumber {
          // NSNumber can hold int or double. Check if it's a floating point
          // value by comparing its objCType. "d" = double, "f" = float.
          let objCType = String(cString: number.objCType)
          if objCType == "d" || objCType == "f" {
            sqlite3_bind_double(stmt, paramIndex, number.doubleValue)
          } else {
            sqlite3_bind_int64(stmt, paramIndex, number.int64Value)
          }
        } else {
          sqlite3_bind_null(stmt, paramIndex)
        }
      }

      // Step through results. For SELECT, each step returns SQLITE_ROW
      // until there are no more rows (SQLITE_DONE). For INSERT/UPDATE/DELETE,
      // the first step returns SQLITE_DONE immediately.
      var rows: [[String: Any]] = []
      let columnCount = sqlite3_column_count(stmt)

      while sqlite3_step(stmt) == SQLITE_ROW {
        var row: [String: Any] = [:]
        for col in 0..<columnCount {
          let name = String(cString: sqlite3_column_name(stmt, col))
          switch sqlite3_column_type(stmt, col) {
          case SQLITE_NULL:
            row[name] = NSNull()
          case SQLITE_INTEGER:
            row[name] = sqlite3_column_int64(stmt, col)
          case SQLITE_FLOAT:
            row[name] = sqlite3_column_double(stmt, col)
          case SQLITE_TEXT:
            row[name] = String(cString: sqlite3_column_text(stmt, col))
          default:
            // SQLITE_BLOB — skip for now, same as Android.
            row[name] = NSNull()
          }
        }
        rows.append(row)
      }

      // sqlite3_changes() returns rows affected by the most recent
      // INSERT/UPDATE/DELETE on this connection. Returns 0 for SELECT.
      let rowsAffected = sqlite3_changes(database)

      resolve([
        "rows": rows,
        "rowsAffected": rowsAffected
      ])
    } catch {
      reject("SQLITE_ERROR", error.localizedDescription, error)
    }
  }

  @objc func beginTransaction(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      let database = try getDb()
      // BEGIN TRANSACTION is standard SQL. Unlike Android's beginTransaction()
      // which uses a Java API, here we just execute raw SQL.
      guard sqlite3_exec(database, "BEGIN TRANSACTION", nil, nil, nil) == SQLITE_OK else {
        let error = String(cString: sqlite3_errmsg(database))
        reject("SQLITE_ERROR", "Begin transaction failed: \(error)", nil)
        return
      }
      resolve(nil)
    } catch {
      reject("SQLITE_ERROR", error.localizedDescription, error)
    }
  }

  @objc func commitTransaction(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      let database = try getDb()
      guard sqlite3_exec(database, "COMMIT", nil, nil, nil) == SQLITE_OK else {
        let error = String(cString: sqlite3_errmsg(database))
        reject("SQLITE_ERROR", "Commit failed: \(error)", nil)
        return
      }
      resolve(nil)
    } catch {
      reject("SQLITE_ERROR", error.localizedDescription, error)
    }
  }

  @objc func rollbackTransaction(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      let database = try getDb()
      guard sqlite3_exec(database, "ROLLBACK", nil, nil, nil) == SQLITE_OK else {
        let error = String(cString: sqlite3_errmsg(database))
        reject("SQLITE_ERROR", "Rollback failed: \(error)", nil)
        return
      }
      resolve(nil)
    } catch {
      reject("SQLITE_ERROR", error.localizedDescription, error)
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
