/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // dropped experimental.typedRoutes so Turbopack has no conflicts
  webpack(config) {
    config.resolve.alias['@'] = require('path').join(__dirname, 'src');
    return config;
  }
};

module.exports = nextConfig;
