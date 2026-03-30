import {NativeModules} from 'react-native';

const {SQLite: NativeSQLite} = NativeModules;

if (!NativeSQLite) {
  throw new Error(
    'SQLite native module is not available. ' +
      'Make sure SQLitePackage is registered in MainApplication.java (Android) ' +
      'and SQLiteModule is added to the Xcode target (iOS), ' +
      'then rebuild the app.',
  );
}

// Each row is a plain object with column names as keys.
// Values are string | number | null — SQLite's type affinity means
// integers come back as numbers, text as strings, and NULL as null.
export interface QueryResult {
  rows: Record<string, string | number | null>[];
  rowsAffected: number;
}

export interface SQLiteType {
  // Run any SQL statement with optional positional parameters.
  // Params map to ? placeholders in order. Returns matching rows
  // for SELECT, or empty rows + rowsAffected for INSERT/UPDATE/DELETE.
  execute(
    sql: string,
    params?: (string | number | null)[],
  ): Promise<QueryResult>;

  // Manual transaction control. Call beginTransaction(), then execute()
  // your statements, then commitTransaction() or rollbackTransaction().
  // If you don't commit, changes are lost when the connection closes.
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
}

const SQLite: SQLiteType = {
  execute: (sql: string, params?: (string | number | null)[]) =>
    NativeSQLite.execute(sql, params ?? []),

  beginTransaction: () => NativeSQLite.beginTransaction(),
  commitTransaction: () => NativeSQLite.commitTransaction(),
  rollbackTransaction: () => NativeSQLite.rollbackTransaction(),
};

export default SQLite;
