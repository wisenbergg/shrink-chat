// File: next.config.mjs
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isTest = process.env.NODE_ENV === "test";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Don’t let ESLint errors (eg. explicit any) block your production build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Only enable MSW testmode in test runs
  experimental: isTest
    ? {
        testmode: {
          playwright: {
            // your Playwright settings…
          },
        },
      }
    : {},

  webpack(config) {
    config.resolve.alias["@"] = path.join(__dirname, "src");
    return config;
  },
};

export default nextConfig;
