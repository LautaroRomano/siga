import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "../../../.env") });

const outputPath = resolve(import.meta.dirname, "../openapi.json");
const check = process.argv.includes("--check");

const { apiBasePath, createApi } = await import("../src/app");

const response = await createApi().request(`${apiBasePath}/openapi.json`);
const spec = `${JSON.stringify(await response.json(), null, 2)}\n`;

if (check) {
  const current = readFileSync(outputPath, "utf8");
  if (current !== spec) {
    console.error(
      "openapi.json está desactualizado. Ejecutá `pnpm api:openapi` y commiteá el resultado.",
    );
    process.exit(1);
  }
  console.log("openapi.json está actualizado.");
} else {
  writeFileSync(outputPath, spec);
  console.log(`openapi.json generado en ${outputPath}`);
}
