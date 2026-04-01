/** @type {import('next').NextConfig} */
const nextConfig = {
  // Puppeteer and its plugins must not be bundled by webpack
  experimental: {
    serverComponentsExternalPackages: [
      "puppeteer",
      "puppeteer-core",
      "puppeteer-extra",
      "puppeteer-extra-plugin-stealth",
      "@sparticuz/chromium",
      "@prisma/client",
    ],
  },
};

module.exports = nextConfig;
