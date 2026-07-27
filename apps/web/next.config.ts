import type { NextConfig } from "next";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");

const nextConfig: NextConfig = {
  transpilePackages: ["@2dcite/shared", "@2dcite/api-client", "@2dcite/db"],
  serverExternalPackages: ["@prisma/client", "prisma"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Never ship browser source maps that aid reverse-engineering / stack mapping
  productionBrowserSourceMaps: false,
  // Only NEXT_PUBLIC_* vars are ever available to the browser bundler.
  // Do not map server secrets into `env` here.
  // Allowed public vars (non-secret): NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_API_URL,
  // and optionally NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_* only — never sk_*).
  // Ensure Prisma query engine binaries are included on Vercel (monorepo)
  outputFileTracingIncludes: {
    "/*": [
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*",
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/**/*",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};

export default nextConfig;
