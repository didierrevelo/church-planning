import { Database } from '../adapters/memoryAdapter';
import { Migration } from './index';

export const migration_002: Migration = {
  version: 2,
  name: '002_song_chords_and_blackouts',
  up: async (db: Database): Promise<void> => {
    await db.execAsync(`
      -- Add chord and tempo columns to songs table
      ALTER TABLE songs ADD COLUMN chordContent TEXT;
      ALTER TABLE songs ADD COLUMN bpm INTEGER;
      ALTER TABLE songs ADD COLUMN timeSignature TEXT DEFAULT '4/4';

      -- Add blackout dates for volunteer scheduling
      CREATE TABLE IF NOT EXISTS blackout_dates (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        reason TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
  },
};
