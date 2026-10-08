import { Database } from '../adapters/memoryAdapter';

export const migration_001 = {
  version: 1,
  name: '001_initial_schema',
  up: async (db: Database): Promise<void> => {
    await db.execAsync(`
      -- 1. Tabla de Iglesias
      CREATE TABLE IF NOT EXISTS churches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        address TEXT,
        phone TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- 2. Tabla de Usuarios
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        salt TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        isSuperAdmin INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- 3. Membresía Usuario-Iglesia (Multi-tenant)
      CREATE TABLE IF NOT EXISTS user_churches (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        churchId TEXT NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        UNIQUE(userId, churchId)
      );

      -- 4. Ministerios
      CREATE TABLE IF NOT EXISTS ministries (
        id TEXT PRIMARY KEY,
        churchId TEXT NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- 5. Roles de Ministerios
      CREATE TABLE IF NOT EXISTS ministry_roles (
        id TEXT PRIMARY KEY,
        ministryId TEXT NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- 6. Asignaciones Usuario - Ministerio - Rol
      CREATE TABLE IF NOT EXISTS user_ministry_roles (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ministryId TEXT NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
        ministryRoleId TEXT NOT NULL REFERENCES ministry_roles(id) ON DELETE CASCADE,
        isLeader INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        UNIQUE(userId, ministryId, ministryRoleId)
      );

      -- 7. Servicios (Cultos)
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        churchId TEXT NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT DEFAULT '10:00',
        type TEXT DEFAULT 'worship',
        status TEXT DEFAULT 'planned',
        notes TEXT,
        templateId TEXT,
        createdBy TEXT NOT NULL REFERENCES users(id),
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- 8. Segmentos del Servicio
      CREATE TABLE IF NOT EXISTS service_segments (
        id TEXT PRIMARY KEY,
        serviceId TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        "order" INTEGER NOT NULL,
        title TEXT NOT NULL,
        durationMin INTEGER,
        notes TEXT,
        ministryId TEXT REFERENCES ministries(id) ON DELETE SET NULL,
        responsibleId TEXT REFERENCES users(id) ON DELETE SET NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- 9. Equipo del Servicio
      CREATE TABLE IF NOT EXISTS service_teams (
        id TEXT PRIMARY KEY,
        serviceId TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ministryId TEXT NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
        ministryRoleId TEXT NOT NULL REFERENCES ministry_roles(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending',
        note TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        UNIQUE(serviceId, userId, ministryRoleId)
      );

      -- 10. Solicitudes de Posición
      CREATE TABLE IF NOT EXISTS position_requests (
        id TEXT PRIMARY KEY,
        serviceId TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        ministryRoleId TEXT NOT NULL REFERENCES ministry_roles(id) ON DELETE CASCADE,
        userId TEXT REFERENCES users(id) ON DELETE SET NULL,
        status TEXT DEFAULT 'pending',
        note TEXT,
        requestedAt TEXT NOT NULL,
        respondedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- 11. Canciones
      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY,
        serviceId TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        "order" INTEGER NOT NULL,
        title TEXT NOT NULL,
        key TEXT,
        lyricsUrl TEXT,
        sheetMusicUrl TEXT,
        youtubeLink TEXT,
        updatedById TEXT REFERENCES users(id) ON DELETE SET NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- 12. Historial de Canciones
      CREATE TABLE IF NOT EXISTS song_history (
        id TEXT PRIMARY KEY,
        songId TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
        field TEXT NOT NULL,
        oldValue TEXT,
        newValue TEXT,
        modifiedById TEXT REFERENCES users(id) ON DELETE SET NULL,
        createdAt TEXT NOT NULL
      );

      -- 13. Archivos Locales
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        serviceId TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        ministryId TEXT REFERENCES ministries(id) ON DELETE SET NULL,
        uploadedById TEXT NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER NOT NULL,
        version INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- 14. Plantillas de Servicio
      CREATE TABLE IF NOT EXISTS service_templates (
        id TEXT PRIMARY KEY,
        churchId TEXT NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- 15. Segmentos de Plantilla
      CREATE TABLE IF NOT EXISTS service_template_segments (
        id TEXT PRIMARY KEY,
        templateId TEXT NOT NULL REFERENCES service_templates(id) ON DELETE CASCADE,
        "order" INTEGER NOT NULL,
        title TEXT NOT NULL,
        durationMin INTEGER,
        notes TEXT,
        ministryId TEXT REFERENCES ministries(id) ON DELETE SET NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- 16. Historial del Agente Inteligente
      CREATE TABLE IF NOT EXISTS agent_runs (
        id TEXT PRIMARY KEY,
        churchId TEXT NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        input TEXT,
        output TEXT,
        error TEXT,
        triggeredBy TEXT,
        createdAt TEXT NOT NULL,
        completedAt TEXT
      );

      -- 17. Notificaciones Locales
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        churchId TEXT NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        referenceId TEXT,
        referenceType TEXT,
        read INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      );

      -- Índices para alto rendimiento local
      CREATE INDEX IF NOT EXISTS idx_services_church_date ON services(churchId, date);
      CREATE INDEX IF NOT EXISTS idx_user_churches_church ON user_churches(churchId);
      CREATE INDEX IF NOT EXISTS idx_user_churches_user ON user_churches(userId);
      CREATE INDEX IF NOT EXISTS idx_songs_service ON songs(serviceId);
      CREATE INDEX IF NOT EXISTS idx_segments_service ON service_segments(serviceId);
      CREATE INDEX IF NOT EXISTS idx_team_service ON service_teams(serviceId);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_church ON notifications(userId, churchId, read);
    `);
  },
  down: async (db: Database): Promise<void> => {
    await db.execAsync(`
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS agent_runs;
      DROP TABLE IF EXISTS service_template_segments;
      DROP TABLE IF EXISTS service_templates;
      DROP TABLE IF EXISTS files;
      DROP TABLE IF EXISTS song_history;
      DROP TABLE IF EXISTS songs;
      DROP TABLE IF EXISTS position_requests;
      DROP TABLE IF EXISTS service_teams;
      DROP TABLE IF EXISTS service_segments;
      DROP TABLE IF EXISTS services;
      DROP TABLE IF EXISTS user_ministry_roles;
      DROP TABLE IF EXISTS ministry_roles;
      DROP TABLE IF EXISTS ministries;
      DROP TABLE IF EXISTS user_churches;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS churches;
    `);
  },
};
