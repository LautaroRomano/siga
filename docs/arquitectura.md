# Arquitectura

## Monorepo

pnpm workspaces + Turborepo. Un solo artefacto deployado: `apps/web`. Los paquetes se consumen como fuente TypeScript (sin build propio); Next.js los transpila con `transpilePackages`.

```
apps/web  ──▶  packages/api ──▶ packages/db
   │  │  │          │  └──────▶ packages/auth ──▶ packages/db
   │  │  └────────▶ packages/domain
   │  └───────────▶ packages/ui
   └──────────────▶ packages/auth
```

Reglas de dependencia:

- `domain` no depende de nada del repo. Solo zod. Es la fuente de verdad de validaciones y enums.
- `db` depende de Prisma. Expone el cliente con auditoría y medición, y los tipos generados.
- `auth` depende de `db`. Instancia Better Auth y expone `getAuthContext` / `requireAuthContext`.
- `api` depende de `db`, `auth`, `domain`. Nada de Next.js adentro.
- `ui` depende solo de React, shadcn y Tailwind.
- `web` depende de todos.

## Por qué Hono dentro de Next.js

La API vive en `packages/api` como una app Hono independiente. Next.js solo la monta en `apps/web/app/api/v1/[[...route]]/route.ts` con `hono/vercel`. Ventajas:

- Un solo deploy en Vercel.
- Spec OpenAPI generada a partir de los schemas zod (`packages/api/openapi.json`) para generar el cliente móvil.
- Cliente tipado (`hc`) para la web sin duplicar tipos.
- Extraíble: `createApi()` corre en Node, Bun, Lambda o un contenedor cambiando solo el adaptador.

## Cómo se consume la API desde la web

- **Server Components** llaman a los servicios de `packages/api/services` directamente (ejemplo: `apps/web/lib/me-cache.ts`, que `app/(app)/layout.tsx` usa para quién-soy). Sin HTTP interno.
- **Client Components** usan el cliente `hc` (`apps/web/lib/api-client.ts`) con React Query (`apps/web/hooks/*`).

Ambos caminos ejecutan la misma lógica de `packages/api/src/services`.

## Capas dentro de la API

```
routes/       createRoute + handler: valida, llama al servicio, devuelve DTO
services/     lógica de negocio, acceso a Prisma, serialización a DTO
integrations/ email (Resend), storage S3
```

Las rutas no contienen lógica. Los servicios no conocen Hono.

Lo que puede esperar a después de responder (emails, integraciones) pasa por `runDeferred` (`src/deferred.ts`): la app recibe un adaptador en `createApi({ defer })` y lo deja en un `AsyncLocalStorage` durante la request. Next lo inyecta con `after` desde la ruta; `packages/api` sigue sin depender de Next y, sin adaptador, todo corre en línea. La medición por request (`Server-Timing`, `src/timing.ts`) usa el mismo mecanismo desde `@repo/db`, que es donde vive la extensión de Prisma que suma cada consulta.

## Tenancy

El tenant es la **organización** = `Organization` de Better Auth. Se crea automáticamente al registrarse (hook en `packages/auth/src/server.ts`). Cada request lleva `organizationId` desde la sesión activa y todo servicio filtra por él. Las entidades del producto cuelgan de la organización con `organizationId`.

## Auditoría

`packages/db/src/audit-extension.ts` es una extensión de Prisma que registra en `audit_log` cada `create`, `update` y `delete` de las entidades listadas en `auditedModels` (el producto agrega las suyas). El actor viene de un `AsyncLocalStorage` que el middleware de la API setea por request (`runWithAuditActor`).

## Cómo extraer la API a un servicio propio

1. Crear `apps/api` con un servidor Hono (`@hono/node-server`) que importe `createApi()`.
2. Mover `BETTER_AUTH_URL` y cookies a un dominio compartido o usar solo bearer tokens.
3. Apuntar `NEXT_PUBLIC_APP_URL` / `createApiClient(baseUrl)` al nuevo host.
4. Nada en `packages/api` cambia.
