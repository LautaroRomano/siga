import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": import.meta.dirname },
  },
  test: {
    environment: "jsdom",
    include: ["lib/**/*.test.ts", "components/**/*.test.tsx", "hooks/**/*.test.{ts,tsx}"],
    setupFiles: ["test/setup.ts"],
    css: false,
    env: { TZ: "America/Argentina/Buenos_Aires" },
  },
});
