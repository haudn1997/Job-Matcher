import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Needed for pdf-parse and playwright-extra which use Node.js internals
  serverExternalPackages: ["pdf-parse", "playwright-extra", "puppeteer-extra-plugin-stealth"],

  // Vercel cron config
  experimental: {},
};

export default nextConfig;
