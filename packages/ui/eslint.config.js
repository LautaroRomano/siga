import { nextConfig } from "@repo/config/eslint/nextjs";

const vendoredRegistryCode = {
  files: ["src/components/**", "src/hooks/**"],
  rules: {
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/unbound-method": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-unnecessary-type-assertion": "off",
    "@typescript-eslint/no-floating-promises": "off",
    "@typescript-eslint/no-misused-promises": "off",
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    "react-hooks/set-state-in-effect": "off",
    "react-hooks/refs": "off",
    "react-hooks/immutability": "off",
    "react-hooks/purity": "off",
    "react-hooks/exhaustive-deps": "off",
    "react/no-unknown-property": "off",
    "import-x/order": "off",
    "import-x/no-cycle": "off",
  },
};

export default [...nextConfig, vendoredRegistryCode];
