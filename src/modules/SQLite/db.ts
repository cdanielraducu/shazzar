import SQLite from './index';
import {Habit} from '@/store/habitsStore';

export function initDatabase(): void {
  createTables();
  purgeDeleted();
}

function createTables(): void {
  SQLite.execute(`
    CREATE TABLE IF NOT EXISTS habits (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      frequency      TEXT NOT NULL,
      trigger_hour   INTEGER NOT NULL DEFAULT 9,
      trigger_minute INTEGER NOT NULL DEFAULT 0,
      data_source    TEXT NOT NULL DEFAULT 'none',
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at     TEXT
    )
  `);
}

function purgeDeleted(): void {
  SQLite.execute(
    `DELETE FROM habits WHERE deleted_at < datetime('now', ?)`,
    ['-30 days'],
  );
}

export async function getLiveHabits(): Promise<Habit[]> {
  const result = await SQLite.execute(
    `SELECT id, name, frequency, trigger_hour, trigger_minute, data_source
     FROM habits WHERE deleted_at IS NULL`,
  );
  return (
    result.rows as {
      id: string;
      name: string;
      frequency: string;
      trigger_hour: number;
      trigger_minute: number;
      data_source: string;
    }[]
  ).map(row => ({
    id: row.id,
    name: row.name,
    frequency: row.frequency as Habit['frequency'],
    triggerHour: row.trigger_hour,
    triggerMinute: row.trigger_minute,
    dataSource: row.data_source as Habit['dataSource'],
  }));
}

export async function insertHabit(habit: Habit): Promise<void> {
  await SQLite.execute(
    `INSERT INTO habits (id, name, frequency, trigger_hour, trigger_minute, data_source)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      habit.id,
      habit.name,
      habit.frequency,
      habit.triggerHour,
      habit.triggerMinute,
      habit.dataSource,
    ],
  );
}

export async function updateHabit(habit: Habit): Promise<void> {
  await SQLite.execute(
    `UPDATE habits
     SET name = ?, frequency = ?, trigger_hour = ?, trigger_minute = ?, data_source = ?
     WHERE id = ?`,
    [
      habit.name,
      habit.frequency,
      habit.triggerHour,
      habit.triggerMinute,
      habit.dataSource,
      habit.id,
    ],
  );
}

export async function softDeleteHabit(id: string): Promise<void> {
  await SQLite.execute(
    `UPDATE habits SET deleted_at = datetime('now') WHERE id = ?`,
    [id],
  );
}
