import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All pages require authentication via Supabase, so disable static generation
  // for the app routes. They will be rendered dynamically at request time.
  experimental: {
    // Use the new proxy file convention (Next.js 16)
  },
};

export default nextConfig;
