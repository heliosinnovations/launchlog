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
      {
        // GitHub OpenGraph preview images for repo screenshots
        protocol: "https",
        hostname: "opengraph.githubassets.com",
        pathname: "/**",
      },
      {
        // GitHub repository images (e.g., social previews)
        protocol: "https",
        hostname: "repository-images.githubusercontent.com",
        pathname: "/**",
      },
      {
        // User-uploaded screenshots stored in Supabase Storage
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Required for Puppeteer/Chromium to work in serverless environment
  // These packages should not be bundled - they're loaded at runtime
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "sharp"],
};

export default nextConfig;
