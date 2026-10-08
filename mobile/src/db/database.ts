import { Platform } from 'react-native';
import { Database, SqlJsMemoryDatabase } from './adapters/memoryAdapter';
import { runMigrations } from './migrations';

let dbInstance: Database | null = null;

export async function getDatabase(forceNewMemory = false): Promise<Database> {
  if (forceNewMemory) {
    const memDb = new SqlJsMemoryDatabase();
    await memDb.execAsync('PRAGMA foreign_keys = ON;');
    await runMigrations(memDb);
    return memDb;
  }

  if (dbInstance) return dbInstance;

  // Under Node.js / Jest or test runner
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    dbInstance = new SqlJsMemoryDatabase();
    await dbInstance.execAsync('PRAGMA foreign_keys = ON;');
    await runMigrations(dbInstance);
    return dbInstance;
  }

  // Under Web or Native Expo runtime
  try {
    const { ExpoSqliteDatabase } = require('./adapters/expoSqliteAdapter');
    const nativeDb = new ExpoSqliteDatabase('church_planning.db');
    await runMigrations(nativeDb);
    dbInstance = nativeDb;
  } catch (err) {
    console.warn('Fallback to memory sqlite adapter:', err);
    const memDb = new SqlJsMemoryDatabase();
    await runMigrations(memDb);
    dbInstance = memDb;
  }

  return dbInstance!;
}

export async function resetDatabaseForTesting(): Promise<Database> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
  return await getDatabase(true);
}

export * from './adapters/memoryAdapter';
export * from './migrations';
