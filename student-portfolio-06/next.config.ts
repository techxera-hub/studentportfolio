import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Alias styled-jsx/style to shim that provides default export
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["styled-jsx/style"] = path.resolve(__dirname, "styled-jsx-style.js");
    return config;
  },
};

export default nextConfig;
