# PWA

Implementada con `@serwist/turbopack` (compatible con Turbopack, el bundler por defecto de Next.js 16).

## Archivos

- `apps/web/app/sw.ts`: service worker. Precache del shell; `NetworkFirst` para `GET /api/v1/*` (3 s) y para páginas (5 s); fallback a `/~offline` cuando no hay red.
- `apps/web/app/serwist/[path]/route.ts`: sirve `/serwist/sw.js` compilado. La revisión del precache usa `VERCEL_GIT_COMMIT_SHA`.
- `apps/web/app/providers.tsx`: `SerwistProvider` registra el SW.
- `apps/web/app/manifest.webmanifest/route.ts`: Web App Manifest (`/manifest.webmanifest`), `display: standalone`, `start_url: /`. El JSON lo arma `apps/web/lib/manifest.ts` con el nombre de `apps/web/lib/product.ts`.
- `apps/web/public/icons/*`: íconos 192/512, maskable y apple-touch. Para cambiar el ícono del producto se reemplazan estos PNG.

El manifest y los íconos se sirven sin sesión (el navegador o el SO los piden sin cookies).

## Qué funciona offline

- Abrir la app instalada y navegar a páginas ya visitadas.
- Ver la última respuesta cacheada de la API.
- Las escrituras offline (cola de sincronización) no están incluidas.

## Zoom en móvil

La app se comporta como una app nativa: no hace zoom ni con pinch ni con doble toque. Son dos medidas complementarias en `apps/web/lib/viewport.ts` (exportado como `viewport` desde `app/layout.tsx`) y en el `<html>` del layout:

| Medida                                                                                             | Qué bloquea                                      | Dónde aplica                                                                                               |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `maximumScale: 1` + `userScalable: false` en el meta viewport                                      | Pinch-zoom y doble toque                         | Chrome Android y iOS con la app instalada (`display: standalone`). Safari en pestaña lo ignora a propósito |
| `touch-action: manipulation` (clase `touch-manipulation`)                                          | Zoom por doble toque (mantiene scroll y pinch)   | Todos los navegadores móviles, incluido Safari en pestaña                                                  |
| `overscroll-behavior: none` en el `body` (clase `overscroll-none`) + shell `h-svh overflow-hidden` | Rebote del documento y encadenamiento del scroll | iOS 16+ (pestaña e instalada) y Chrome Android                                                             |

El auto-zoom de iOS al enfocar un campo no ocurre porque el `Input` de shadcn usa 16 px en móvil (`text-base`).

Trade-off asumido: deshabilitar el zoom del usuario baja el puntaje de accesibilidad de Lighthouse. Se acepta porque la PWA tiene que sentirse como una app y los textos ya usan tamaños legibles.

## Verificación

Lighthouse → categoría PWA en una preview. En DevTools → Application → Service Workers debe aparecer `/serwist/sw.js` activo. El e2e `pwa.spec.ts` verifica el manifest, el meta viewport y el `touch-action` del documento.
