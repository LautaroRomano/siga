import { execSync } from "node:child_process";
import { resolve } from "node:path";

const e2eDatabaseUrl =
  process.env.E2E_DATABASE_URL ?? "postgresql://app:app@localhost:5432/app_e2e";

export default function globalSetup() {
  execSync("pnpm exec prisma migrate deploy", {
    cwd: resolve(import.meta.dirname, "../../../../packages/db"),
    env: { ...process.env, DATABASE_URL: e2eDatabaseUrl, DIRECT_URL: e2eDatabaseUrl },
    stdio: "inherit",
  });
}
