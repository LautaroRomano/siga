import { Prisma } from "./generated/client";
import { measure } from "./timing";

// Cada operación (modelos y raw) suma a la métrica `db` de la request en curso.
export const timingExtension = Prisma.defineExtension({
  name: "timing",
  query: {
    $allOperations: ({ args, query }) => measure("db", () => query(args)),
  },
});
