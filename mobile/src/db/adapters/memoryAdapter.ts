import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';

export interface Database {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: any[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
  withTransactionAsync<T>(fn: () => Promise<T>): Promise<T>;
  closeAsync(): Promise<void>;
}

export class SqlJsMemoryDatabase implements Database {
  private db: SqlJsDatabase | null = null;

  async init(): Promise<void> {
    if (!this.db) {
      const SQL = await initSqlJs();
      this.db = new SQL.Database();
      this.db.run('PRAGMA foreign_keys = ON;');
    }
  }

  async execAsync(sql: string): Promise<void> {
    await this.init();
    this.db!.run(sql);
  }

  async runAsync(sql: string, params: any[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    await this.init();
    // Normalize boolean / undefined params for SQLite
    const normalized = params.map((p) => {
      if (typeof p === 'boolean') return p ? 1 : 0;
      if (p === undefined) return null;
      return p;
    });
    this.db!.run(sql, normalized);
    const changesRes = this.db!.exec('SELECT changes() as c, last_insert_rowid() as id');
    let changes = 0;
    let lastInsertRowId = 0;
    if (changesRes.length > 0 && changesRes[0].values.length > 0) {
      changes = changesRes[0].values[0][0] as number;
      lastInsertRowId = changesRes[0].values[0][1] as number;
    }
    return { lastInsertRowId, changes };
  }

  async getAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await this.init();
    const normalized = params.map((p) => {
      if (typeof p === 'boolean') return p ? 1 : 0;
      if (p === undefined) return null;
      return p;
    });
    const stmt = this.db!.prepare(sql);
    stmt.bind(normalized);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return results;
  }

  async getFirstAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const list = await this.getAllAsync<T>(sql, params);
    return list.length > 0 ? list[0] : null;
  }

  async withTransactionAsync<T>(fn: () => Promise<T>): Promise<T> {
    await this.execAsync('BEGIN TRANSACTION;');
    try {
      const result = await fn();
      await this.execAsync('COMMIT;');
      return result;
    } catch (err) {
      await this.execAsync('ROLLBACK;');
      throw err;
    }
  }

  async closeAsync(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
