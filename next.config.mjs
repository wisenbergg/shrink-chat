import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isTest = process.env.NODE_ENV === 'test';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Conditionally enable MSW testmode only in test runs
  experimental: isTest
    ? {
        testmode: {
          playwright: {
            // your Playwright config here
          }
        }
      }
    : {},

  webpack(config) {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  }
};

export default nextConfig;
