# ADR 003: Better Auth

**Fecha:** 2026-09-03 · **Estado:** aceptada

## Contexto

Se necesitaba Google + email/contraseña, usuarios en la propia base y soporte para un cliente móvil. Alternativas: Auth.js, Clerk.

## Decisión

Better Auth con adapter de Prisma. Email/contraseña viene resuelto (Auth.js lo desaconseja y obliga a implementarlo a mano), Google en dos líneas, plugin `organization` para multi-organización y `bearer` para iOS. Clerk era más plug and play pero saca los usuarios de la base y cobra por volumen.

## Consecuencias

Los tokens OAuth de Google quedan en la tabla `account` y se reutilizan para Calendar.
