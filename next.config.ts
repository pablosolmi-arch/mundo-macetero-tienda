import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Prerendering reads the catalog from Supabase. The default of one worker per
    // core opened seven pools at once against the free-tier pooler and pages
    // started timing out, so keep static generation in a single worker: with ~25
    // pages the whole build stays under one pool.
    staticGenerationMinPagesPerWorker: 50,
    staticGenerationMaxConcurrency: 4,
  },
};

export default nextConfig;
