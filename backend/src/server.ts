// ============================================
// SERVIDOR PRINCIPAL - CHURCH PLANNING API
// ============================================

// Express: Framework web para Node.js, maneja rutas HTTP
// Conecta: Con todas las rutas en routes/, middleware/auth.ts
import express from 'express';

// CORS: Middleware para permitir requests desde el móvil (React Native)
// Conecta: Con la app móvil en mobile/src/services/api.ts
import cors from 'cors';

// dotenv: Carga variables de entorno desde .env
// Conecta: Con .env.example (DATABASE_URL, JWT_SECRET, AWS keys, etc.)
import dotenv from 'dotenv';

// PrismaClient: Cliente ORM para conectar con PostgreSQL
// Conecta: Con schema.prisma (define todos los modelos)
import { PrismaClient } from '@prisma/client';

// Carga las variables de entorno del archivo .env
// Qué: Lee DATABASE_URL, JWT_SECRET, AWS_ACCESS_KEY_ID, etc.
// Cómo: dotenv.config() busca .env en la raíz del proyecto
dotenv.config();

// Crea la instancia de Express
// Qué: app es el servidor que maneja todas las rutas HTTP
// Cómo: express() crea una aplicación Express
// Conecta: Con app.use() para rutas y middleware, app.listen() para iniciar
const app = express();

// Crea el cliente de Prisma para consultas a la BD
// Qué: prisma permite hacer CRUD sin SQL directo
// Cómo: new PrismaClient() conecta con PostgreSQL usando DATABASE_URL
// Conecta: Con schema.prisma (modelos), routes/ (consultas)
const prisma = new PrismaClient();

// Puerto del servidor (usa variable de entorno o 3000 por defecto)
// Qué: Define en qué puerto escucha el servidor
// Cómo: process.env.PORT lee del .env, fallback a 3000
// Conecta: Con app.listen() para iniciar el servidor
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// CORS: Permite requests desde cualquier origen
// Qué: Habilita Cross-Origin Resource Sharing
// Cómo: app.use(cors()) aplica a todas las rutas
// Conecta: Con la app móvil (React Native) que hace requests HTTP
app.use(cors());

// JSON Parser: Convierte el body de requests JSON a objetos JavaScript
// Qué: Permite recibir JSON en POST/PATCH requests
// Cómo: app.use(express.json()) parsea el body automáticamente
// Conecta: Con req.body en todas las rutas (auth, services, team, etc.)
app.use(express.json());

// ============================================
// RUTAS DE LA API
// ============================================

// Ruta de autenticación: login, invite, me, password
// Qué: Maneja login, invitación de usuarios, perfil
// Cómo: Todas las rutas empiezan con /auth
// Conecta: Con routes/auth.ts, middleware/auth.ts (JWT)
app.use('/auth', require('./routes/auth'));

// Ruta de servicios: CRUD de cultos y segmentos
// Qué: Crear, listar, editar, eliminar servicios y su orden
// Cómo: Todas las rutas empiezan con /services
// Conecta: Con routes/services.ts, schema.prisma (Service, ServiceSegment)
app.use('/services', require('./routes/services'));

// Ruta de ministerios: CRUD de ministerios y roles
// Qué: Gestionar ministerios (Alabanza, Danzas, etc.) y sus roles
// Cómo: Todas las rutas empiezan con /ministries
// Conecta: Con routes/ministries.ts, schema.prisma (Ministry, MinistryRole)
app.use('/ministries', require('./routes/ministries'));

// Ruta de equipo: Asignación de personas a servicios
// Qué: Asignar personas, actualizar estados, solicitudes de posiciones
// Cómo: Todas las rutas empiezan con /team
// Conecta: Con routes/team.ts, schema.prisma (ServiceTeam, PositionRequest)
app.use('/team', require('./routes/team'));

// Ruta de canciones: Set list musical
// Qué: Agregar, editar, eliminar canciones del servicio
// Cómo: Todas las rutas empiezan con /songs
// Conecta: Con routes/songs.ts, schema.prisma (Song, SongHistory)
app.use('/songs', require('./routes/songs'));

// Ruta de archivos: Subida y gestión de archivos
// Qué: Subir archivos a S3, listar, eliminar
// Cómo: Todas las rutas empiezan con /files
// Conecta: Con routes/files.ts, AWS S3 (presigned URLs)
app.use('/files', require('./routes/files'));

// Ruta de notificaciones: Listar y marcar como leídas
// Qué: Obtener notificaciones, marcar leídas
// Cómo: Todas las rutas empiezan con /notifications
// Conecta: Con routes/notifications.ts, schema.prisma (Notification)
app.use('/notifications', require('./routes/notifications'));

// ============================================
// HEALTH CHECK Y ERROR HANDLING
// ============================================

// Health check: Verifica que el servidor está funcionando
// Qué: Endpoint simple para monitoreo
// Cómo: GET /health retorna { status: "OK", timestamp: "..." }
// Conecta: Con servicios de monitoreo (UptimeRobot, etc.)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler global: Captura errores no manejados
// Qué: Si una ruta lanza error, retorna 500
// Cómo: app.use((err, req, res, next)) es el middleware de errores de Express
// Conecta: Con todos los routes/ que pueden lanzar errores
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);  // Log del error para debugging
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// INICIO DEL SERVIDOR
// ============================================

// Escucha en el puerto definido
// Qué: Inicia el servidor HTTP
// Cómo: app.listen(PORT) abre el puerto para recibir conexiones
// Conecta: Con todas las rutas configuradas arriba
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Exporta la instancia de app para testing
// Qué: Permite importar app en archivos de test
// Cómo: export default app
// Conecta: Con archivos de test que necesitan la instancia
export default app;
