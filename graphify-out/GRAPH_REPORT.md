# Graph Report - church-planning  (2026-10-07)

## Corpus Check
- 156 files · ~54,045 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1091 nodes · 1804 edges · 107 communities (56 shown, 51 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4880fa4b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- middleware/auth.ts
- shared/__tests__/validation.test.ts
- expo
- dependencies
- NativeFileStorage
- devDependencies
- AdminScreen.tsx
- compilerOptions
- schema.sql
- generateUUID
- api.ts
- compilerOptions
- types/index.ts
- LanTransportInterface
- MdnsDiscoveryInterface
- EmptyState
- components/index.ts
- Database
- segmentsRepository.ts
- devDependencies
- authAPI
- BackgroundJobQueue
- scripts
- ServiceCard.tsx
- dependencies
- MinistriesRepository
- SongsRepository
- TeamRepository
- UsersRepository
- AppNavigator.tsx
- server.ts
- ErrorBoundary.tsx
- DashboardScreen.tsx
- ExpoSqliteDatabase
- TemplatesRepository
- BackgroundJobQueue
- SearchScreen.tsx
- SqlJsMemoryDatabase
- NotificationsRepository
- SegmentsRepository
- ServicesRepository
- offlineCache.ts
- ResponsiveContainer.tsx
- SongsScreen.tsx
- reportsRepository.ts
- templatesRepository.ts
- crypto.ts
- CryptoService
- mutationQueue.ts
- songsRepository.ts
- MemberCard.tsx
- Toast.tsx
- FilesRepository
- searchRepository.ts
- vercel.json
- shared/validation/auth.ts
- backend/package.json
- push.ts
- metro.config.js
- SegmentItem.tsx
- AgentRepository
- seed.ts
- expo-print
- expo-secure-store
- ts-jest
- @types/bcryptjs
- @types/jest
- @types/jsonwebtoken
- @types/morgan
- @types/supertest
- @types/uuid
- typescript
- migrate.ts
- react-native
- @types/cors
- expo-image-manipulator
- expo-local-authentication
- routes/services.ts
- expo-notifications
- expo-print
- expo-secure-store
- expo-sharing
- expo-sqlite
- DashboardScreen.tsx
- @expo/vector-icons
- mobile/jest.config.js
- react-dom
- @react-native-async-storage/async-storage
- react-native-screens
- @react-navigation/bottom-tabs
- @react-navigation/native
- @react-navigation/native-stack
- yjs
- zod
- routes/churches.ts
- routes/ministries.ts
- routes/templates.ts
- songsRepository.ts
- BackgroundJobQueue
- routes/songs.ts
- expo
- @noble/hashes
- push.ts
- react-native-web
- jest

## God Nodes (most connected - your core abstractions)
1. `Database` - 43 edges
2. `generateUUID()` - 32 edges
3. `getDatabase()` - 25 edges
4. `AuthRequest` - 16 edges
5. `authenticate()` - 16 edges
6. `compilerOptions` - 15 edges
7. `requireChurch()` - 14 edges
8. `compilerOptions` - 14 edges
9. `Church Planning App - Guía de Producción (Costo Cero)` - 14 edges
10. `expo` - 13 edges

## Surprising Connections (you probably didn't know these)
- `AppContent()` --calls--> `getDatabase()`  [EXTRACTED]
  mobile/App.tsx → mobile/src/db/database.ts
- `ChordViewer()` --calls--> `parseChordPro()`  [EXTRACTED]
  mobile/src/components/ChordViewer.tsx → shared/domain/music.ts
- `ChordViewer()` --calls--> `transposeChord()`  [EXTRACTED]
  mobile/src/components/ChordViewer.tsx → shared/domain/music.ts
- `ChordViewer()` --calls--> `transposeKey()`  [EXTRACTED]
  mobile/src/components/ChordViewer.tsx → shared/domain/music.ts
- `assignTeamLocal()` --calls--> `generateUUID()`  [EXTRACTED]
  shared/domain/agent.ts → mobile/src/platform/crypto.ts

## Import Cycles
- None detected.

## Communities (107 total, 51 thin omitted)

### Community 0 - "middleware/auth.ts"
Cohesion: 0.14
Nodes (17): globalForPrisma, authenticate(), AuthRequest, memberUserSelect, publicUserSelect, requireChurch(), requireChurchAdmin(), requireSuperAdmin() (+9 more)

### Community 2 - "expo"
Cohesion: 0.05
Nodes (36): backgroundColor, foregroundImage, adaptiveIcon, package, permissions, expo, android, extra (+28 more)

### Community 3 - "dependencies"
Cohesion: 0.06
Nodes (35): @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcryptjs, cors, dotenv (+27 more)

### Community 4 - "NativeFileStorage"
Cohesion: 0.05
Nodes (10): FileStorageInterface, NativeFileStorage, WebFileStorage, LanTransportInterface, NativeLanTransport, PeerInfo, WebLanTransport, NativeSecureStorage (+2 more)

### Community 5 - "devDependencies"
Cohesion: 0.07
Nodes (28): @babel/core, devDependencies, @babel/core, jest, sql.js, ts-jest, @types/jest, @types/react (+20 more)

### Community 6 - "AdminScreen.tsx"
Cohesion: 0.12
Nodes (18): ToastContext, ToastContextType, useToast(), AdminScreen(), ChurchInfo, Member, styles, AgentRun (+10 more)

### Community 7 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowJs, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module (+17 more)

### Community 8 - "schema.sql"
Cohesion: 0.20
Nodes (23): "File", "Ministry", "MinistryRole", "Notification", "PositionRequest", "Service", "ServiceSegment", "ServiceTeam" (+15 more)

### Community 9 - "generateUUID"
Cohesion: 0.17
Nodes (15): getDatabase(), resetDatabaseForTesting(), runMigrations(), AgentRunRecord, NotificationRecord, DashboardReport, SearchResults, UserRecord (+7 more)

### Community 10 - "api.ts"
Cohesion: 0.16
Nodes (15): styles, adminAPI, agentAPI, filesAPI, ministriesAPI, notificationsAPI, positionsAPI, reportsAPI (+7 more)

### Community 11 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir (+12 more)

### Community 12 - "types/index.ts"
Cohesion: 0.14
Nodes (10): styles, styles, styles, styles, churchesAPI, Church, MinistryRole, Notification (+2 more)

### Community 13 - "LanTransportInterface"
Cohesion: 0.13
Nodes (4): DiscoveredPeer, MdnsDiscoveryInterface, NativeMdnsDiscovery, WebMdnsDiscovery

### Community 14 - "MdnsDiscoveryInterface"
Cohesion: 0.12
Nodes (21): FileCard(), FileCardProps, formatDate(), styles, MemberCardProps, STATUS_CONFIG, styles, ServiceDetailScreen() (+13 more)

### Community 15 - "EmptyState"
Cohesion: 0.11
Nodes (14): EmptyState(), EmptyStateProps, styles, SkeletonCard(), SkeletonHeader(), SkeletonMember(), styles, styles (+6 more)

### Community 16 - "components/index.ts"
Cohesion: 0.27
Nodes (11): BandMember, BandMemberRole, BandSessionState, BandSyncMessage, BandSyncMessageType, createBandSession(), createSyncMessage(), parseSyncPacket() (+3 more)

### Community 17 - "Database"
Cohesion: 0.14
Nodes (6): Database, SqlJsMemoryDatabase, migration_001, migration_002, Migration, MIGRATIONS

### Community 18 - "segmentsRepository.ts"
Cohesion: 0.17
Nodes (11): ServiceSegmentRecord, ServiceRecord, PositionRequestRecord, ServiceTeamMemberRecord, createSegmentSchema, createServiceSchema, createTeamMemberSchema, updateSegmentSchema (+3 more)

### Community 19 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, supertest, ts-node, @types/bcryptjs, @types/express, @types/multer, @types/node, supertest (+5 more)

### Community 20 - "authAPI"
Cohesion: 0.11
Nodes (9): defaultHeader, ProfileStack, Stack, Tab, styles, styles, styles, styles (+1 more)

### Community 21 - "BackgroundJobQueue"
Cohesion: 0.21
Nodes (4): BackgroundJobQueue, Job, JobHandler, jobQueue

### Community 22 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, postinstall, prisma:generate, prisma:migrate, prisma:seed, prisma:studio (+4 more)

### Community 23 - "ServiceCard.tsx"
Cohesion: 0.23
Nodes (5): FileRecord, FilesRepository, ALLOWED_TYPES, deleteFileSchema, uploadFileSchema

### Community 24 - "dependencies"
Cohesion: 0.19
Nodes (5): FilterBarProps, FilterOption, styles, SectionHeaderProps, styles

### Community 30 - "server.ts"
Cohesion: 0.16
Nodes (9): app, authLimiter, globalLimiter, Job, JobHandler, jobQueue, OPTIONAL_ENV_VARS, REQUIRED_ENV_VARS (+1 more)

### Community 31 - "ErrorBoundary.tsx"
Cohesion: 0.12
Nodes (11): AppContent(), ErrorBoundary, Props, State, styles, Props, ResponsiveContainer(), styles (+3 more)

### Community 32 - "DashboardScreen.tsx"
Cohesion: 0.21
Nodes (10): formatDate(), ServiceCard(), ServiceCardProps, styles, COLORS, LABELS, StatusBadge(), StatusBadgeProps (+2 more)

### Community 35 - "BackgroundJobQueue"
Cohesion: 0.25
Nodes (12): classifySectionTitle(), ExportableSong, exportToFreeShowFormat(), exportToTextSlides(), FreeShowExport, generatePresentationSlides(), parseSongSections(), PresentationSlide (+4 more)

### Community 36 - "SearchScreen.tsx"
Cohesion: 0.32
Nodes (6): react, SearchResults, SearchScreen(), styles, useDebounce(), react

### Community 37 - "SqlJsMemoryDatabase"
Cohesion: 0.30
Nodes (6): router, changePasswordSchema, inviteSchema, loginSchema, registerSchema, updateProfileSchema

### Community 40 - "ServicesRepository"
Cohesion: 0.29
Nodes (7): expo, expo-constants, dependencies, expo, expo-constants, react-native-safe-area-context, react-native-safe-area-context

### Community 42 - "ResponsiveContainer.tsx"
Cohesion: 0.05
Nodes (42): 1.1 Crear Cuenta, 1.2 Obtener Credenciales, 1.3 Ejecutar Schema, 2.1 Crear Cuenta, 2.2 Conectar Repositorio, 2.3 Configurar Variables, 2.4 Configurar Build, 3.1 Crear Cuenta (+34 more)

### Community 45 - "templatesRepository.ts"
Cohesion: 0.38
Nodes (5): ServiceTemplateRecord, ServiceTemplateSegmentRecord, applyTemplateSchema, createTemplateSchema, updateTemplateSchema

### Community 46 - "crypto.ts"
Cohesion: 0.15
Nodes (25): ChordViewer(), ChordViewerProps, styles, LiveStageScreen(), styles, ChordProItem, ChordProLine, ChordProSong (+17 more)

### Community 47 - "CryptoService"
Cohesion: 0.22
Nodes (7): SongCardProps, styles, linking, LiveStageScreenProps, SongsScreen(), styles, Song

### Community 48 - "mutationQueue.ts"
Cohesion: 0.52
Nodes (6): enqueueMutation(), getQueue(), getQueueSize(), processQueue(), QueuedMutation, saveQueue()

### Community 49 - "songsRepository.ts"
Cohesion: 0.47
Nodes (3): SegmentItemProps, styles, ServiceSegment

### Community 51 - "Toast.tsx"
Cohesion: 0.14
Nodes (13): 1. Backend (Railway + Supabase), 2. Mobile (Expo / EAS Build), 3. Post-Despliegue, 4. Variables de Entorno Requeridas, Build iOS/Android (EAS Build), Configurar API URL, Deep Linking, Despliegue — Church Planning (+5 more)

### Community 52 - "FilesRepository"
Cohesion: 0.39
Nodes (6): MinistryRecord, MinistryRoleRecord, createMinistrySchema, createRoleSchema, updateMinistrySchema, updateRoleSchema

### Community 53 - "searchRepository.ts"
Cohesion: 0.35
Nodes (9): computeSignature(), executeQuickAction(), fromBase64(), generateQuickActionToken(), QuickActionExecutionResult, QuickActionPayload, QuickActionResult, toBase64() (+1 more)

### Community 54 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, devCommand, framework, outputDirectory, rewrites

### Community 55 - "shared/validation/auth.ts"
Cohesion: 0.15
Nodes (15): ChurchMemberRecord, ChurchRecord, SongHistoryRecord, SongRecord, changePasswordSchema, inviteSchema, loginSchema, registerSchema (+7 more)

### Community 56 - "backend/package.json"
Cohesion: 0.40
Nodes (4): description, main, name, version

### Community 57 - "push.ts"
Cohesion: 0.33
Nodes (4): COLORS, ICONS, styles, ToastProps

### Community 58 - "metro.config.js"
Cohesion: 0.40
Nodes (4): config, { getDefaultConfig }, path, workspaceRoot

### Community 59 - "SegmentItem.tsx"
Cohesion: 0.15
Nodes (12): API Endpoints, Autor, Backend, Características, Church Planning App, Estructura, Fase 1 (MVP), Fase 2 (+4 more)

### Community 65 - "@types/bcryptjs"
Cohesion: 0.32
Nodes (5): validate(), router, ALLOWED_TYPES, deleteFileSchema, uploadFileSchema

### Community 77 - "routes/services.ts"
Cohesion: 0.36
Nodes (6): router, createSegmentSchema, createServiceSchema, createTeamMemberSchema, updateServiceSchema, updateTeamMemberSchema

### Community 83 - "DashboardScreen.tsx"
Cohesion: 0.25
Nodes (5): LoadingScreen(), LoadingScreenProps, styles, DashboardData, styles

### Community 96 - "routes/churches.ts"
Cohesion: 0.48
Nodes (5): router, addMemberSchema, createChurchSchema, updateChurchSchema, updateMemberSchema

### Community 97 - "routes/ministries.ts"
Cohesion: 0.48
Nodes (5): router, createMinistrySchema, createRoleSchema, updateMinistrySchema, updateRoleSchema

### Community 98 - "routes/templates.ts"
Cohesion: 0.43
Nodes (5): router, applyTemplateSchema, createTemplateSchema, reorderSegmentsSchema, updateTemplateSchema

### Community 101 - "routes/songs.ts"
Cohesion: 0.60
Nodes (3): router, createSongSchema, updateSongSchema

### Community 104 - "push.ts"
Cohesion: 0.60
Nodes (4): createInAppNotification(), notifyAndPush(), PushPayload, sendPushToUser()

## Knowledge Gaps
- **362 isolated node(s):** `name`, `version`, `description`, `main`, `build` (+357 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `ServicesRepository` to `devDependencies`, `SearchScreen.tsx`, `expo-print`, `expo-secure-store`, `react-native`, `expo-image-manipulator`, `expo-local-authentication`, `expo-notifications`, `expo-print`, `expo-secure-store`, `expo-sharing`, `expo-sqlite`, `@expo/vector-icons`, `react-dom`, `@react-native-async-storage/async-storage`, `react-native-screens`, `@react-navigation/bottom-tabs`, `@react-navigation/native`, `@react-navigation/native-stack`, `yjs`, `zod`, `songsRepository.ts`, `expo`, `@noble/hashes`, `react-native-web`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `react` connect `SearchScreen.tsx` to `ServicesRepository`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _362 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `middleware/auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13636363636363635 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `NativeFileStorage` be split into smaller, more focused modules?**
  _Cohesion score 0.05272108843537415 - nodes in this community are weakly interconnected._