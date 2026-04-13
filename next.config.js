/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Disable SW in development to avoid confusion with HMR
  disable: process.env.NODE_ENV === "development",
  // Don't precache source maps or middleware manifests
  buildExcludes: [
    /middleware-manifest\.json$/,
    /_buildManifest\.js$/,
    /_ssgManifest\.js$/,
  ],
  // Cache everything — app shell + jsPDF chunk so PDF generation works offline
  runtimeCaching: [],
});

module.exports = withPWA(nextConfig);
