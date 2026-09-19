import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Standalone output bundles only the production dependencies each
   * page actually traces into `.next/standalone`, instead of
   * shipping the full node_modules tree into the Docker runtime
   * image.
   */
  output: "standalone",
};

export default nextConfig;
