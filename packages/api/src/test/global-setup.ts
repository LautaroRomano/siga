import { execSync } from "node:child_process";
import { resolve } from "node:path";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? "postgresql://app:app@localhost:5432/app_test";

export default function setup() {
  execSync("pnpm exec prisma migrate deploy", {
    cwd: resolve(import.meta.dirname, "../../../db"),
    env: { ...process.env, DATABASE_URL: testDatabaseUrl, DIRECT_URL: testDatabaseUrl },
    stdio: "inherit",
  });
}
