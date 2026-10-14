# ADR 010: Reutilizar patrones de UI antes que inventar

**Fecha:** 2026-09-08 · **Estado:** aceptada

## Contexto

La ADR 007 fijó de dónde salen los componentes visuales, pero no qué pasa con las composiciones propias. En el producto de origen, un buscador de entidad con creación rápida terminó escrito cuatro veces por copia, y `docs/ui.md` describía uno como "espejo" de otro: agregarlo en un formulario nuevo significaba copiar un archivo más y arriesgar que se comportara distinto.

## Decisión

`docs/ui.md` es el catálogo vinculante de patrones y se lee antes de diseñar una interacción nueva: si el patrón existe, se usa tal cual. Los ya fijados:

- **Confirmación de una acción destructiva**: `ConfirmDialog`, con "Volver" y el verbo de la acción.
- **Listados de entidades**: `ItemGroup` de `Item` con título, descripción y un menú de acciones.
- **Formularios siempre en pop-up centrado** (`Dialog`), nunca en panel lateral; el único `Sheet` es el menú de navegación en móvil.
- **Todo pop-up desenfoca el fondo**, siempre y con la misma intensidad, incluidos los anidados.
- **Formularios con scroll vertical**, nunca horizontal: el contenido se adapta al ancho.

Una composición propia repetida en tres o más lugares se extrae a un componente compartido en `apps/web/components/`. Con dos usos todavía no hay evidencia de cuál es la abstracción correcta.

## Consecuencias

Una interacción nueva empieza por leer el catálogo, y mantenerlo es parte de la regla de actualizar `docs/*.md` cuando cambia comportamiento documentado. Al extraer se separa el armazón de lo que cada uso dibuja: el componente compartido se queda con la estructura y cada uso sigue definiendo su contenido, que es lo único que difiere de verdad.
