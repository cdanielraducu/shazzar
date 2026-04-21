import type {DB, QueryResult} from '@op-engineering/op-sqlite';

const mockDb: Partial<DB> = {
  execute: jest.fn(() =>
    Promise.resolve({rows: [], rowsAffected: 0} as QueryResult),
  ),
  executeSync: jest.fn(() => ({rows: [], rowsAffected: 0} as QueryResult)),
  transaction: jest.fn(async (fn: (tx: any) => Promise<void>) =>
    fn(mockDb),
  ),
  close: jest.fn(),
};

export const open = jest.fn(() => mockDb);
