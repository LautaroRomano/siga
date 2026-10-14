# ADR 001: Next.js full-stack en lugar de NestJS separado

**Fecha:** 2026-09-03 · **Estado:** aceptada

## Contexto

El MVP se deploya en Vercel. Se evaluó React + NestJS (backend separado) contra Next.js con la API dentro.

## Decisión

Next.js 16 con la API montada en el mismo deploy. NestJS en Vercel corre como serverless con cold starts y necesita adaptador; sumaba un segundo deploy sin beneficio para el MVP.

## Consecuencias

Un solo pipeline y un solo hosting. La API se aísla en `packages/api` (ver ADR 004) para poder separarla más adelante.
