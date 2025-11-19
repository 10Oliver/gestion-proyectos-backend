# Gestion Eventos Comunitarios – Backend API

Backend companion para la app React Native que centraliza autenticación social con Facebook/Instagram, persistencia en PostgreSQL y los endpoints REST necesarios para usuarios, categorías, eventos y asistentes.

## Tecnologías principales

| Capa | Tecnología |
| --- | --- |
| Runtime | Node.js 20 + Express 5 (TypeScript) |
| ORM | Sequelize + sequelize-typescript |
| Base de datos | PostgreSQL 14+ |
| Autenticación | OAuth 2.0 (Facebook/Instagram) + JWT propios (access + refresh) |

## Requisitos previos

- Node.js >= 20
- PostgreSQL (local o gestionado)
- `npm` 10+

## Configuración de entorno

1. Copia el archivo de ejemplo y rellena tus secretos reales:

   ```bash
   cp .env.example .env
   ```

2. Variables imprescindibles:

   - `DATABASE_URL`: cadena completa a tu instancia de Postgres.
   - `JWT_SECRET` y `JWT_REFRESH_SECRET`: claves largas y únicas.
   - Credenciales de Facebook/Instagram (`FACEBOOK_APP_ID`, etc.).
   - Deep links registrados en Expo / Meta (`APP_DEEP_LINK_SCHEME`, `APP_REDIRECT_PATH_*`).

3. Para ejecutar pruebas sin tocar tu `.env`, existe `.env.test` (ya versionado).

`dotenv-safe` validará que todas las claves declaradas en `.env.example` existan antes de levantar el servidor.

## Scripts disponibles

| Script | Descripción |
| --- | --- |
| `npm run dev` | Levanta la API con recarga en caliente (`ts-node-dev`). |
| `npm run build` | Compila a `dist/`. |
| `npm start` | Ejecuta el build compilado. |
| `npm run lint` / `npm run lint:fix` | Linter ESLint + reglas TypeScript/Prettier. |
| `npm run test` | Test unitarios con Vitest + Supertest. |
| `npm run db:migrate` | Ejecuta migraciones (TypeScript) con `sequelize-cli`. |
| `npm run db:seed` | Inserta catálogos (categorías iniciales). |

> Todos los comandos `db:*` usan `ts-node/register`; asegúrate de exportar tus variables antes de ejecutarlos.

## Migraciones y modelos

| Migración | Tabla | Descripción |
| --- | --- | --- |
| `202501010001-create-users` | `users` | Usuarios sociales/locales (`provider`, `provider_user_id`, `role`, etc.). |
| `202501010002-create-categories` | `categories` | Catálogo base, con seeder (`Deportes`, `Artes y creatividad`, `Naturaleza`, `Festival`). |
| `202501010003-create-events` | `events` | Eventos con `category_id`, `created_by`, `starts_at/ends_at`, cupo y foto opcional. |
| `202501010004-create-event-attendees` | `event_attendees` | Relación N:M (PK compuesta). |
| `202501010005-create-refresh-tokens` | `refresh_tokens` | Almacena hash del `jti`, expiración y estado (`revoked`). |

Modelos Sequelize equivalentes se ubican en `src/database/models/*.model.ts` y registran las asociaciones (`belongsToMany`, `hasMany`, etc.).

## Endpoints clave

Base path: `/api`

### Autenticación (`/auth`)

- `POST /auth/facebook/start` · genera `authUrl` + `state` firmado para Facebook.
- `POST /auth/facebook/exchange` · body `{ code, redirectUri, state }` → `{ token, refreshToken, user }`.
- `POST /auth/instagram/start` · análogo para Instagram.
- `POST /auth/instagram/exchange` · idem Facebook.
- `POST /auth/refresh` · `{ refreshToken }` → nuevo par de tokens.
- `POST /auth/logout` · revoca el refresh enviado.

### Usuarios (`/users`)

- `GET /users/me` y `PATCH /users/me` · requiere `Authorization: Bearer <token>`.
- `GET /users/:id` · perfil público básico.
- `GET /users/:id/events/created`
- `GET /users/:id/events/attending`

### Categorías (`/categories`)

- `GET /categories`
- `POST /categories` · Solo `admin` (JWT) para crear nuevas categorías.

### Eventos (`/events`)

- `GET /events?sort=asc|desc&limit=3`
- `GET /events/:id`
- `POST /events` · Crea evento (el servidor fuerza `created_by = req.user.id`).
- `PATCH /events/:id`
- `DELETE /events/:id`
- `POST /events/:id/attendees`
- `DELETE /events/:id/attendees/:userId`

Cada respuesta de eventos incluye categoría, creador, lista de asistentes y `attendeesCount` para reemplazar las consultas SQLite existentes.

## Flujo OAuth con Expo AuthSession

1. La app móvil invoca `POST /auth/<provider>/start` para obtener `authUrl` + `state` firmado.
2. Expo abre el navegador, el usuario autoriza en Facebook/Instagram.
3. Meta redirige al deep link configurado (`FACEBOOK_REDIRECT_URI`, etc.).
4. La app recibe `code` + `state` y los envía a `POST /auth/<provider>/exchange`.
5. El backend verifica `state`, intercambia `code`→`access_token`, obtiene datos del perfil y genera tokens JWT internos (access + refresh almacenado en DB para revocación).

## Migrar datos desde SQLite

1. Exporta datos existentes en la app (users, categories, events, event_attendees) a JSON.
2. Normaliza los IDs (usa los mismos `id` string originales para no romper referencias).
3. Crea seeders adicionales que lean esos JSON y hagan `bulkInsert` con Sequelize CLI.
4. Una vez que la app consume la API, elimina la capa SQLite del cliente.

## Desarrollo local rápido

```bash
npm install
cp .env.example .env   # edita valores reales
npm run db:migrate
npm run db:seed
npm run dev
```

La app queda disponible en `http://localhost:4000` (health-check en `/health`).

## Pruebas

```bash
npm run test
```

Vitest usa `.env.test`, por lo que no interfiere con tu entorno local. Puedes añadir pruebas adicionales en `src/**/*.test.ts`.

## Docker 🐳

### Imagen de la API

El `Dockerfile` genera un build multi-stage (Node 20 Alpine). Para construir manualmente:

```bash
docker build -t gestion-eventos-api .
```

Variables de entorno deben inyectarse en tiempo de ejecución (`DATABASE_URL`, `JWT_*`, etc.).

### Compose (API + Postgres)

`docker-compose.yml` ya define dos servicios: `api` y `db`.

1. Coloca tus valores reales en `.env` (se montará dentro del contenedor `api`).
2. Ajusta `DATABASE_URL` para apuntar al servicio interno (`postgres://postgres:postgres@db:5432/gestion_eventos`).
3. Levanta todo:

   ```bash
   docker compose up -d --build
   docker compose exec api npm run db:migrate
   docker compose exec api npm run db:seed
   ```

4. Expón el puerto 4000 detrás de tu reverse proxy (nginx, Caddy, etc.).

### Producción / Deploy continuo

- Usa `docker buildx` para producir imágenes multi-plataforma (arm64/amd64).
- Monta secretos vía environment/secret manager (Render, Railway, Fly.io, ECS, etc.).
- Ejecuta migraciones automáticamente antes de arrancar (`npm run db:migrate && npm start`).
- Configura TLS y dominios (`https://api.midominio.com`).
- Replica las mismas variables en Expo (`eas secret:create`) para que la app móvil conozca el nuevo backend (`EXPO_PUBLIC_API_BASE_URL`).

## Próximos pasos sugeridos

1. Implementar pruebas adicionales para controladores/servicios críticos (auth, eventos, asistentes).
2. Agregar métricas/observabilidad (p. ej. Prometheus o APM de tu hosting).
3. Automatizar CI/CD (GitHub Actions) para lint, test, build e imagen Docker push.
4. Añadir soporte opcional para `state` persistente (Redis) o PKCE completo si se necesita un nivel extra de seguridad.

---

Con este repo puedes reemplazar la base SQLite local y consolidar autenticación + datos en un backend listo para producción con Docker.
