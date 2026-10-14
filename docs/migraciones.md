# Migraciones

Prisma 7 en `packages/db`. Config en `packages/db/prisma.config.ts` (usa `DIRECT_URL`, conexión sin pooler).

## Comandos

| Comando                                | Dónde   | Qué hace                                                   |
| -------------------------------------- | ------- | ---------------------------------------------------------- |
| `pnpm db:migrate`                      | local   | `prisma migrate dev`: genera la migración y la aplica      |
| `pnpm db:deploy`                       | CI/CD   | `prisma migrate deploy`: aplica las pendientes, nunca crea |
| `pnpm --filter @repo/db migrate:check` | CI      | falla si `schema.prisma` difiere de la BD ya migrada       |
| `pnpm db:generate`                     | siempre | regenera el cliente en `packages/db/src/generated`         |
| `pnpm db:seed`                         | local   | usuario demo y su organización (idempotente)               |

Nunca `prisma db push` fuera de local. Nunca `migrate dev` en CI.

El template arranca con una sola migración, `20261013000000_init`, generada desde el schema con `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`. Si la base local tiene drift (por ejemplo, tablas de otro proyecto), una alternativa a `migrate dev` es generar el SQL con `migrate diff` contra una shadow DB y aplicarlo con `migrate deploy`.

## Reglas

1. **Una migración por PR**, con nombre descriptivo (`add_organization_timezone`, no `update`).
2. **Revisar el SQL** generado en `prisma/migrations/<timestamp>_<nombre>/migration.sql` dentro del PR.
3. **Expand/contract**: el código viejo debe seguir funcionando con el schema nuevo durante el deploy.
   - Agregar columnas nullable o con default. Nunca `NOT NULL` sin default en una tabla con datos.
   - Renombrar = agregar la nueva, migrar datos, cambiar el código, borrar la vieja en otra release.
   - Borrar columnas solo cuando ningún código deployado las lea.
4. Migraciones de datos largas van en un script aparte, no en la migración.

## Orden en el deploy

`migrate deploy` corre **antes** de `vercel deploy`. Si la migración falla, el job corta y el código nuevo no se publica.

## Recuperación de una migración fallida

1. Ver estado: `pnpm --filter @repo/db migrate:status` con `DIRECT_URL` del ambiente.
2. Si la migración quedó a medias y se puede revertir a mano, revertir y marcarla: `prisma migrate resolve --rolled-back <nombre>`. Corregir la migración y volver a deployar.
3. Si ya se aplicó pero Prisma no la registró: `prisma migrate resolve --applied <nombre>`.
4. Último recurso: point-in-time restore del branch de Neon (Neon → Branches → Restore).

## Previews

Cada PR con preview tiene su branch de Neon creado desde `staging`, con las migraciones del PR aplicadas. Se borra al cerrar el PR.
