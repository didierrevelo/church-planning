import { Database } from '../adapters/memoryAdapter';
import { migration_001 } from './001_initial_schema';
import { migration_002 } from './002_song_chords_and_blackouts';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database) => Promise<void>;
  down?: (db: Database) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [
  migration_001,
  migration_002,
];

export async function runMigrations(db: Database): Promise<{ applied: number; currentVersion: number }> {
  // Ensure schema_migrations table exists (Table #18)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      appliedAt TEXT NOT NULL
    );
  `);

  const appliedRows = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_migrations ORDER BY version ASC;'
  );
  const appliedVersions = new Set(appliedRows.map((r) => r.version));

  let newlyApplied = 0;
  let currentVersion = appliedRows.length > 0 ? Math.max(...appliedRows.map((r) => r.version)) : 0;

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO schema_migrations (version, name, appliedAt) VALUES (?, ?, ?);',
        [migration.version, migration.name, new Date().toISOString()]
      );
      newlyApplied++;
      currentVersion = migration.version;
    }
  }

  return { applied: newlyApplied, currentVersion };
}
