# ADR 007: shadcn/ui sin componentes desde cero

**Fecha:** 2026-09-03 · **Estado:** aceptada

## Contexto

Prioridad en UI/UX simple y moderna con el menor esfuerzo de mantenimiento.

## Decisión

Toda la UI se compone con shadcn/ui (estilo `base-nova`), sus blocks y registries compatibles (ReUI para el calendario). No se escriben componentes visuales propios; el código propio es composición y lógica.

## Consecuencias

`packages/ui` concentra el código vendorizado, que se trata como de terceros (lint relajado, sin reescrituras). Agregar UI nueva empieza por buscar en el registry.
