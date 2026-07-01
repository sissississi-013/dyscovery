import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so a stray lockfile elsewhere on the
  // machine isn't inferred as the root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
