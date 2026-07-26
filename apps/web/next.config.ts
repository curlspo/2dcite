import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@2dcite/shared", "@2dcite/api-client", "@2dcite/db"],
  experimental: {
    // monorepo root for file tracing
  },
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
