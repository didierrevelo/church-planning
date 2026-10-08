# Graph Report - .  (2026-10-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 930 nodes · 1508 edges · 96 communities (46 shown, 50 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3fdad79a`
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
- FileCard.tsx
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
- @types/cors
- prisma
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
- expo-file-system
- expo-image-manipulator
- expo-local-authentication
- @expo/metro-runtime
- expo-notifications
- expo-print
- expo-secure-store
- expo-sharing
- expo-sqlite
- expo-status-bar
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

## God Nodes (most connected - your core abstractions)
1. `Database` - 41 edges
2. `generateUUID()` - 32 edges
3. `getDatabase()` - 23 edges
4. `AuthRequest` - 16 edges
5. `authenticate()` - 16 edges
6. `compilerOptions` - 15 edges
7. `requireChurch()` - 14 edges
8. `compilerOptions` - 14 edges
9. `expo` - 13 edges
10. `scripts` - 12 edges

## Surprising Connections (you probably didn't know these)
- `ServiceDetailScreen()` --calls--> `useToast()`  [EXTRACTED]
  mobile/src/screens/ServiceDetailScreen.tsx → mobile/src/contexts/ToastContext.tsx
- `assignTeamLocal()` --calls--> `generateUUID()`  [EXTRACTED]
  shared/domain/agent.ts → mobile/src/platform/crypto.ts
- `ServiceCardProps` --references--> `Service`  [EXTRACTED]
  mobile/src/components/ServiceCard.tsx → mobile/src/types/index.ts
- `AdminScreen()` --calls--> `useToast()`  [EXTRACTED]
  mobile/src/screens/AdminScreen.tsx → mobile/src/contexts/ToastContext.tsx
- `AgentScreen()` --calls--> `useToast()`  [EXTRACTED]
  mobile/src/screens/AgentScreen.tsx → mobile/src/contexts/ToastContext.tsx

## Import Cycles
- None detected.

## Communities (96 total, 50 thin omitted)

### Community 0 - "middleware/auth.ts"
Cohesion: 0.05
Nodes (54): globalForPrisma, authenticate(), AuthRequest, memberUserSelect, publicUserSelect, requireChurch(), requireChurchAdmin(), requireSuperAdmin() (+46 more)

### Community 1 - "shared/__tests__/validation.test.ts"
Cohesion: 0.09
Nodes (18): ChurchesRepository, ChurchMemberRecord, ChurchRecord, MinistryRecord, MinistryRoleRecord, addMemberSchema, createChurchSchema, updateChurchSchema (+10 more)

### Community 2 - "expo"
Cohesion: 0.05
Nodes (36): backgroundColor, foregroundImage, adaptiveIcon, package, permissions, expo, android, extra (+28 more)

### Community 3 - "dependencies"
Cohesion: 0.06
Nodes (35): @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcryptjs, cors, dotenv (+27 more)

### Community 4 - "NativeFileStorage"
Cohesion: 0.09
Nodes (6): FileStorageInterface, NativeFileStorage, WebFileStorage, NativeSecureStorage, SecureStorageInterface, WebSecureStorage

### Community 5 - "devDependencies"
Cohesion: 0.07
Nodes (28): @babel/core, jest, devDependencies, @babel/core, jest, sql.js, ts-jest, @types/jest (+20 more)

### Community 6 - "AdminScreen.tsx"
Cohesion: 0.10
Nodes (21): ToastContext, ToastContextType, useToast(), AdminScreen(), ChurchInfo, Member, styles, AgentRun (+13 more)

### Community 7 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowJs, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module (+16 more)

### Community 8 - "schema.sql"
Cohesion: 0.20
Nodes (23): "File", "Ministry", "MinistryRole", "Notification", "PositionRequest", "Service", "ServiceSegment", "ServiceTeam" (+15 more)

### Community 9 - "generateUUID"
Cohesion: 0.19
Nodes (11): AppContent(), getDatabase(), resetDatabaseForTesting(), AgentRunRecord, FileRecord, NotificationRecord, SongHistoryRecord, SongRecord (+3 more)

### Community 10 - "api.ts"
Cohesion: 0.14
Nodes (13): styles, styles, ServiceDetailScreen(), styles, filesAPI, positionsAPI, reorderAPI, searchAPI (+5 more)

### Community 11 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir (+12 more)

### Community 12 - "types/index.ts"
Cohesion: 0.14
Nodes (11): styles, styles, styles, styles, churchesAPI, notificationsAPI, Church, MinistryRole (+3 more)

### Community 13 - "LanTransportInterface"
Cohesion: 0.13
Nodes (4): LanTransportInterface, NativeLanTransport, PeerInfo, WebLanTransport

### Community 14 - "MdnsDiscoveryInterface"
Cohesion: 0.13
Nodes (4): DiscoveredPeer, MdnsDiscoveryInterface, NativeMdnsDiscovery, WebMdnsDiscovery

### Community 15 - "EmptyState"
Cohesion: 0.13
Nodes (10): EmptyState(), EmptyStateProps, styles, FILTERS, ROLE_COLORS, ROLE_LABELS, styles, styles (+2 more)

### Community 16 - "components/index.ts"
Cohesion: 0.16
Nodes (9): FilterBarProps, FilterOption, styles, SectionHeaderProps, styles, SkeletonCard(), SkeletonHeader(), SkeletonMember() (+1 more)

### Community 17 - "Database"
Cohesion: 0.21
Nodes (5): Database, migration_001, Migration, MIGRATIONS, runMigrations()

### Community 18 - "segmentsRepository.ts"
Cohesion: 0.18
Nodes (11): ServiceSegmentRecord, ServiceRecord, PositionRequestRecord, ServiceTeamMemberRecord, createSegmentSchema, createServiceSchema, createTeamMemberSchema, updateSegmentSchema (+3 more)

### Community 19 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, jest, supertest, ts-node, @types/express, @types/multer, @types/node, jest (+5 more)

### Community 20 - "authAPI"
Cohesion: 0.15
Nodes (5): styles, styles, styles, styles, authAPI

### Community 21 - "BackgroundJobQueue"
Cohesion: 0.22
Nodes (4): BackgroundJobQueue, Job, JobHandler, jobQueue

### Community 22 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, postinstall, prisma:generate, prisma:migrate, prisma:seed, prisma:studio (+4 more)

### Community 23 - "ServiceCard.tsx"
Cohesion: 0.21
Nodes (10): formatDate(), ServiceCard(), ServiceCardProps, styles, COLORS, LABELS, StatusBadge(), StatusBadgeProps (+2 more)

### Community 24 - "dependencies"
Cohesion: 0.18
Nodes (11): expo, expo-constants, dependencies, expo, expo-constants, @noble/hashes, react-native-safe-area-context, react-native-web (+3 more)

### Community 29 - "AppNavigator.tsx"
Cohesion: 0.20
Nodes (6): defaultHeader, linking, ProfileStack, Stack, Tab, SongsScreen()

### Community 30 - "server.ts"
Cohesion: 0.25
Nodes (6): app, authLimiter, globalLimiter, OPTIONAL_ENV_VARS, REQUIRED_ENV_VARS, validateEnv()

### Community 31 - "ErrorBoundary.tsx"
Cohesion: 0.22
Nodes (4): ErrorBoundary, Props, State, styles

### Community 32 - "DashboardScreen.tsx"
Cohesion: 0.22
Nodes (6): LoadingScreen(), LoadingScreenProps, styles, DashboardData, styles, reportsAPI

### Community 36 - "SearchScreen.tsx"
Cohesion: 0.32
Nodes (6): react, SearchResults, SearchScreen(), styles, useDebounce(), react

### Community 42 - "ResponsiveContainer.tsx"
Cohesion: 0.38
Nodes (5): Props, ResponsiveContainer(), styles, BREAKPOINTS, useResponsive()

### Community 43 - "SongsScreen.tsx"
Cohesion: 0.33
Nodes (4): SongCardProps, styles, styles, Song

### Community 45 - "templatesRepository.ts"
Cohesion: 0.38
Nodes (5): ServiceTemplateRecord, ServiceTemplateSegmentRecord, applyTemplateSchema, createTemplateSchema, updateTemplateSchema

### Community 46 - "crypto.ts"
Cohesion: 0.43
Nodes (5): UserRecord, defaultCrypto, generateSaltHex(), hashPasswordWithPbkdf2(), verifyPasswordWithPbkdf2()

### Community 48 - "mutationQueue.ts"
Cohesion: 0.52
Nodes (6): enqueueMutation(), getQueue(), getQueueSize(), processQueue(), QueuedMutation, saveQueue()

### Community 49 - "FileCard.tsx"
Cohesion: 0.47
Nodes (5): FileCard(), FileCardProps, formatDate(), styles, File

### Community 50 - "MemberCard.tsx"
Cohesion: 0.40
Nodes (4): MemberCardProps, STATUS_CONFIG, styles, ServiceTeamMember

### Community 51 - "Toast.tsx"
Cohesion: 0.33
Nodes (4): COLORS, ICONS, styles, ToastProps

### Community 54 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, devCommand, framework, outputDirectory, rewrites

### Community 55 - "shared/validation/auth.ts"
Cohesion: 0.33
Nodes (5): changePasswordSchema, inviteSchema, loginSchema, registerSchema, updateProfileSchema

### Community 56 - "backend/package.json"
Cohesion: 0.40
Nodes (4): description, main, name, version

### Community 57 - "push.ts"
Cohesion: 0.60
Nodes (4): createInAppNotification(), notifyAndPush(), PushPayload, sendPushToUser()

### Community 58 - "metro.config.js"
Cohesion: 0.40
Nodes (4): config, { getDefaultConfig }, path, workspaceRoot

### Community 59 - "SegmentItem.tsx"
Cohesion: 0.50
Nodes (3): SegmentItemProps, styles, ServiceSegment

## Knowledge Gaps
- **299 isolated node(s):** `name`, `version`, `description`, `main`, `build` (+294 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`, `SearchScreen.tsx`, `react-native`, `expo-file-system`, `expo-image-manipulator`, `expo-local-authentication`, `@expo/metro-runtime`, `expo-notifications`, `expo-print`, `expo-secure-store`, `expo-sharing`, `expo-sqlite`, `expo-status-bar`, `@expo/vector-icons`, `react-dom`, `@react-native-async-storage/async-storage`, `react-native-screens`, `@react-navigation/bottom-tabs`, `@react-navigation/native`, `@react-navigation/native-stack`, `yjs`, `zod`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `react` connect `SearchScreen.tsx` to `dependencies`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _299 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `middleware/auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05422838031533684 - nodes in this community are weakly interconnected._
- **Should `shared/__tests__/validation.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08906882591093117 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._