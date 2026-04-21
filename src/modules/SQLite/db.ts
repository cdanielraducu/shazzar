import SQLite from './index';

// Called once at app startup. Creates tables if they don't exist,
// then purges soft-deleted rows older than 30 days.
export function initDatabase(): void {
  createTables();
  purgeDeleted();
}

function createTables(): void {
  SQLite.execute(`
    CREATE TABLE IF NOT EXISTS habits (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      frequency  TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    )
  `);
}

// Hard-deletes rows that were soft-deleted more than 30 days ago.
// Runs synchronously on startup — the table will be small so this is fast.
function purgeDeleted(): void {
  SQLite.execute(
    `DELETE FROM habits WHERE deleted_at < datetime('now', ?)`,
    ['-30 days'],
  );
}

// Soft delete — sets deleted_at instead of removing the row.
// The row stays in the database for up to 30 days, recoverable until then.
export async function softDeleteHabit(id: string): Promise<void> {
  await SQLite.execute(
    `UPDATE habits SET deleted_at = datetime('now') WHERE id = ?`,
    [id],
  );
}

// Undo a soft delete — clears deleted_at, making the row visible again.
export async function restoreHabit(id: string): Promise<void> {
  await SQLite.execute(
    `UPDATE habits SET deleted_at = NULL WHERE id = ?`,
    [id],
  );
}

// Returns only live (non-deleted) habits.
export async function getLiveHabits(): Promise<
  {id: string; name: string; frequency: string}[]
> {
  const result = await SQLite.execute(
    `SELECT id, name, frequency FROM habits WHERE deleted_at IS NULL`,
  );
  return result.rows as {id: string; name: string; frequency: string}[];
}

// Returns soft-deleted habits still within the 30-day window.
export async function getDeletedHabits(): Promise<
  {id: string; name: string; deleted_at: string}[]
> {
  const result = await SQLite.execute(
    `SELECT id, name, deleted_at FROM habits
     WHERE deleted_at IS NOT NULL
     AND deleted_at >= datetime('now', '-30 days')
     ORDER BY deleted_at DESC`,
  );
  return result.rows as {id: string; name: string; deleted_at: string}[];
}
