import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Turbopack alias (used by Vercel/Next.js 16 default builds)
  turbopack: {
    resolveAlias: {
      "styled-jsx/style": "./styled-jsx-style.js",
    },
  },
  // Webpack alias (used by vinext local dev)
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["styled-jsx/style"] = path.resolve(__dirname, "styled-jsx-style.js");
    return config;
  },
};

export default nextConfig;
