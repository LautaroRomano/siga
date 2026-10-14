import { getMe } from "@repo/api/services";
import type { AuthContext } from "@repo/auth";
import { cache } from "react";

// El layout autenticado y las páginas piden quién-soy en el mismo render; `cache()` lo dedupea
// por request cuando reciben la misma sesión (`requireSession` ya la comparte). Aparte de
// `lib/session.ts` para no arrastrar `@repo/db` (que `getMe` importa) a un archivo que los
// tests unitarios usan sin base de datos.
export const getMeCached = cache((session: AuthContext) => getMe(session));
