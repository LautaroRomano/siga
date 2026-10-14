import { defineConfig } from "vitest/config";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? "postgresql://app:app@localhost:5432/app_test";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globalSetup: ["src/test/global-setup.ts"],
    fileParallelism: false,
    env: {
      DATABASE_URL: testDatabaseUrl,
      DIRECT_URL: testDatabaseUrl,
      BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret",
      BETTER_AUTH_URL: "http://localhost:3000",
      CRON_SECRET: "test-cron-secret",
    },
  },
});
