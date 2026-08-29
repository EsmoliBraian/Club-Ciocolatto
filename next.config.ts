import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1MB — too small for a real phone photo uploaded as a
    // profile picture. Kept just above customer-actions.ts's own 5MB check
    // so that check (with its friendly error message) is what actually
    // rejects an oversized file, not Next's own hard body-size cutoff.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
