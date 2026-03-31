/** @type {import('next').NextConfig} */
const nextConfig = {
  // Puppeteer and its plugins must not be bundled by webpack
  experimental: {
    serverComponentsExternalPackages: [
      "puppeteer",
      "puppeteer-extra",
      "puppeteer-extra-plugin-stealth",
    ],
  },
};

module.exports = nextConfig;
