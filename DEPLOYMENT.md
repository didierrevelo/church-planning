# Despliegue — Church Planning

## 1. Backend (Railway + Supabase)

### Supabase (Base de datos gratis)
1. Crear cuenta en https://supabase.com
2. Crear proyecto → copiar `DATABASE_URL` (connection string)
3. En SQL Editor, ejecutar el schema de Prisma o correr migraciones desde Railway

### Railway (API)
```bash
# Instalar CLI
npm i -g @railway/cli

# Login
railway login

# Inicializar desde el directorio backend
cd backend
railway init

# Desplegar
railway up

# Configurar variables de entorno en Railway Dashboard:
# DATABASE_URL=postgresql://...
# JWT_SECRET=<generar: openssl rand -base64 32>
# CORS_ORIGIN=https://church-planning.app
# NODE_ENV=production
# SENTRY_DSN=(opcional)

# Ejecutar migraciones
railway run npx prisma migrate deploy

# Ver logs
railway logs
```

La URL de la API será `https://church-planning-api.up.railway.app` (o la que asigne Railway).

### S3 / Cloudflare R2 (Archivos - opcional)
1. Crear bucket en Cloudflare R2 (gratis hasta 10GB)
2. Agregar `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` en Railway

---

## 2. Mobile (Expo / EAS Build)

### Configurar API URL
La URL de producción ya está en `src/services/api.ts`:
```ts
const API_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://church-planning-api.up.railway.app';
```
Cambiar por la URL real de Railway si es diferente.

### Publicar Web (Expo)
```bash
cd mobile
npx expo export --platform web
# Subir carpeta dist/ a Vercel, Netlify o Cloudflare Pages
```

### Build iOS/Android (EAS Build)
```bash
# Instalar EAS CLI
npm i -g eas-cli

# Login en Expo
eas login

# Configurar builds
eas build:configure

# Build para producción
eas build --platform all --profile production

# O para pruebas
eas build --platform android --profile preview
```

### Publicar en Stores
- iOS: Usar Transporter App o Application Loader
- Android: Subir .aab a Google Play Console

### Deep Linking
- iOS: El `applinks:church-planning.app` en `app.json` requiere verificación del servidor
- Android: Los intent filters ya están configurados en `app.json`
- Web: El `https://church-planning.app` en `linking.prefixes` se configura con el dominio real

---

## 3. Post-Despliegue

- [ ] Configurar dominio personalizado en Railway (opcional)
- [ ] Agregar SSL/HTTPS (Railway lo hace automático)
- [ ] Configurar Sentry para monitoreo de errores
- [ ] Verificar health check: `GET /health`
- [ ] Probar registro de usuario y creación de iglesia
- [ ] Probar deep linking en iOS y Android
- [ ] Configurar CI/CD (GitHub Actions) para despliegues automáticos

---

## 4. Variables de Entorno Requeridas

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de Supabase PostgreSQL |
| `JWT_SECRET` | Secreto para firmar tokens JWT |
| `CORS_ORIGIN` | Dominio del frontend (ej: https://church-planning.app) |
| `PORT` | Puerto (Railway asigna automáticamente) |
| `NODE_ENV` | `production` en producción |
