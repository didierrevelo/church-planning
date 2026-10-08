import { getDatabase, resetDatabaseForTesting } from '../database';

describe('SQLite Schema & Migration Runner (Fase 1)', () => {
  beforeEach(async () => {
    await resetDatabaseForTesting();
  });

  it('runs migration 001 and creates all 18 tables', async () => {
    const db = await getDatabase();

    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC;"
    );

    const tableNames = tables.map((t) => t.name);

    const expectedTables = [
      'agent_runs',
      'blackout_dates',
      'churches',
      'files',
      'ministries',
      'ministry_roles',
      'notifications',
      'position_requests',
      'schema_migrations',
      'service_segments',
      'service_teams',
      'service_template_segments',
      'service_templates',
      'services',
      'song_history',
      'songs',
      'user_churches',
      'user_ministry_roles',
      'users',
    ];

    expect(expectedTables.every((t) => tableNames.includes(t))).toBe(true);
    expect(tableNames.length).toBeGreaterThanOrEqual(19);

    // Verify songs table has new columns from migration 002
    const songCols = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(songs);"
    );
    const colNames = songCols.map((c) => c.name);
    expect(colNames).toContain('chordContent');
    expect(colNames).toContain('bpm');
    expect(colNames).toContain('timeSignature');
  });

  it('is idempotent on multiple runs without error or duplicate records', async () => {
    const db = await getDatabase();
    const { runMigrations } = require('../migrations');
    const res = await runMigrations(db);
    expect(res.applied).toBe(0); // Already applied
  });
});
