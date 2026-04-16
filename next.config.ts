import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Needed for pdf-parse which uses Node.js internals
  serverExternalPackages: ["pdf-parse"],

  // Vercel cron config
  experimental: {},
};

export default nextConfig;
