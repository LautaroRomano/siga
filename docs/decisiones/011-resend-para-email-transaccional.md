# ADR 011: Resend para el email transaccional

**Fecha:** 2026-09-09 · **Estado:** aceptada

## Contexto

La app necesita mandar emails transaccionales (hoy, la invitación a una organización; cada producto suma los suyos). Las alternativas eran SMTP propio (operarlo y cuidar la reputación), SES (más barato a escala, más configuración) o un proveedor transaccional con API simple y plan gratuito.

## Decisión

**Resend** en su plan gratuito (3.000 emails por mes, 100 por día), con el SDK oficial en `packages/api` (`integrations/email.ts`). Los emails se guardan primero en una **cola de salida en base** (`EmailOutbox`): el envío se intenta al instante y, si el proveedor falla o no está configurado, el cron diario reintenta lo pendiente con espera creciente hasta cinco intentos. Nada de lo que dispara un email espera al proveedor ni falla por él. Las plantillas son funciones puras con HTML propio, sin librería de templates. Prerrequisito de infraestructura: un dominio propio verificado por DNS en Resend (no se puede enviar desde `vercel.app`); hasta entonces `EMAIL_FROM` lleva un placeholder y, sin `RESEND_API_KEY`, la cola acumula sin bloquear.

## Consecuencias

Una tabla y un cron diario (Vercel Hobby admite dos). Los emails pendientes o fallidos quedan visibles en la base con su error. El cupo diario del plan gratuito alcanza para una organización chica; si crece, se sube de plan sin tocar código. Cambiar de proveedor es reemplazar `sendEmail`.
