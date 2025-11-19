# Guía de Uso de la API – Gestion Eventos Comunitarios

Este documento complementa al README principal y se enfoca en **cómo consumir la API REST** (endpoints, flujos de autenticación y ejemplos) para que puedas integrarla con la app React Native/Expo u otros clientes.

- **Base URL local:** `http://localhost:4000/api`
- **Health check:** `GET /health`
- **Formato:** JSON (`Content-Type: application/json`)
- **Autenticación:** Bearer JWT emitidos por el backend (access token + refresh token)

---

## 1. Flujo de autenticación con Facebook/Instagram

La API es responsable de todo el intercambio OAuth, preservando los secretos en el servidor y devolviendo JWT propios.

### Paso a paso (Expo AuthSession)

1. El cliente solicita el inicio (`POST /auth/<provider>/start`) para obtener `authUrl` y `state` firmado.
2. Abre ese `authUrl` con `AuthSession.startAsync`. Meta redirige a tu deep link (via proxy de Expo si `useProxy: true`).
3. Expo entrega al cliente `{ type: 'success', params: { code, state } }`.
4. Envías `POST /auth/<provider>/exchange` con `{ code, redirectUri, state }` (el mismo redirect usado en Expo).
5. El backend intercambia código ↔ access_token, obtiene datos básicos del usuario, crea/actualiza en la base y responde con:
   ```json
   {
     "token": "<jwt_access>",
     "refreshToken": "<jwt_refresh>",
     "user": { "id": "...", "name": "...", ... }
   }
   ```
6. Guarda `token` en `SecureStore` (o AsyncStorage cifrado) y úsalo en `Authorization: Bearer <token>` para todas las llamadas.
7. Cuando expire, usa `POST /auth/refresh` con el refresh token. Puedes revocarlo mediante `POST /auth/logout`.

> **Importante:** `state` lleva codificado el redirect URI; debes enviar el mismo valor que usó Expo (`makeRedirectUri({ scheme, path, useProxy })`).

### Ejemplo con fetch (Expo)

```ts
const startAuth = async () => {
  const response = await fetch(`${API_BASE}/auth/facebook/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirectUri }),
  });
  const { authUrl, state } = await response.json();

  const result = await AuthSession.startAsync({ authUrl, returnUrl: redirectUri });
  if (result.type !== 'success') throw new Error('Login cancelado');

  const exchangeResponse = await fetch(`${API_BASE}/auth/facebook/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: result.params.code,
      redirectUri,
      state: result.params.state,
    }),
  });

  const { token, refreshToken, user } = await exchangeResponse.json();
  await SecureStore.setItemAsync('token', token);
  await SecureStore.setItemAsync('refreshToken', refreshToken);
  return user;
};
```

---

## 2. Autenticación y autorización

| Tipo | Descripción |
| --- | --- |
| Access Token | JWT firmado con `JWT_SECRET`, TTL configurable (`TOKEN_TTL`, p. ej. `15m`). Debe enviarse en `Authorization: Bearer <token>`. |
| Refresh Token | JWT firmado con `JWT_REFRESH_SECRET`. Se almacena un hash (`refresh_tokens`), lo que permite revocarlos. |
| Roles | `user` (por defecto) y `admin`. Algunos endpoints (p. ej. POST /categories) requieren rol admin. |

Errores comunes: `401 Unauthorized` (token faltante/expirado), `403 Forbidden` (rol insuficiente), `400` (body inválido), `404` (recurso no encontrado).

---

## 3. Endpoints principales

### 3.1 Auth (`/auth`)

| Método | Ruta | Body | Respuesta |
| --- | --- | --- | --- |
| POST | `/auth/facebook/start` | `{ "redirectUri"?: string }` | `{ authUrl, state }` |
| POST | `/auth/facebook/exchange` | `{ code, redirectUri, state }` | `{ token, refreshToken, user }` |
| POST | `/auth/instagram/start` | Igual a Facebook | `{ authUrl, state }` |
| POST | `/auth/instagram/exchange` | Igual a Facebook | `{ token, refreshToken, user }` |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ token, refreshToken }` |
| POST | `/auth/logout` | `{ refreshToken }` | `204 No Content` |

### 3.2 Usuarios (`/users`)

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/users/me` | ✅ | Retorna el usuario autenticado. |
| PATCH | `/users/me` | ✅ | Actualiza `description`, `address`, `photoUrl`. |
| GET | `/users/:id` | ❌ | Perfil público. |
| GET | `/users/:id/events/created` | ❌ | Eventos creados por el usuario. |
| GET | `/users/:id/events/attending` | ❌ | Eventos a los que asistirá. |

### 3.3 Categorías (`/categories`)

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/categories` | ❌ | Lista ordenada por nombre. |
| POST | `/categories` | ✅ (admin) | Crea nueva categoría. |

### 3.4 Eventos (`/events`)

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/events?sort=asc|desc&limit=3` | ❌ | Próximos eventos. |
| GET | `/events/:id` | ❌ | Detalle completo (categoría, creador, asistentes, `attendeesCount`). |
| POST | `/events` | ✅ | Crea evento (usa `req.user.id` como `createdBy`). |
| PATCH | `/events/:id` | ✅ | Solo creador o admin. |
| DELETE | `/events/:id` | ✅ | Solo creador o admin. |
| POST | `/events/:id/attendees` | ✅ | Registrar asistencia del usuario autenticado. |
| DELETE | `/events/:id/attendees/:userId` | ✅ | Cancela asistencia propia o elimina (admin). |

---

## 4. Ejemplos de uso (curl)

### Obtener categorías
```bash
curl -X GET http://localhost:4000/api/categories
```

### Crear evento
```bash
curl -X POST http://localhost:4000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Torneo comunitario",
    "description": "5 vs 5",
    "location": "Parque Central",
    "startsAt": "2025-02-01T16:00:00.000Z",
    "categoryId": 1
  }'
```

### Marcar asistencia
```bash
curl -X POST http://localhost:4000/api/events/<eventId>/attendees \
  -H "Authorization: Bearer $TOKEN"
```

### Refrescar token
```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "<tu_refresh>" }'
```

---

## 5. Integración con la app React Native

1. **Configura las variables en Expo** (`app.config.ts` o `.env`):
   ```env
   EXPO_PUBLIC_API_BASE_URL=https://api.midominio.com/api
   EXPO_PUBLIC_FACEBOOK_REDIRECT_URI=https://login.midominio.com/oauth/facebook/callback
   EXPO_PUBLIC_INSTAGRAM_REDIRECT_URI=https://login.midominio.com/oauth/instagram/callback
   ```
2. **Usa `fetch` o Axios** apuntando a `EXPO_PUBLIC_API_BASE_URL`.
3. **AuthSession**: respeta el `state` y `redirectUri` devueltos por el backend.
4. **Persistencia segura**: guarda `token` y `refreshToken` en `SecureStore`.
5. **Middleware HTTP**: añade el header `Authorization` y, ante `401`, intenta `POST /auth/refresh`. Si falla, borra tokens y redirige a login.
6. **Migración desde SQLite**:
   - Sustituye las funciones locales por llamadas REST.
   - Usa los nuevos endpoints `GET /events`, `/users/:id/...` para las pantallas existentes.
   - Mantén caches ligeros usando `react-query` o SWR si lo prefieres.

---

## 6. Errores y manejo de estados

La API responde con la estructura:
```json
{
  "message": "Descripción legible",
  "details": { ... } // opcional
}
```

Códigos comunes:
- `400`: body/params inválidos (Zod validation).
- `401`: falta/expira el token o refresh inválido.
- `403`: rol insuficiente.
- `404`: recurso no existe o usuario intenta editar uno que no creó.
- `409`: conflictos (por ejemplo, categorías duplicadas, asistencia ya registrada).
- `500`: error interno (se loguea en el servidor).

---

## 7. Checklist para ambientes

- [ ] Registrar tus redirect URI en Facebook/Instagram Developer.
- [ ] Configurar los mismos redirect en `.env` (`FACEBOOK_REDIRECT_URI`, `INSTAGRAM_REDIRECT_URI`).
- [ ] Actualizar `APP_DEEP_LINK_SCHEME` y `APP_REDIRECT_PATH_*` para que `makeRedirectUri` coincida.
- [ ] Replicar variables en tu hosting (Render, Railway, ECS, etc.) y en `eas secret:create`.
- [ ] Ejecutar `npm run db:migrate && npm run db:seed` en cada despliegue inicial.

Con esta guía puedes consumir cada endpoint y entender el flujo completo de autenticación social para integrarlo de forma segura en la app móvil.
