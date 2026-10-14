import { nextConfig } from "@repo/config/eslint/nextjs";

const playwrightFixtures = {
  files: ["e2e/**/*.ts"],
  rules: { "react-hooks/rules-of-hooks": "off" },
};

export default [
  ...nextConfig,
  playwrightFixtures,
  {
    ignores: [
      "public/sw.js",
      "next-env.d.ts",
      ".next/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];
