import { withSerwist } from "@serwist/turbopack";
import { config } from "dotenv";
import type { NextConfig } from "next";

config({ path: "../../.env" });

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/api", "@repo/auth", "@repo/db", "@repo/domain"],
  typedRoutes: true,
  agentRules: false,
};

export default withSerwist(nextConfig);
