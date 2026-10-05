import type { NextConfig } from "next";

/**
 * GITHUB_PAGES=1 → fully static export for GitHub Pages (https://<user>.github.io/<repo>/).
 * Without it → regular Next.js server build (Vercel / Node) with API routes and middleware.
 */
const isPages = process.env.GITHUB_PAGES === "1";
const basePath = isPages ? process.env.NEXT_PUBLIC_BASE_PATH ?? "/ustago" : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isPages ? { output: "export" as const, trailingSlash: true, basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_STATIC_EXPORT: isPages ? "1" : "" },
  images: {
    unoptimized: isPages,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "randomuser.me" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
