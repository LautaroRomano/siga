# ADR 009: Principios de interacción

**Fecha:** 2026-09-08 · **Estado:** aceptada

## Contexto

La app se usa en escritorio y como PWA en el celular, y cada feature volvía a decidir cómo se siente: si el botón lleva spinner, si el listado lleva skeleton, si un elemento clickeable resalta, si algo se anima. Los dos primeros ya estaban en `docs/ui.md` como convención; el movimiento, el hover y el responsive no estaban escritos.

## Decisión

Cinco principios vinculantes para toda feature nueva:

1. **Movimiento.** Las transiciones son las que traen shadcn/Base UI y `tw-animate-css`. No se suman librerías de animación ni animaciones decorativas; una propia se justifica solo si comunica un cambio de estado. Todo movimiento respeta `prefers-reduced-motion`.
2. **Feedback de acción.** Toda acción asíncrona deshabilita su control y muestra `Spinner`, sin cambiar el texto del botón.
3. **Feedback de carga.** Todo dato asíncrono muestra `Skeleton` del tamaño de lo que va a aparecer, nunca un vacío engañoso.
4. **Hover.** Todo elemento con acción al presionarse muestra estado hover, y a los componentes de shadcn no se les quita el que ya traen.
5. **Responsive.** Mobile-first. La página nunca scrollea a lo ancho; el scroll horizontal vale solo dentro de un contenedor que lo declara.

## Consecuencias

El review de cada ticket de UI se corre contra estos cinco puntos. El 5 lo verifica el proyecto `mobile` de Playwright; los otros cuatro quedan en el review, como la regla de la ADR 007. El detalle operativo vive en `docs/ui.md` y puede crecer sin tocar esta ADR.
