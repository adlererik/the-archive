import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { cpus: 4 },
  outputFileTracingRoot: process.cwd(),
  outputFileTracingExcludes: { "*": ["./work/**", "./public/uploads/**"] },
  images: { unoptimized: true },
};

export default nextConfig;
