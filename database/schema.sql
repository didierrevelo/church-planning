-- ============================================
-- CHURCH PLANNING APP - SCHEMA
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Tabla: Users
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  "isAdmin" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "fcmToken" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Ministries
CREATE TABLE IF NOT EXISTS "Ministry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Tabla: MinistryRoles
CREATE TABLE IF NOT EXISTS "MinistryRole" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "ministryId" TEXT NOT NULL REFERENCES "Ministry"(id),
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Tabla: UserMinistryRoles (relación usuario-ministerio-rol)
CREATE TABLE IF NOT EXISTS "UserMinistryRole" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "ministryId" TEXT NOT NULL REFERENCES "Ministry"(id),
  "ministryRoleId" TEXT NOT NULL REFERENCES "MinistryRole"(id),
  "isLeader" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("userId", "ministryId", "ministryRoleId")
);

-- Tabla: Services (Cultos)
CREATE TABLE IF NOT EXISTS "Service" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  time TEXT NOT NULL,
  type TEXT DEFAULT 'worship',
  status TEXT DEFAULT 'planned',
  notes TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Tabla: ServiceSegments (Orden del culto)
CREATE TABLE IF NOT EXISTS "ServiceSegment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "serviceId" TEXT NOT NULL REFERENCES "Service"(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  title TEXT NOT NULL,
  "durationMin" INTEGER,
  notes TEXT,
  "ministryId" TEXT REFERENCES "Ministry"(id),
  "responsibleId" TEXT REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Tabla: ServiceTeam (Equipo del servicio)
CREATE TABLE IF NOT EXISTS "ServiceTeam" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "serviceId" TEXT NOT NULL REFERENCES "Service"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "ministryId" TEXT NOT NULL REFERENCES "Ministry"(id),
  "ministryRoleId" TEXT NOT NULL REFERENCES "MinistryRole"(id),
  status TEXT DEFAULT 'pending',
  note TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("serviceId", "userId", "ministryRoleId")
);

-- Tabla: PositionRequests (Solicitudes de posiciones)
CREATE TABLE IF NOT EXISTS "PositionRequest" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "serviceId" TEXT NOT NULL REFERENCES "Service"(id) ON DELETE CASCADE,
  "ministryRoleId" TEXT NOT NULL REFERENCES "MinistryRole"(id),
  "userId" TEXT REFERENCES "User"(id),
  status TEXT DEFAULT 'pending',
  note TEXT,
  "requestedAt" TIMESTAMPTZ DEFAULT now(),
  "respondedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Songs (Canciones)
CREATE TABLE IF NOT EXISTS "Song" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "serviceId" TEXT NOT NULL REFERENCES "Service"(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  title TEXT NOT NULL,
  key TEXT,
  "lyricsUrl" TEXT,
  "sheetMusicUrl" TEXT,
  "youtubeLink" TEXT,
  "updatedById" TEXT REFERENCES "User"(id),
  "updatedAt" TIMESTAMPTZ DEFAULT now(),
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Tabla: SongHistory (Historial de cambios)
CREATE TABLE IF NOT EXISTS "SongHistory" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "songId" TEXT NOT NULL REFERENCES "Song"(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "modifiedById" TEXT REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Files (Archivos)
CREATE TABLE IF NOT EXISTS "File" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "serviceId" TEXT NOT NULL REFERENCES "Service"(id) ON DELETE CASCADE,
  "ministryId" TEXT REFERENCES "Ministry"(id),
  "uploadedById" TEXT NOT NULL REFERENCES "User"(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER NOT NULL,
  version INTEGER DEFAULT 1,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Notifications (Notificaciones)
CREATE TABLE IF NOT EXISTS "Notification" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  "referenceId" TEXT,
  "referenceType" TEXT,
  read BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES (para performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_service_date ON "Service"(date);
CREATE INDEX IF NOT EXISTS idx_service_segment_service ON "ServiceSegment"("serviceId");
CREATE INDEX IF NOT EXISTS idx_service_team_service ON "ServiceTeam"("serviceId");
CREATE INDEX IF NOT EXISTS idx_service_team_user ON "ServiceTeam"("userId");
CREATE INDEX IF NOT EXISTS idx_song_service ON "Song"("serviceId");
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS idx_file_service ON "File"("serviceId");

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ministry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MinistryRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserMinistryRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceSegment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceTeam" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PositionRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Song" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SongHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "File" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES (acceso completo para service_role)
-- ============================================
CREATE POLICY "Service role full access" ON "User" FOR ALL USING (true);
CREATE POLICY "Service role full access" ON "Ministry" FOR ALL USING (true);
CREATE POLICY "Service role full access" ON "MinistryRole" FOR ALL USING (true);
CREATE POLICY "Service role full access" ON "UserMinistryRole" FOR ALL USING (true);
CREATE POLICY "Service role full access" ON "Service" FOR ALL USING (true);
CREATE POLICY "Service role full access" ON "ServiceSegment" FOR ALL USING (true);
CREATE POLICY "Service role full access" ON "ServiceTeam" FOR ALL USING (true);
CREATE POLICY "Service role full access" ON "PositionRequest" FOR ALL USING (true);
CREATE POLICY "Service role full access" ON "Song" FOR ALL USING (true);
CREATE POLICY "Service role full access" ON "SongHistory" FOR ALL USING (true);
CREATE POLICY "Service role full access" ON "File" FOR ALL USING (true);
CREATE POLICY "Service role full access" ON "Notification" FOR ALL USING (true);

-- ============================================
-- FUNCTION: Auto-update updatedAt
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para auto-update
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ministry_updated_at BEFORE UPDATE ON "Ministry" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ministry_role_updated_at BEFORE UPDATE ON "MinistryRole" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_ministry_role_updated_at BEFORE UPDATE ON "UserMinistryRole" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_service_updated_at BEFORE UPDATE ON "Service" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_service_segment_updated_at BEFORE UPDATE ON "ServiceSegment" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_service_team_updated_at BEFORE UPDATE ON "ServiceTeam" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_position_request_updated_at BEFORE UPDATE ON "PositionRequest" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_song_updated_at BEFORE UPDATE ON "Song" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_file_updated_at BEFORE UPDATE ON "File" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
