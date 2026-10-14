# Modelo de datos

Prisma 7 en `packages/db/prisma/schema.prisma`, Postgres. Una migración inicial (`20261013000000_init`); el producto agrega las suyas (`docs/migraciones.md`).

## Better Auth

`User`, `Session`, `Account` y `Verification` tal como los genera `better-auth generate`, más `Session.activeOrganizationId` del plugin `organization`. `Account` lleva `issuer` (índice único `issuer + accountId`) para el linking de cuentas.

## Organizaciones

| Modelo                 | Qué es                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Organization`         | El tenant. `name` editable desde Configuración; `slug` único generado al registrarse (`docs/autenticacion.md`).                                               |
| `Member`               | Pertenencia de un `User` a una `Organization` con `role` (`owner` o `member`, texto de Better Auth). Única por `organizationId + userId`.                     |
| `Invitation`           | Invitación por email con `status` (`pending`, `accepted`, `rejected`, `canceled`), `expiresAt` (7 días) e `inviterId`.                                        |
| `OrganizationSettings` | Preferencias de la organización, una fila por organización que nace con el primer `PATCH /settings`. Hoy solo `updatedAt`: el producto agrega acá sus campos. |

Toda entidad del producto cuelga de `Organization` con `organizationId` y `onDelete: Cascade`, y todo servicio filtra por el `organizationId` de la sesión.

## Infraestructura

| Modelo            | Qué es                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `EmailOutbox`     | Cola de salida de emails: destinatario, asunto, HTML, `status` (`PENDING`, `SENT`, `FAILED`), `attempts`, `lastError`, `sendAfter`, `sentAt`.          |
| `RateLimitBucket` | Contador por `key` y `windowStart` para el rate limit por IP.                                                                                          |
| `AuditLog`        | Registro de `create`, `update` y `delete` de las entidades auditadas (`auditedModels` en `packages/db/src/audit-extension.ts`) con `before` y `after`. |

## Seed

`pnpm db:seed` es idempotente: crea el usuario `demo@example.com` (clave `demo1234`) y "Organización demo" donde es Administrador. Es el usuario de QA de staging.
