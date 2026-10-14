# ADR 002: Postgres en Neon

**Fecha:** 2026-09-03 · **Estado:** aceptada

## Contexto

Opciones: EC2 propio con Postgres, RDS, Supabase, Neon. Prioridad: menor costo y escalabilidad con mínimo trabajo operativo.

## Decisión

Neon. Free tier al inicio, pooler incluido, branches por ambiente y por PR, backups y point-in-time restore. EC2 ahorraría ~10 USD/mes a cambio de administrar Postgres, PgBouncer, SSL, firewall y backups, y de abrir el puerto 5432 a Internet porque Vercel no tiene IP fija.

## Consecuencias

Prisma genera SQL plano: migrar a RDS o EC2 es `pg_dump` + cambiar `DATABASE_URL`. Se usa `@prisma/adapter-pg` (TCP) que funciona igual en local, Neon y RDS.
