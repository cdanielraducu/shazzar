import {open} from '@op-engineering/op-sqlite';
import type {Transaction} from '@op-engineering/op-sqlite';

// op-sqlite opens a connection via JSI — C++ calls sqlite3 directly,
// no Java/ObjC layer, no thread restrictions.
const db = open({name: 'shazzar.db'});

export interface QueryResult {
  rows: Record<string, string | number | null>[];
  rowsAffected: number;
}

const SQLite = {
  // execute() is async — returns a Promise like our old module.
  // The difference: no HandlerThread, no thread restrictions. The C++ layer
  // handles threading internally — we just await the result.
  async execute(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<QueryResult> {
    const result = await db.execute(sql, params);
    return {
      rows: result.rows as Record<string, string | number | null>[],
      rowsAffected: result.rowsAffected,
    };
  },

  // transaction() wraps all execute() calls in a single atomic operation.
  // If fn throws, op-sqlite rolls back automatically — safer than our old
  // beginTransaction / commitTransaction / rollbackTransaction pattern where
  // a JS error between calls could leave the transaction open.
  async transaction(fn: (tx: Transaction) => Promise<void>): Promise<void> {
    await db.transaction(fn);
  },
};

export default SQLite;
