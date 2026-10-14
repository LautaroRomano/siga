# ADR 004: Hono + zod-openapi como backend consumible desde iOS

**Fecha:** 2026-09-03 · **Estado:** aceptada

## Contexto

Un futuro cliente iOS debe usar el mismo backend. Route Handlers a mano no generan spec; NestJS separado duplica infra.

## Decisión

App Hono en `packages/api` con `@hono/zod-openapi`, montada en `/api/v1` dentro de Next.js. Genera `openapi.json` desde los schemas zod, expone Swagger UI y se tipa el cliente web con `hc`.

## Consecuencias

Un solo código de negocio para web e iOS. La API se puede extraer a un servicio propio sin reescribir rutas ni servicios.
