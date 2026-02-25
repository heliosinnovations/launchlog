import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/u/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  // Required for Puppeteer/Chromium to work in serverless environment
  // These packages should not be bundled - they're loaded at runtime
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "sharp"],
};

export default nextConfig;
