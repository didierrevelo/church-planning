import * as SQLite from 'expo-sqlite';
import { Database } from './memoryAdapter';

export class ExpoSqliteDatabase implements Database {
  private db: SQLite.SQLiteDatabase | null = null;
  private dbName: string;

  constructor(dbName = 'church_planning.db') {
    this.dbName = dbName;
  }

  async init(): Promise<void> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync(this.dbName);
      await this.db.execAsync('PRAGMA foreign_keys = ON;');
    }
  }

  async execAsync(sql: string): Promise<void> {
    await this.init();
    await this.db!.execAsync(sql);
  }

  async runAsync(sql: string, params: any[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    await this.init();
    const normalized = params.map((p) => {
      if (typeof p === 'boolean') return p ? 1 : 0;
      if (p === undefined) return null;
      return p;
    });
    const res = await this.db!.runAsync(sql, normalized);
    return { lastInsertRowId: res.lastInsertRowId, changes: res.changes };
  }

  async getAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await this.init();
    const normalized = params.map((p) => {
      if (typeof p === 'boolean') return p ? 1 : 0;
      if (p === undefined) return null;
      return p;
    });
    return await this.db!.getAllAsync<T>(sql, normalized);
  }

  async getFirstAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    await this.init();
    const normalized = params.map((p) => {
      if (typeof p === 'boolean') return p ? 1 : 0;
      if (p === undefined) return null;
      return p;
    });
    return await this.db!.getFirstAsync<T>(sql, normalized);
  }

  async withTransactionAsync<T>(fn: () => Promise<T>): Promise<T> {
    await this.init();
    return await this.db!.withTransactionAsync(fn);
  }

  async closeAsync(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}
