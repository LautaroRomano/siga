# ADR 006: Archivos en Cloudflare R2 con URLs firmadas

**Fecha:** 2026-09-03 · **Estado:** aceptada

## Contexto

Los archivos que sube el usuario deben ocupar el mínimo espacio y cargar rápido. Guardarlos en Postgres infla la base y encarece backups.

## Decisión

Bucket privado S3-compatible en Cloudflare R2 (egreso gratis). El navegador sube directo con URLs firmadas (`packages/api/src/integrations/storage.ts`). La base guarda solo metadatos. El cliente viene en el template como utilidad opcional, sin ninguna ruta que lo use.

## Consecuencias

Postgres se mantiene chico. Cambiar a S3 de AWS es cambiar endpoint y credenciales. Un producto que no sube archivos deja `STORAGE_*` vacío.
