# API

Hono + `@hono/zod-openapi` en `packages/api`, montada en `/api/v1`. Spec en `packages/api/openapi.json` (se regenera con `pnpm api:openapi` y se verifica en CI con `openapi:check`); Swagger UI en `/api/v1/docs`.

## Contrato

- Autenticación por cookie (web) o `Authorization: Bearer` (móvil). Sin sesión, 401 `UNAUTHORIZED`.
- Errores con el mismo cuerpo siempre: `{ "error": { "code", "message", "issues"? } }`. 422 `VALIDATION` trae `issues` con `path` y `message` por campo; 404 `NOT_FOUND`, 409 `CONFLICT`, 403 `FORBIDDEN`, 400 `BAD_REQUEST`, 429 `RATE_LIMITED`, 503 `UNAVAILABLE`. Los mensajes están en español.
- Toda respuesta lleva `Server-Timing` (`total`, `session`, `db`, `email`…) y un log JSON por request (`src/logging.ts`).
- Lo que puede esperar a después de responder (hoy, el email de la invitación) corre con `runDeferred` (ver `docs/arquitectura.md`).

## Recursos

| Ruta                            | Quién         | Qué hace                                                                                               |
| ------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `GET /me`                       | miembro       | Usuario, rol, organización activa, todas las organizaciones de la cuenta y `lostOrganization`          |
| `PATCH /me`                     | miembro       | Cambia el nombre del usuario (`updateProfileSchema`)                                                   |
| `GET /settings`                 | miembro       | Ajustes de la organización activa (hoy, `name`)                                                        |
| `PATCH /settings`               | Administrador | Actualiza los ajustes (`updateSettingsSchema`; todos los campos opcionales)                            |
| `GET /members`                  | miembro       | Miembros de la organización activa, el Administrador primero                                           |
| `DELETE /members/{userId}`      | Administrador | Quita un miembro (400 si es el Administrador, 404 si no es miembro)                                    |
| `GET /invitations`              | Administrador | Invitaciones vigentes de la organización activa                                                        |
| `POST /invitations`             | Administrador | Invita por email: crea la invitación (7 días) y encola el email; 409 si ya es miembro o invitado       |
| `POST /invitations/{id}/resend` | Administrador | Reenvía el email con el mismo link y vencimiento                                                       |
| `POST /invitations/{id}/cancel` | Administrador | Cancela una invitación vigente (404 si no lo es o es de otra organización)                             |
| `GET /invitations/{id}`         | sesión        | Estado (`PENDING`, `EXPIRED`, `CANCELED`, `ACCEPTED`, `REJECTED`) y si es para el email de la sesión   |
| `POST /invitations/{id}/accept` | invitado      | Acepta: hace miembro y deja activa la organización propia (403 con otro email, 400 si no está vigente) |
| `POST /invitations/{id}/reject` | invitado      | Rechaza                                                                                                |
| `GET /cron/daily`               | cron          | Reintenta los emails pendientes y purga el rate limit viejo (`Authorization: Bearer <CRON_SECRET>`)    |

Las rutas de escritura de Configuración llevan el middleware `ownerOnly`; las lecturas las ve cualquier miembro. Para agregar un recurso: schema zod en `packages/domain`, DTO en `src/schemas.ts`, servicio en `src/services`, ruta en `src/routes` montada en `src/app.ts`, test de integración y `pnpm api:openapi`.

## Emails

`services/emails/outbox.ts` guarda cada email en `EmailOutbox` e intenta mandarlo al instante con Resend (`integrations/email.ts`). Sin `RESEND_API_KEY` queda `PENDING`; si el proveedor falla, reintenta con espera creciente (5, 30, 120 y 720 minutos) hasta 5 intentos y queda `FAILED`. El cron diario (`deliverPendingEmails`) vuelve a intentar lo pendiente. Las plantillas (`services/emails/templates.ts`) son funciones puras con el layout compartido `emailLayout`; hoy hay una, `invitationEmail`.

## Rate limit

`consumeRateLimit(key, limit, windowSeconds)` (`services/rate-limit.ts`) cuenta por clave y ventana fija en `RateLimitBucket`, atómico con `upsert`, porque las funciones de Vercel no comparten memoria. El middleware `rateLimit(...rules)` (`src/middleware.ts`) lo aplica por IP y alcance a las rutas que lo pidan; ninguna de las rutas base lo usa. `RATE_LIMIT=off` lo apaga (solo e2e). El cron diario borra las ventanas de más de dos días.

## Storage (opcional)

`integrations/storage.ts` firma URLs de subida y lectura contra un bucket S3-compatible (Cloudflare R2) con `STORAGE_*`; sin configurar responde 503 `UNAVAILABLE`. El template no lo usa en ninguna ruta: queda para productos que suban archivos (subida directa del navegador con URL firmada, metadatos en la base).

## Cron

Un solo cron en `apps/web/vercel.json`: `GET /api/v1/cron/daily` a las 06:00 UTC, protegido por `CRON_SECRET`.
